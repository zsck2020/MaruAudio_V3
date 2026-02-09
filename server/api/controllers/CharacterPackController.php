<?php
/**
 * 字符包控制器
 * 处理云端字符包相关的所有API请求
 */
class CharacterPackController {
    
    /**
     * 获取用户字符余额
     */
    public static function getBalance() {
        $payload = JWTAuth::getPayloadFromRequest();
        
        if (!$payload) {
            Response::error('未登录或Token已过期', 4001);
        }
        
        $userId = $payload['user_id'];
        $db = Database::getInstance();
        
        // 获取用户余额
        $balance = $db->fetch(
            "SELECT total_characters, used_characters, balance, expire_time, last_use_time 
             FROM user_character_balance WHERE user_id = ?",
            [$userId]
        );
        
        if (!$balance) {
            // 用户还没有余额记录，返回默认值
            $balance = [
                'total_characters' => 0,
                'used_characters' => 0,
                'balance' => 0,
                'expire_time' => null,
                'last_use_time' => null
            ];
        }
        
        // 检查是否过期
        $isExpired = false;
        if ($balance['expire_time'] && strtotime($balance['expire_time']) < time()) {
            $isExpired = true;
        }
        
        // 获取字符消耗说明
        $notice = $db->fetch(
            "SELECT setting_value FROM system_settings WHERE setting_key = 'character_pack_notice'"
        );
        
        Response::success([
            'balance' => (int)$balance['balance'],
            'total_characters' => (int)$balance['total_characters'],
            'used_characters' => (int)$balance['used_characters'],
            'expire_time' => $balance['expire_time'],
            'is_expired' => $isExpired,
            'last_use_time' => $balance['last_use_time'],
            'notice' => $notice ? $notice['setting_value'] : '1个中文=2字符，1个英文/数字/标点/空格=1字符'
        ]);
    }
    
    /**
     * 激活字符包
     */
    public static function activate() {
        global $input;
        
        $payload = JWTAuth::getPayloadFromRequest();
        
        if (!$payload) {
            Response::error('未登录或Token已过期', 4001);
        }
        
        $userId = $payload['user_id'];
        $code = trim($input['code'] ?? $_POST['code'] ?? '');
        
        if (empty($code)) {
            Response::error('请输入激活码', 3001);
        }
        
        if (strlen($code) > 255) {
            Response::error('激活码长度超出限制', 3001);
        }
        
        $db = Database::getInstance();
        
        // 开启事务
        $db->beginTransaction();
        
        try {
            // 查找激活码（加锁防止并发）
            $packCode = $db->fetch(
                "SELECT * FROM character_pack_codes WHERE code = ? AND status = 'unused' FOR UPDATE",
                [$code]
            );
            
            if (!$packCode) {
                $db->rollback();
                // 检查是否已被使用
                $usedCode = $db->fetch(
                    "SELECT status FROM character_pack_codes WHERE code = ?",
                    [$code]
                );
                if ($usedCode && $usedCode['status'] === 'used') {
                    Response::error('该激活码已被使用', 3002);
                }
                Response::error('激活码无效或已过期', 3003);
            }
            
            // 计算到期时间
            $expireTime = date('Y-m-d H:i:s', strtotime("+{$packCode['validity_days']} days"));
            
            // 更新激活码状态
            $db->update('character_pack_codes', [
                'status' => 'used',
                'used_at' => date('Y-m-d H:i:s'),
                'used_by' => $userId
            ], 'id = ?', [$packCode['id']]);
            
            // 获取或创建用户余额记录
            $balance = $db->fetch(
                "SELECT * FROM user_character_balance WHERE user_id = ? FOR UPDATE",
                [$userId]
            );
            
            if ($balance) {
                // 更新余额
                $newBalance = $balance['balance'] + $packCode['characters'];
                $newTotal = $balance['total_characters'] + $packCode['characters'];
                
                // 如果当前余额已过期，重置到期时间；否则取较晚的到期时间
                $newExpireTime = $expireTime;
                if ($balance['expire_time'] && strtotime($balance['expire_time']) > time()) {
                    // 当前余额未过期，取较晚的到期时间
                    $newExpireTime = max(strtotime($balance['expire_time']), strtotime($expireTime));
                    $newExpireTime = date('Y-m-d H:i:s', $newExpireTime);
                }
                
                $db->update('user_character_balance', [
                    'balance' => $newBalance,
                    'total_characters' => $newTotal,
                    'expire_time' => $newExpireTime
                ], 'user_id = ?', [$userId]);
                
                $balanceBefore = $balance['balance'];
                $balanceAfter = $newBalance;
            } else {
                // 创建新记录
                $db->insert('user_character_balance', [
                    'user_id' => $userId,
                    'total_characters' => $packCode['characters'],
                    'used_characters' => 0,
                    'balance' => $packCode['characters'],
                    'expire_time' => $expireTime
                ]);
                
                $balanceBefore = 0;
                $balanceAfter = $packCode['characters'];
            }
            
            // 记录日志
            $db->insert('character_usage_logs', [
                'user_id' => $userId,
                'action' => 'recharge',
                'characters' => $packCode['characters'],
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'source' => 'activation_code',
                'source_id' => $packCode['code'],
                'ip' => $_SERVER['REMOTE_ADDR'] ?? null
            ]);
            
            $db->commit();
            
            // 获取套餐名称
            $packConfig = $db->fetch(
                "SELECT name FROM character_pack_config WHERE pack_type = ?",
                [$packCode['pack_type']]
            );
            
            // 通过 WebSocket 推送余额更新通知
            self::notifyBalanceUpdated($userId, $balanceAfter, $expireTime);
            
            Response::success([
                'message' => '激活成功',
                'pack_name' => $packConfig ? $packConfig['name'] : $packCode['pack_type'],
                'characters_added' => (int)$packCode['characters'],
                'new_balance' => (int)$balanceAfter,
                'expire_time' => $expireTime
            ]);
            
        } catch (Exception $e) {
            $db->rollback();
            // 记录详细错误到日志
            require_once __DIR__ . '/../lib/Logger.php';
            Logger::error('字符包激活失败', [
                'user_id' => $userId,
                'code' => $code,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            Response::error('激活失败，请稍后重试', 5001);
        }
    }
    
    /**
     * 消耗字符（生成前调用）
     * 采用预扣机制：先扣除，生成失败后退还
     */
    public static function consume() {
        global $input;
        
        $payload = JWTAuth::getPayloadFromRequest();
        
        if (!$payload) {
            Response::error('未登录或Token已过期', 4001);
        }
        
        $userId = $payload['user_id'];
        $text = trim($input['text'] ?? $_POST['text'] ?? '');
        $machineCode = trim($input['machine_code'] ?? $_POST['machine_code'] ?? '');
        
        if (empty($text)) {
            Response::error('文本不能为空', 3001);
        }
        
        // 限制文本长度（防止过长的文本导致性能问题）
        if (mb_strlen($text, 'UTF-8') > 100000) {
            Response::error('文本长度不能超过100000字符', 3001);
        }
        
        if (strlen($machineCode) > 255) {
            Response::error('机器码长度超出限制', 3001);
        }
        
        // 计算字符数
        $characters = self::calculateCharacters($text);
        
        if ($characters <= 0) {
            Response::error('无效的文本', 3002);
        }
        
        $db = Database::getInstance();
        
        // 开启事务
        $db->beginTransaction();
        
        try {
            // 获取用户余额（加锁）
            $balance = $db->fetch(
                "SELECT * FROM user_character_balance WHERE user_id = ? FOR UPDATE",
                [$userId]
            );
            
            if (!$balance || $balance['balance'] <= 0) {
                $db->rollback();
                Response::error('字符余额不足，请购买字符包', 3003);
            }
            
            // 检查是否过期
            if ($balance['expire_time'] && strtotime($balance['expire_time']) < time()) {
                $db->rollback();
                Response::error('字符包已过期，请重新购买', 3004);
            }
            
            // 检查余额是否足够
            if ($balance['balance'] < $characters) {
                $db->rollback();
                Response::error("字符余额不足，需要 {$characters} 字符，当前余额 {$balance['balance']} 字符", 3005);
            }
            
            // 扣除字符
            $newBalance = $balance['balance'] - $characters;
            $newUsed = $balance['used_characters'] + $characters;
            
            $db->update('user_character_balance', [
                'balance' => $newBalance,
                'used_characters' => $newUsed,
                'last_use_time' => date('Y-m-d H:i:s')
            ], 'user_id = ?', [$userId]);
            
            // 记录日志
            $logId = $db->insert('character_usage_logs', [
                'user_id' => $userId,
                'action' => 'consume',
                'characters' => -$characters,
                'balance_before' => $balance['balance'],
                'balance_after' => $newBalance,
                'text_length' => mb_strlen($text),
                'text_preview' => mb_substr($text, 0, 100),
                'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
                'machine_code' => $machineCode
            ]);
            
            $db->commit();
            
            // 通过 WebSocket 推送余额更新通知
            self::notifyBalanceUpdated($userId, $newBalance, $balance['expire_time']);
            
            // 生成 TTS 授权码（防止客户端绕过）
            require_once __DIR__ . '/../lib/SecurityHelper.php';
            $authCode = SecurityHelper::generateAuthCode($userId, $characters, $logId);
            
            Response::success([
                'consumed' => $characters,
                'balance' => (int)$newBalance,
                'log_id' => $logId,  // 用于失败时退还
                'auth_code' => $authCode  // TTS 生成授权码
            ]);
            
        } catch (Exception $e) {
            $db->rollback();
            // 记录详细错误到日志
            require_once __DIR__ . '/../lib/Logger.php';
            Logger::error('字符扣费失败', [
                'user_id' => $userId,
                'characters' => $characters,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            Response::error('扣费失败，请稍后重试', 5001);
        }
    }
    
    /**
     * 退还字符（生成失败时调用）
     */
    public static function refund() {
        global $input;
        
        $payload = JWTAuth::getPayloadFromRequest();
        
        if (!$payload) {
            Response::error('未登录或Token已过期', 4001);
        }
        
        $userId = $payload['user_id'];
        $logId = intval($input['log_id'] ?? $_POST['log_id'] ?? 0);
        
        if ($logId <= 0) {
            Response::error('无效的日志ID', 3001);
        }
        
        $db = Database::getInstance();
        
        // 开启事务
        $db->beginTransaction();
        
        try {
            // 查找消耗日志
            $log = $db->fetch(
                "SELECT * FROM character_usage_logs WHERE id = ? AND user_id = ? AND action = 'consume' FOR UPDATE",
                [$logId, $userId]
            );
            
            if (!$log) {
                $db->rollback();
                Response::error('未找到消耗记录', 3002);
            }
            
            // 检查是否已经退还过（防止重复退还）
            $existingRefund = $db->fetch(
                "SELECT id FROM character_usage_logs WHERE user_id = ? AND action = 'refund' AND source_id = ?",
                [$userId, (string)$logId]
            );
            
            if ($existingRefund) {
                $db->rollback();
                Response::error('该记录已退还，请勿重复操作', 3004);
            }
            
            // 计算退还字符数（消耗记录的 characters 是负数）
            $refundCharacters = abs($log['characters']);
            
            // 获取用户余额
            $balance = $db->fetch(
                "SELECT * FROM user_character_balance WHERE user_id = ? FOR UPDATE",
                [$userId]
            );
            
            if (!$balance) {
                $db->rollback();
                Response::error('用户余额记录不存在', 3003);
            }
            
            // 退还字符
            $newBalance = $balance['balance'] + $refundCharacters;
            $newUsed = max(0, $balance['used_characters'] - $refundCharacters);
            
            $db->update('user_character_balance', [
                'balance' => $newBalance,
                'used_characters' => $newUsed
            ], 'user_id = ?', [$userId]);
            
            // 记录退还日志
            $db->insert('character_usage_logs', [
                'user_id' => $userId,
                'action' => 'refund',
                'characters' => $refundCharacters,
                'balance_before' => $balance['balance'],
                'balance_after' => $newBalance,
                'source' => 'generation_failed',
                'source_id' => (string)$logId,
                'ip' => $_SERVER['REMOTE_ADDR'] ?? null
            ]);
            
            $db->commit();
            
            // 通过 WebSocket 推送余额更新通知
            self::notifyBalanceUpdated($userId, $newBalance, $balance['expire_time']);
            
            Response::success([
                'refunded' => $refundCharacters,
                'balance' => (int)$newBalance
            ]);
            
        } catch (Exception $e) {
            $db->rollback();
            // 记录详细错误到日志
            require_once __DIR__ . '/../lib/Logger.php';
            Logger::error('字符退还失败', [
                'user_id' => $userId,
                'log_id' => $logId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            Response::error('退还失败，请稍后重试', 5001);
        }
    }
    
    /**
     * 获取套餐列表
     */
    public static function getPackages() {
        $db = Database::getInstance();
        
        $packages = $db->fetchAll(
            "SELECT pack_type, name, characters, price, validity_days, description 
             FROM character_pack_config 
             WHERE is_active = 1 
             ORDER BY sort_order ASC"
        );
        
        // 获取字符消耗说明
        $notice = $db->fetch(
            "SELECT setting_value FROM system_settings WHERE setting_key = 'character_pack_notice'"
        );
        
        Response::success([
            'packages' => $packages,
            'notice' => $notice ? $notice['setting_value'] : '1个中文=2字符，1个英文/数字/标点/空格=1字符'
        ]);
    }
    
    /**
     * 获取使用记录
     */
    public static function getUsageLogs() {
        $payload = JWTAuth::getPayloadFromRequest();
        
        if (!$payload) {
            Response::error('未登录或Token已过期', 4001);
        }
        
        $userId = $payload['user_id'];
        $page = max(1, intval($_GET['page'] ?? 1));
        $pageSize = min(50, max(10, intval($_GET['page_size'] ?? 20)));
        $offset = ($page - 1) * $pageSize;
        
        $db = Database::getInstance();
        
        // 获取总数
        $total = $db->fetch(
            "SELECT COUNT(*) as count FROM character_usage_logs WHERE user_id = ?",
            [$userId]
        );
        
        // 获取记录
        $logs = $db->fetchAll(
            "SELECT action, characters, balance_before, balance_after, text_preview, created_at 
             FROM character_usage_logs 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?",
            [$userId, $pageSize, $offset]
        );
        
        Response::success([
            'logs' => $logs,
            'total' => (int)$total['count'],
            'page' => $page,
            'page_size' => $pageSize
        ]);
    }
    
    /**
     * 计算文本的字符数
     * 规则：1个中文=2字符，1个英文/数字/标点/空格=1字符
     */
    public static function calculateCharacters($text) {
        $characters = 0;
        $length = mb_strlen($text, 'UTF-8');
        
        for ($i = 0; $i < $length; $i++) {
            $char = mb_substr($text, $i, 1, 'UTF-8');
            // 判断是否是中文字符（Unicode范围：\u4e00-\u9fff）
            if (preg_match('/[\x{4e00}-\x{9fff}]/u', $char)) {
                $characters += 2;  // 中文算2字符
            } else {
                $characters += 1;  // 其他算1字符
            }
        }
        
        return $characters;
    }
    
    /**
     * 预估文本字符数（不扣费，仅计算）
     */
    public static function estimate() {
        global $input;
        
        $text = trim($input['text'] ?? $_POST['text'] ?? '');
        
        if (empty($text)) {
            Response::success([
                'characters' => 0,
                'text_length' => 0
            ]);
        }
        
        // 限制文本长度
        if (mb_strlen($text, 'UTF-8') > 100000) {
            Response::error('文本长度不能超过100000字符', 3001);
        }
        
        $characters = self::calculateCharacters($text);
        
        Response::success([
            'characters' => $characters,
            'text_length' => mb_strlen($text, 'UTF-8')
        ]);
    }
    
    /**
     * 验证 TTS 授权码
     * 客户端在实际生成 TTS 前必须调用此接口验证授权码
     */
    public static function verifyAuthCode() {
        global $input;
        
        $payload = JWTAuth::getPayloadFromRequest();
        
        if (!$payload) {
            Response::error('未登录或Token已过期', 4001);
        }
        
        $authCode = $input['auth_code'] ?? $_POST['auth_code'] ?? '';
        
        if (empty($authCode)) {
            Response::error('授权码不能为空', 3001);
        }
        
        require_once __DIR__ . '/../lib/SecurityHelper.php';
        
        // 检查授权码是否已使用
        if (SecurityHelper::isAuthCodeUsed($authCode)) {
            Response::error('授权码已使用', 3002);
        }
        
        // 验证授权码
        $data = SecurityHelper::verifyAuthCode($authCode);
        
        if (!$data) {
            Response::error('授权码无效或已过期', 3003);
        }
        
        // 验证用户ID匹配
        if ($data['user_id'] != $payload['user_id']) {
            Response::error('授权码与当前用户不匹配', 3004);
        }
        
        // 标记授权码已使用
        SecurityHelper::markAuthCodeUsed($authCode, $payload['user_id']);
        
        Response::success([
            'valid' => true,
            'characters' => $data['characters'],
            'log_id' => $data['log_id']
        ]);
    }
    
    /**
     * 通知余额更新（通过 WebSocket 推送）
     */
    private static function notifyBalanceUpdated($userId, $balance, $expireTime) {
        try {
            require_once __DIR__ . '/../../websocket/src/PushService.php';
            $pushService = new \MaruAudio\WebSocket\PushService();
            
            $pushService->pushToUser($userId, 'balance_updated', [
                'balance' => (int)$balance,
                'expire_time' => $expireTime
            ]);
        } catch (Exception $e) {
            error_log("WebSocket 余额推送失败: " . $e->getMessage());
        }
    }
}
