<?php
/**
 * 邮件服务配置 - QQ邮箱SMTP
 */
return [
    'smtp_host' => getenv('MARUAUDIO_SMTP_HOST') ?: 'smtp.qq.com',
    'smtp_port' => (int)(getenv('MARUAUDIO_SMTP_PORT') ?: 465),
    'smtp_secure' => 'ssl',
    'smtp_user' => getenv('MARUAUDIO_SMTP_USER') ?: '',
    'smtp_pass' => getenv('MARUAUDIO_SMTP_PASS') ?: '',
    'from_name' => '丸子配音',
    'from_email' => getenv('MARUAUDIO_SMTP_USER') ?: '',
    
    // 发送频率限制
    'rate_limit' => [
        'same_email_interval' => 60,    // 同一邮箱发送间隔（秒）
        'same_ip_per_hour' => 10,       // 同一IP每小时最多发送次数
    ],
];
