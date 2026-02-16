<?php
/**
 * 应用配置
 * 敏感密钥从环境变量读取
 */
return [
    'name' => '丸子配音',
    'version' => '1.0.0',
    'debug' => false,
    
    // JWT 配置（密钥从环境变量读取）
    'jwt_secret' => getenv('MARUAUDIO_JWT_SECRET') ?: 'MaruAudio_JWT_Secret_2026_Secure_Key',
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
