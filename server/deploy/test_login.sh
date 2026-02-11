#!/bin/bash
echo "=== Test Login ==="
curl -sk -X POST -H 'Content-Type: application/json' \
  -d '{"username":"laomao","password":"123456"}' \
  https://auth.wzagent.cn/api/admin/login
echo ""
echo "=== Test DB ==="
mysql -u maruaudio -p'6FS64ybEGeyMcpZs' maruaudio -e "SELECT id,username,email,status FROM admins LIMIT 5;" 2>&1
echo ""
echo "=== PHP Error ==="
tail -5 /www/wwwroot/auth.wzagent.cn/api/logs/*.log 2>/dev/null || echo "No PHP logs"
