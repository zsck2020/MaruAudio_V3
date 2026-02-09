<?php
/**
 * 应用配置
 */
$debug = getenv('MARUAUDIO_DEBUG') ? (getenv('MARUAUDIO_DEBUG') === '1') : false;
$env = getenv('MARUAUDIO_ENV') ?: ($debug ? 'development' : 'production');

$jwtSecret = getenv('MARUAUDIO_JWT_SECRET') ?: (getenv('JWT_SECRET') ?: 'CHANGE_ME');
if ($env === 'production' && ($jwtSecret === 'CHANGE_ME' || $jwtSecret === '')) {
    // 生产环境必须显式配置密钥
    throw new RuntimeException(
        'Missing JWT secret. Please configure via environment variable: ' .
        'MARUAUDIO_JWT_SECRET (or JWT_SECRET). ' .
        'Example: export MARUAUDIO_JWT_SECRET="your-secret-key-here"'
    );
}

return [
    'name' => '丸子配音',
    'version' => '1.0.0',
    'debug' => $debug,
    
    // JWT 配置
    // IMPORTANT: do not hardcode real secrets in repo. Configure via env in production.
    // - MARUAUDIO_JWT_SECRET (preferred)
    // - JWT_SECRET (compatible fallback for websocket server)
    'jwt_secret' => $jwtSecret,
    'jwt_expire' => 7200, // Token 过期时间（秒）
    
    // 安全配置
    'login_fail_limit' => 5,        // 登录失败锁定次数
    'login_lock_duration' => 30,    // 登录锁定时长（分钟）
    'machine_code_limit' => 1,      // 每个机器码可注册账号数
    'machine_change_cooldown' => 30, // 机器码更换冷却期（天）
    
    // 验证码配置
    'code_expire' => 300,           // 验证码过期时间（秒）
    'code_length' => 6,             // 验证码长度
];
