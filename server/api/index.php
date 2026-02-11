<?php
/**
 * MaruAudio 服务端 API 入口
 */

// 错误处理
error_reporting(E_ALL);
ini_set('display_errors', 0);

// 处理 OPTIONS 预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    exit;
}

// 统一设置 CORS 头（仅在入口设置一次，避免每次响应重复设置）
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 加载基础类库
require_once __DIR__ . '/lib/Cache.php';
require_once __DIR__ . '/lib/Database.php';
require_once __DIR__ . '/lib/Response.php';
require_once __DIR__ . '/lib/JWTAuth.php';
require_once __DIR__ . '/lib/Logger.php';
require_once __DIR__ . '/lib/APM.php';

// 开始性能监控
APM::start();

// 重放攻击检测（基于时间戳和 nonce）
function checkReplayAttack($timestamp, $nonce) {
    // 时间戳检查：请求必须在 5 分钟内
    $now = time();
    if (abs($now - $timestamp) > 300) {
        return false;
    }
    
    // Nonce 检查：防止重复请求
    $cacheDir = sys_get_temp_dir() . '/maruaudio_nonce';
    if (!is_dir($cacheDir)) {
        @mkdir($cacheDir, 0755, true);
    }
    
    $nonceFile = $cacheDir . '/' . md5($nonce) . '.txt';
    if (file_exists($nonceFile)) {
        // nonce 已被使用，判定为重放
        return false;
    }
    
    // 记录 nonce，5 分钟后视为过期
    file_put_contents($nonceFile, $now);
    
    // 清理过期的 nonce 文件（每 100 次请求触发一次清理）
    if (rand(1, 100) === 1) {
        $files = glob($cacheDir . '/*.txt');
        foreach ($files as $file) {
            if (filemtime($file) < $now - 300) {
                @unlink($file);
            }
        }
    }
    
    return true;
}

// 请求签名密钥
// IMPORTANT: 生产环境必须通过环境变量配置签名密钥，不要使用默认值
// 环境变量名（按优先级）：
//   1. MARUAUDIO_API_SIGN_SECRET (推荐)
//   2. API_SIGN_SECRET (兼容旧配置)
// 配置示例：
//   export MARUAUDIO_API_SIGN_SECRET="your-secret-key-here"
//   或在 .env 文件中：MARUAUDIO_API_SIGN_SECRET=your-secret-key-here
$apiSignSecret = getenv('MARUAUDIO_API_SIGN_SECRET') ?: (getenv('API_SIGN_SECRET') ?: 'CHANGE_ME');

// 生产环境检查：如果使用默认值，记录警告
if ($apiSignSecret === 'CHANGE_ME' && (getenv('MARUAUDIO_ENV') === 'production' || !getenv('MARUAUDIO_DEBUG'))) {
    error_log('WARNING: API_SIGN_SECRET is using default value. Please configure via environment variable in production!');
}

define('API_SIGN_SECRET', $apiSignSecret);

// 校验请求签名
function verifySignature($data, $timestamp, $signature) {
    // 按键名排序后序列化（与客户端保持一致）
    if ($data) {
        ksort($data);
        $sortedData = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        // 移除多余空格，保持与 Python 的 separators=(',', ':') 一致
        $sortedData = str_replace([': ', ', '], [':', ','], $sortedData);
    } else {
        $sortedData = "";
    }
    
    $message = $timestamp . ':' . $sortedData;
    $expectedSig = hash_hmac('sha256', $message, API_SIGN_SECRET);
    return hash_equals($expectedSig, $signature);
}

// 对敏感接口进行请求签名校验
function checkRequestSignature($input) {
    // 未配置签名密钥时，视为验证失败（避免误以为已开启保护）
    if (API_SIGN_SECRET === 'CHANGE_ME') {
        return false;
    }
    // 获取签名相关请求头
    $timestamp = $_SERVER['HTTP_X_TIMESTAMP'] ?? '';
    $signature = $_SERVER['HTTP_X_SIGNATURE'] ?? '';
    
    // 缺少签名头时直接视为验证失败（更安全的默认行为）
    if (empty($timestamp) || empty($signature)) {
        return false;
    }
    
    // 检查时间戳是否在允许范围内（单位：秒）
    $now = time();
    if (abs($now - intval($timestamp)) > 300) {
        return false;
    }
    
    // 校验签名是否正确
    return verifySignature($input, $timestamp, $signature);
}

// 简单的基于文件的请求频率限制
function checkRateLimit($ip, $limit = 60, $window = 60) {
    $cacheDir = sys_get_temp_dir() . '/maruaudio_rate_limit';
    if (!is_dir($cacheDir)) {
        @mkdir($cacheDir, 0755, true);
    }
    
    $cacheFile = $cacheDir . '/' . md5($ip) . '.json';
    $now = time();
    
    $data = ['count' => 0, 'reset' => $now + $window];
    if (file_exists($cacheFile)) {
        $data = json_decode(file_get_contents($cacheFile), true) ?: $data;
    }
    
    // 重置时间窗口
    if ($now >= $data['reset']) {
        $data = ['count' => 0, 'reset' => $now + $window];
    }
    
    $data['count']++;
    file_put_contents($cacheFile, json_encode($data));
    
    return $data['count'] <= $limit;
}

$clientIp = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
if (!checkRateLimit($clientIp, 120, 60)) {
    Response::error('请求过于频繁，请稍后重试', 4029);
}

// 获取请求路径
$requestUri = $_SERVER['REQUEST_URI'];
$basePath = '/api';
$path = str_replace($basePath, '', parse_url($requestUri, PHP_URL_PATH));
$path = trim($path, '/');

// 获取请求方法
$method = $_SERVER['REQUEST_METHOD'];

// 获取请求数据（合并 GET / POST / JSON Body）
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$input = array_merge($_GET, $_POST, $input);

// 对部分敏感接口启用请求签名校验
$signatureRequiredPaths = [
    'user/info',
    'user/activate',
    'user/invite-info',
    'user/withdraw',
];
if (in_array($path, $signatureRequiredPaths)) {
    if (!checkRequestSignature($input)) {
        Response::error('请求签名校验失败', 4030);
    }
}

// 路由分发
try {
    switch ($path) {
        // 健康检查
        case '':
        case 'health':
            Response::success([
                'status' => 'ok',
                'version' => '1.0.0',
                'time' => date('Y-m-d H:i:s')
            ]);
            break;
            
        // 公共配置（无需登录，config/settings 为兼容别名）
        case 'config':
        case 'config/settings':
            require_once __DIR__ . '/controllers/ConfigController.php';
            ConfigController::getPublicConfig();
            break;
            
        // 获取活动公告（无需登录）
        case 'announcements':
            require_once __DIR__ . '/controllers/ConfigController.php';
            ConfigController::getActiveAnnouncements();
            break;
            
        // 认证相关
        case 'auth/register':
            require_once __DIR__ . '/controllers/AuthController.php';
            AuthController::register($input);
            break;
            
        case 'auth/login':
            require_once __DIR__ . '/controllers/AuthController.php';
            AuthController::login($input);
            break;
            
        case 'auth/refresh-token':
            require_once __DIR__ . '/controllers/AuthController.php';
            AuthController::refreshToken($input);
            break;
            
        case 'auth/smart-login':
            require_once __DIR__ . '/controllers/AuthController.php';
            AuthController::smartLogin($input);
            break;
            
        case 'auth/send-code':
            require_once __DIR__ . '/controllers/AuthController.php';
            AuthController::sendCode($input);
            break;
            
        case 'auth/reset-password':
            require_once __DIR__ . '/controllers/AuthController.php';
            AuthController::resetPassword($input);
            break;
            
        // 用户相关
        case 'user/info':
            require_once __DIR__ . '/controllers/UserController.php';
            UserController::info();
            break;
            
        case 'user/activate':
            require_once __DIR__ . '/controllers/UserController.php';
            UserController::activate($input);
            break;
            
        case 'user/invite-info':
            require_once __DIR__ . '/controllers/UserController.php';
            UserController::getInviteInfo();
            break;
            
        case 'user/invite-records':
            require_once __DIR__ . '/controllers/UserController.php';
            UserController::getInviteRecords($input);
            break;
            
        case 'user/withdraw':
            require_once __DIR__ . '/controllers/UserController.php';
            UserController::requestWithdraw($input);
            break;
            
        case 'user/messages':
            require_once __DIR__ . '/controllers/UserController.php';
            UserController::getMessages($input);
            break;
            
        case 'user/messages/read':
            require_once __DIR__ . '/controllers/UserController.php';
            UserController::markMessageRead($input);
            break;
            
        case 'user/sync':
            require_once __DIR__ . '/controllers/UserController.php';
            UserController::sync();
            break;
            
        // 管理员登录相关
        case 'admin/login':
            require_once __DIR__ . '/controllers/AdminController.php';
            AdminController::login($input);
            break;
            
        case 'admin/verify':
            require_once __DIR__ . '/controllers/AdminController.php';
            AdminController::verify($input);
            break;
            
        // 管理后台 API
        case 'admin/stats':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::getStats();
            break;
            
        case 'admin/users':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            if ($method === 'GET') {
                AdminApiController::getUsers($input);
            } else {
                AdminApiController::updateUser($input);
            }
            break;
            
        case 'admin/users/toggle-status':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::toggleUserStatus($input);
            break;
            
        case 'admin/users/logs':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::getUserLogs($input);
            break;
            
        case 'admin/users/invites':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::getUserInvites($input);
            break;
            
        case 'admin/users/commissions':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::getUserCommissions($input);
            break;
        
        case 'admin/users/reset-password':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::resetUserPassword($input);
            break;
        
        case 'admin/users/machines':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::getUserMachines($input);
            break;
        
        case 'admin/users/machines/unbind':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::unbindUserMachine($input);
            break;
        
        case 'admin/users/machines/bind':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::bindUserMachine($input);
            break;
        
        case 'admin/users/machines/verify':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::verifyUserMachine($input);
            break;
            
        case 'admin/users/export':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::exportUsers($input);
            break;
            
        case 'admin/cards/export':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::exportCards($input);
            break;
            
        case 'admin/logs':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::getOperationLogs($input);
            break;
            
        case 'admin/announcements':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            if ($method === 'GET') {
                AdminApiController::getAnnouncements($input);
            } else {
                AdminApiController::saveAnnouncement($input);
            }
            break;
            
        case 'admin/announcements/delete':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::deleteAnnouncement($input);
            break;
            
        case 'admin/versions':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::getVersionHistory($input);
            break;
            
        case 'admin/versions/publish':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::publishVersion($input);
            break;
            
        case 'admin/backups':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::getBackupList($input);
            break;
            
        case 'admin/backups/create':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::backupDatabase($input);
            break;
            
        case 'admin/logs/cleanup':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::cleanupLogs($input);
            break;
            
        case 'admin/cards':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::getCards($input);
            break;
            
        case 'admin/cards/generate':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::generateCards($input);
            break;
            
        case 'admin/cards/disable':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::disableCard($input);
            break;
            
        case 'admin/cards/delete':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::deleteCard($input);
            break;
            
        case 'admin/settings':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            if ($method === 'GET') {
                AdminApiController::getSettings();
            } else {
                AdminApiController::updateSettings($input);
            }
            break;
            
        case 'admin/profile':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::updateAdmin($input);
            break;
            
        case 'admin/test-mail':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::testMail($input);
            break;
            
        case 'admin/withdrawals':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::getWithdrawals($input);
            break;
            
        case 'admin/withdrawals/process':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::processWithdrawal($input);
            break;
            
        case 'admin/upload':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::upload();
            break;
            
        case 'admin/test-dashscope':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::testDashScopeApi($input);
            break;
        
        // 管理后台 - 字符包统计相关
        case 'admin/character-pack/stats':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::getCharacterPackStats();
            break;
        
        case 'admin/character-pack/codes':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::getCharacterPackCodes($input);
            break;
        
        case 'admin/character-pack/users':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::getCharacterPackUsers($input);
            break;
        
        case 'admin/character-pack/packages':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::getCharacterPackPackages();
            break;
        
        case 'admin/character-pack/packages/update':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::updateCharacterPackPackages($input);
            break;
            
        case 'config/release-version':
            require_once __DIR__ . '/controllers/ConfigController.php';
            ConfigController::getReleaseVersion($input);
            break;
            
        // 字符包业务接口（客户端）
        case 'character-pack/balance':
            require_once __DIR__ . '/controllers/CharacterPackController.php';
            CharacterPackController::getBalance();
            break;
            
        case 'character-pack/activate':
            require_once __DIR__ . '/controllers/CharacterPackController.php';
            CharacterPackController::activate($input);
            break;
            
        case 'character-pack/consume':
            require_once __DIR__ . '/controllers/CharacterPackController.php';
            CharacterPackController::consume($input);
            break;
            
        case 'character-pack/refund':
            require_once __DIR__ . '/controllers/CharacterPackController.php';
            CharacterPackController::refund($input);
            break;
            
        case 'character-pack/packages':
            require_once __DIR__ . '/controllers/CharacterPackController.php';
            CharacterPackController::getPackages();
            break;
            
        case 'character-pack/logs':
            require_once __DIR__ . '/controllers/CharacterPackController.php';
            CharacterPackController::getUsageLogs();
            break;
            
        case 'character-pack/estimate':
            require_once __DIR__ . '/controllers/CharacterPackController.php';
            CharacterPackController::estimate($input);
            break;
            
        case 'character-pack/verify-auth':
            require_once __DIR__ . '/controllers/CharacterPackController.php';
            CharacterPackController::verifyAuthCode($input);
            break;
            
        // 管理后台 - 字符包激活码生成/禁用/删除
        case 'admin/character-pack/codes/generate':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::generateCharacterPackCodes($input);
            break;
            
        case 'admin/character-pack/codes/disable':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::disableCharacterPackCode($input);
            break;
            
        case 'admin/character-pack/codes/delete':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::deleteCharacterPackCode($input);
            break;
            
        case 'admin/character-pack/users/adjust':
            require_once __DIR__ . '/controllers/AdminApiController.php';
            AdminApiController::adjustUserCharacterBalance($input);
            break;
            
        default:
            Response::error('接口不存在', 404);
    }
} catch (Exception $e) {
    Logger::error('Unhandled exception', [
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
    Response::error($e->getMessage(), 5001);
} finally {
    // 结束性能监控
    APM::end();
}
