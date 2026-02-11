<?php
/**
 * 数据库配置
 * 
 * 安全提示：
 * - 生产环境请使用环境变量配置数据库密码
 * - 环境变量名：MARUAUDIO_DB_PASSWORD 或 DB_PASSWORD
 * - 不要将包含真实密码的配置文件提交到版本控制系统
 */
$dbPassword = getenv('MARUAUDIO_DB_PASSWORD') ?: (getenv('DB_PASSWORD') ?: '');
$env = getenv('MARUAUDIO_ENV') ?: 'production';
if ($env === 'production' && empty($dbPassword)) {
    throw new RuntimeException(
        'Missing database password. Set MARUAUDIO_DB_PASSWORD or DB_PASSWORD environment variable.'
    );
}

return [
    'host' => getenv('MARUAUDIO_DB_HOST') ?: (getenv('DB_HOST') ?: 'localhost'),
    'port' => (int)(getenv('MARUAUDIO_DB_PORT') ?: (getenv('DB_PORT') ?: 3306)),
    'database' => getenv('MARUAUDIO_DB_NAME') ?: (getenv('DB_NAME') ?: 'maruaudio'),
    'username' => getenv('MARUAUDIO_DB_USER') ?: (getenv('DB_USER') ?: 'maruaudio'),
    'password' => $dbPassword,
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
];
