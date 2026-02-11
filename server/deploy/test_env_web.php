<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/plain');

echo "=== PHP-FPM Environment Test ===\n\n";

// Test putenv
echo "1. Testing putenv:\n";
try {
    putenv("TEST_VAR=hello");
    echo "   putenv: OK (value=" . getenv("TEST_VAR") . ")\n";
} catch (Error $e) {
    echo "   putenv: BLOCKED - " . $e->getMessage() . "\n";
}

// Test .env loading
echo "\n2. Loading .env:\n";
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    echo "   .env file exists\n";
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') === false) continue;
        list($key, $val) = explode('=', $line, 2);
        $k = trim($key);
        echo "   Found key: $k\n";
    }
} else {
    echo "   .env NOT FOUND at $envFile\n";
}

// Test getenv after loading
echo "\n3. getenv results:\n";
echo "   MARUAUDIO_ENV: " . (getenv('MARUAUDIO_ENV') ?: 'NOT_SET') . "\n";
echo "   MARUAUDIO_DB_HOST: " . (getenv('MARUAUDIO_DB_HOST') ?: 'NOT_SET') . "\n";
echo "   MARUAUDIO_JWT_SECRET: " . (getenv('MARUAUDIO_JWT_SECRET') ? 'SET' : 'NOT_SET') . "\n";

// Test DB connection
echo "\n4. DB connection:\n";
try {
    // Manually set env for this test
    $envFile2 = __DIR__ . '/.env';
    $envVars = [];
    if (file_exists($envFile2)) {
        $lines = file($envFile2, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') continue;
            if (strpos($line, '=') === false) continue;
            list($key, $val) = explode('=', $line, 2);
            $envVars[trim($key)] = trim($val);
            putenv(trim($key) . '=' . trim($val));
        }
    }
    
    $config = require __DIR__ . '/config/database.php';
    echo "   Config loaded: host={$config['host']}, db={$config['database']}, user={$config['username']}\n";
    $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset={$config['charset']}";
    $pdo = new PDO($dsn, $config['username'], $config['password']);
    echo "   Connected OK\n";
    $stmt = $pdo->query("SELECT id,username FROM admins LIMIT 1");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "   Admin: " . json_encode($row) . "\n";
} catch (Error $e) {
    echo "   Error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "   Exception: " . $e->getMessage() . "\n";
}

echo "\n5. disable_functions:\n";
echo "   " . ini_get('disable_functions') . "\n";
