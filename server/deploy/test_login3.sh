#!/bin/bash
echo "=== Login Test ==="
RESULT=$(curl -sk -X POST -H 'Content-Type: application/json' \
  -d '{"username":"laomao","password":"123456"}' \
  https://auth.wzagent.cn/api/admin/login 2>&1)
echo "$RESULT"

echo ""
echo "=== Check SMTP config ==="
cat /www/wwwroot/auth.wzagent.cn/api/.env | grep SMTP

echo ""
echo "=== Check mail config ==="
php -r '
putenv("MARUAUDIO_SMTP_USER=");
putenv("MARUAUDIO_SMTP_PASS=");
$c = require "/www/wwwroot/auth.wzagent.cn/api/config/mail.php";
echo json_encode($c, JSON_PRETTY_PRINT) . "\n";
'
