<?php
/**
 * 邮件服务配置 - QQ邮箱SMTP
 * 敏感信息从环境变量读取，数据库配置优先级更高（Mailer.php 中会覆盖）
 */
return [
    'smtp_host' => getenv('SMTP_HOST') ?: 'smtp.qq.com',
    'smtp_port' => (int)(getenv('SMTP_PORT') ?: 465),
    'smtp_secure' => 'ssl',
    'smtp_user' => getenv('SMTP_USER') ?: '',
    'smtp_pass' => getenv('SMTP_PASS') ?: '',
    'from_name' => getenv('MAIL_FROM_NAME') ?: '丸子配音',
    'from_email' => getenv('SMTP_USER') ?: '',
    
    // 发送频率限制
    'rate_limit' => [
        'same_email_interval' => 60,    // 同一邮箱发送间隔（秒）
        'same_ip_per_hour' => 10,       // 同一IP每小时最多发送次数
    ],
];
