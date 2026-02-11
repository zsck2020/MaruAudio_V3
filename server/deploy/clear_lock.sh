#!/bin/bash
mysql -u maruaudio -p'6FS64ybEGeyMcpZs' maruaudio -e "DELETE FROM admin_login_logs WHERE login_result='failed';"
echo "Login lock cleared"
curl -sk -X POST -H 'Content-Type: application/json' \
  -d '{"username":"laomao","password":"test"}' \
  https://auth.wzagent.cn/api/admin/login
echo ""
