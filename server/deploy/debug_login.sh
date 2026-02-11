#!/bin/bash
# Enable PHP error logging to file
sed -i "s/ini_set('display_errors', 0)/ini_set('display_errors', 0); ini_set('log_errors', 1); ini_set('error_log', '\/tmp\/maru_err.log')/" /www/wwwroot/auth.wzagent.cn/api/index.php

# Clear old log
rm -f /tmp/maru_err.log

# Test login
echo "=== Login Response ==="
curl -sk -X POST -H 'Content-Type: application/json' \
  -d '{"username":"laomao","password":"123456"}' \
  https://auth.wzagent.cn/api/admin/login
echo ""

# Wait and show errors
sleep 1
echo "=== PHP Errors ==="
cat /tmp/maru_err.log 2>/dev/null || echo "No errors logged"
