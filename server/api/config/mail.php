<?php
/**
 * 邮件服务配置 - QQ邮箱SMTP
 */
return [
    'smtp_host' => 'smtp.qq.com',
    'smtp_port' => 465,
    'smtp_secure' => 'ssl',
    'smtp_user' => 'qilane@foxmail.com',
    'smtp_pass' => 'cqjnqwuwhkebdiej', // QQ邮箱授权码
    'from_name' => '丸子配音',
    'from_email' => 'qilane@foxmail.com',
    
    // 发送频率限制
    'rate_limit' => [
        'same_email_interval' => 60,    // 同一邮箱发送间隔（秒）
        'same_ip_per_hour' => 10,       // 同一IP每小时最多发送次数
    ],
];
