<?php
header('Content-Type: text/plain');
echo "SCRIPT_FILENAME: " . ($_SERVER['SCRIPT_FILENAME'] ?? 'NOT_SET') . "\n";
echo "REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'NOT_SET') . "\n";
echo "DOCUMENT_ROOT: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'NOT_SET') . "\n";
echo "PHP_SELF: " . ($_SERVER['PHP_SELF'] ?? 'NOT_SET') . "\n";
echo "SCRIPT_NAME: " . ($_SERVER['SCRIPT_NAME'] ?? 'NOT_SET') . "\n";

// Check if .env is accessible from index.php's perspective
$indexDir = dirname($_SERVER['SCRIPT_FILENAME'] ?? '');
echo "\nindex.php dir: $indexDir\n";
echo ".env exists at $indexDir/.env: " . (file_exists("$indexDir/.env") ? 'YES' : 'NO') . "\n";

// Try loading env from index.php
$envFile = $indexDir . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') === false) continue;
        list($key, $val) = explode('=', $line, 2);
        $k = trim($key);
        $v = trim($val);
        putenv("$k=$v");
    }
    echo "Env loaded via putenv\n";
    echo "MARUAUDIO_ENV: " . getenv('MARUAUDIO_ENV') . "\n";
    echo "MARUAUDIO_DB_HOST: " . getenv('MARUAUDIO_DB_HOST') . "\n";
}
