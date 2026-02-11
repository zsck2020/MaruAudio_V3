#!/bin/bash
# Temporarily enable error display in index.php to see the actual error
cd /www/wwwroot/auth.wzagent.cn/api

# Create a test wrapper that shows errors
cat > /tmp/test_login_wrapper.php << 'PHPEOF'
<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Simulate POST request
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REQUEST_URI'] = '/api/admin/login';
$_SERVER['CONTENT_TYPE'] = 'application/json';
$_SERVER['HTTP_CONTENT_TYPE'] = 'application/json';

// Create temp file with POST data
$postData = '{"username":"laomao","password":"123456"}';
$tmpFile = tempnam(sys_get_temp_dir(), 'post');
file_put_contents($tmpFile, $postData);

// Override php://input by using a stream wrapper
class PostInputStream {
    private $data;
    private $pos = 0;
    public function stream_open($path, $mode, $options, &$opened_path) {
        $this->data = $GLOBALS['_POST_RAW_DATA'];
        return true;
    }
    public function stream_read($count) {
        $ret = substr($this->data, $this->pos, $count);
        $this->pos += strlen($ret);
        return $ret;
    }
    public function stream_eof() { return $this->pos >= strlen($this->data); }
    public function stream_stat() { return []; }
}

$GLOBALS['_POST_RAW_DATA'] = $postData;

// Load env first
$envFile = '/www/wwwroot/auth.wzagent.cn/api/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') === false) continue;
        list($key, $val) = explode('=', $line, 2);
        putenv(trim($key) . '=' . trim($val));
    }
}

// Now try to load the admin controller and call login
require_once '/www/wwwroot/auth.wzagent.cn/api/lib/Cache.php';
require_once '/www/wwwroot/auth.wzagent.cn/api/lib/Database.php';
require_once '/www/wwwroot/auth.wzagent.cn/api/lib/Response.php';
require_once '/www/wwwroot/auth.wzagent.cn/api/lib/JWTAuth.php';
require_once '/www/wwwroot/auth.wzagent.cn/api/lib/Logger.php';

$appConfig = require '/www/wwwroot/auth.wzagent.cn/api/config/app.php';
$dbConfig = require '/www/wwwroot/auth.wzagent.cn/api/config/database.php';

echo "App config OK\n";
echo "DB config OK: host={$dbConfig['host']}\n";

// Initialize database
$db = \MaruAudio\Database::getInstance($dbConfig);
echo "DB instance OK\n";

// Try login
require_once '/www/wwwroot/auth.wzagent.cn/api/controllers/AdminController.php';
echo "AdminController loaded\n";

try {
    $controller = new \MaruAudio\Controllers\AdminController();
    echo "Controller instantiated\n";
    // Simulate the login
    $input = json_decode($postData, true);
    echo "Input: " . json_encode($input) . "\n";
    
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    echo "Username: $username, Password length: " . strlen($password) . "\n";
    
    // Check admin exists
    $admin = $db->fetchOne("SELECT * FROM admins WHERE username = ?", [$username]);
    echo "Admin found: " . ($admin ? 'YES (id=' . $admin['id'] . ')' : 'NO') . "\n";
    
    if ($admin) {
        echo "Admin status: " . $admin['status'] . "\n";
        echo "Password verify: " . (password_verify($password, $admin['password']) ? 'OK' : 'FAIL') . "\n";
        echo "Has email_verified: " . (isset($admin['email_verified']) ? 'YES' : 'NO') . "\n";
    }
} catch (Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
PHPEOF

php /tmp/test_login_wrapper.php
