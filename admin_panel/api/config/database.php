<?php
/**
 * 数据库配置
 * 敏感信息从环境变量读取，回退到默认值仅用于开发环境
 */
return [
    'host' => getenv('MARUAUDIO_DB_HOST') ?: 'localhost',
    'port' => (int)(getenv('MARUAUDIO_DB_PORT') ?: 3306),
    'database' => getenv('MARUAUDIO_DB_NAME') ?: 'maruaudio',
    'username' => getenv('MARUAUDIO_DB_USER') ?: 'maruaudio',
    'password' => getenv('MARUAUDIO_DB_PASSWORD') ?: '',
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
];
