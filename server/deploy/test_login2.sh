#!/bin/bash
# Enable PHP error display temporarily for debugging
cd /www/wwwroot/auth.wzagent.cn/api
php -r '
$_SERVER["REQUEST_METHOD"] = "POST";
$_SERVER["REQUEST_URI"] = "/api/admin/login";
$_SERVER["CONTENT_TYPE"] = "application/json";

// Simulate POST body
$GLOBALS["HTTP_RAW_POST_DATA"] = json_encode(["username" => "laomao", "password" => "123456"]);

// Override php://input
file_put_contents("/tmp/test_input.json", json_encode(["username" => "laomao", "password" => "123456"]));

ini_set("display_errors", 1);
error_reporting(E_ALL);

// Load env
$envFile = __DIR__ . "/.env";
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === "" || $line[0] === "#") continue;
        if (strpos($line, "=") === false) continue;
        list($key, $val) = explode("=", $line, 2);
        putenv(trim($key) . "=" . trim($val));
    }
}

echo "ENV loaded\n";
echo "DB_HOST: " . getenv("MARUAUDIO_DB_HOST") . "\n";
echo "DB_NAME: " . getenv("MARUAUDIO_DB_NAME") . "\n";
echo "DB_USER: " . getenv("MARUAUDIO_DB_USER") . "\n";
echo "JWT_SECRET set: " . (getenv("MARUAUDIO_JWT_SECRET") ? "YES" : "NO") . "\n";

// Test DB connection
try {
    $config = require __DIR__ . "/config/database.php";
    echo "DB config loaded\n";
    $dsn = "mysql:host={$config[\"host\"]};port={$config[\"port\"]};dbname={$config[\"database\"]};charset={$config[\"charset\"]}";
    $pdo = new PDO($dsn, $config["username"], $config["password"]);
    echo "DB connected OK\n";
    $stmt = $pdo->query("SELECT id,username FROM admins LIMIT 1");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Admin found: " . json_encode($row) . "\n";
} catch (Exception $e) {
    echo "DB Error: " . $e->getMessage() . "\n";
}
'
