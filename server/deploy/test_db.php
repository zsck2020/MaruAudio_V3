<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load env
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

echo "ENV: " . getenv('MARUAUDIO_ENV') . "\n";
echo "DB_HOST: " . getenv('MARUAUDIO_DB_HOST') . "\n";
echo "JWT set: " . (getenv('MARUAUDIO_JWT_SECRET') ? 'YES' : 'NO') . "\n";
echo "SIG set: " . (getenv('MARUAUDIO_SIGNATURE_KEY') ? 'YES' : 'NO') . "\n";

// Test DB
try {
    $config = require '/www/wwwroot/auth.wzagent.cn/api/config/database.php';
    echo "DB config OK\n";
    $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset={$config['charset']}";
    $pdo = new PDO($dsn, $config['username'], $config['password']);
    echo "DB connected\n";
    $stmt = $pdo->query("SELECT id,username FROM admins LIMIT 1");
    echo "Admin: " . json_encode($stmt->fetch(PDO::FETCH_ASSOC)) . "\n";
} catch (Exception $e) {
    echo "DB Error: " . $e->getMessage() . "\n";
}

// Test app config
try {
    $appConfig = require '/www/wwwroot/auth.wzagent.cn/api/config/app.php';
    echo "App config OK\n";
} catch (Exception $e) {
    echo "App Error: " . $e->getMessage() . "\n";
}
