#!/bin/bash
echo "=== 1. API Root ==="
curl -sk https://auth.wzagent.cn/api/
echo ""

echo "=== 2. Admin Login API ==="
curl -sk -X POST -H 'Content-Type: application/json' \
  -d '{"username":"laomao","password":"123456"}' \
  https://auth.wzagent.cn/api/admin/login
echo ""

echo "=== 3. Frontend Pages ==="
for path in / /login /dashboard /users /cards /settings; do
  CODE=$(curl -sk -o /dev/null -w '%{http_code}' "https://auth.wzagent.cn$path")
  echo "  $path -> $CODE"
done

echo "=== 4. WebSocket ==="
systemctl is-active maruaudio-websocket

echo "=== 5. File Structure ==="
echo "  API files:"
ls /www/wwwroot/auth.wzagent.cn/api/controllers/ | head -5
echo "  Frontend:"
ls /www/wwwroot/auth.wzagent.cn/index.html /www/wwwroot/auth.wzagent.cn/_app 2>/dev/null | head -3
echo "  .env:"
ls -la /www/wwwroot/auth.wzagent.cn/api/.env

echo "=== 6. PHP Error Test ==="
rm -f /tmp/maru_final_err.log
# Temporarily enable error logging
sed -i "s/ini_set('display_errors', 0)/ini_set('display_errors', 0); ini_set('log_errors', 1); ini_set('error_log', '\/tmp\/maru_final_err.log')/" /www/wwwroot/auth.wzagent.cn/api/index.php

# Test multiple API endpoints
curl -sk https://auth.wzagent.cn/api/ > /dev/null
curl -sk -X POST -H 'Content-Type: application/json' -d '{"username":"laomao","password":"test"}' https://auth.wzagent.cn/api/admin/login > /dev/null

sleep 1
echo "  PHP Errors:"
cat /tmp/maru_final_err.log 2>/dev/null || echo "  None"

# Restore index.php
cd /www/wwwroot/auth.wzagent.cn/api
git checkout index.php 2>/dev/null || true
