#!/bin/bash
echo "=== API ==="
curl -sk https://auth.wzagent.cn/api/
echo ""
echo "=== Admin ==="
curl -sk -o /dev/null -w '%{http_code}' https://auth.wzagent.cn/admin/
echo ""
echo "=== Admin Login Page ==="
curl -sk -o /dev/null -w '%{http_code}' https://auth.wzagent.cn/admin/login
echo ""
echo "=== Root Redirect ==="
curl -sk -o /dev/null -w '%{http_code}' https://auth.wzagent.cn/
echo ""
echo "=== Login API ==="
curl -sk -X POST -H 'Content-Type: application/json' \
  -d '{"username":"laomao","password":"test"}' \
  https://auth.wzagent.cn/api/admin/login
echo ""
echo "=== WebSocket ==="
systemctl is-active maruaudio-websocket
echo "=== Files ==="
echo "Admin files: $(find /www/wwwroot/auth.wzagent.cn/admin -type f | wc -l)"
echo "API controllers: $(ls /www/wwwroot/auth.wzagent.cn/api/controllers/*.php | wc -l)"
echo ".env: $(cat /www/wwwroot/auth.wzagent.cn/api/.env | wc -l) lines"
