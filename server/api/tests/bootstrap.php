<?php
/**
 * PHPUnit 测试引导文件
 */

// 设置错误报告
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 设置测试环境变量
putenv('MARUAUDIO_ENV=testing');
putenv('MARUAUDIO_DEBUG=1');

// 定义测试根目录
define('TEST_ROOT', __DIR__);
define('API_ROOT', dirname(__DIR__));

// 加载类库
require_once API_ROOT . '/lib/Cache.php';
require_once API_ROOT . '/lib/Database.php';
require_once API_ROOT . '/lib/Response.php';
require_once API_ROOT . '/lib/JWTAuth.php';
require_once API_ROOT . '/lib/Logger.php';
require_once API_ROOT . '/lib/APM.php';

// 设置测试数据库配置（如果需要）
// 可以在这里覆盖数据库配置以使用测试数据库






