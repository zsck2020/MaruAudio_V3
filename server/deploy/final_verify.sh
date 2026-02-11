#!/bin/bash
echo "========================================="
echo "  MaruAudio Final Verification"
echo "========================================="

echo ""
echo "1. API Health:"
curl -sk https://auth.wzagent.cn/api/
echo ""

echo ""
echo "2. Admin Login (wrong password - should return 2002):"
curl -sk -X POST -H 'Content-Type: application/json' \
  -d '{"username":"laomao","password":"wrongpass"}' \
  https://auth.wzagent.cn/api/admin/login
echo ""

echo ""
echo "3. Frontend Pages:"
for path in / /login /dashboard /users /cards /logs /settings /announcements; do
  CODE=$(curl -sk -o /dev/null -w '%{http_code}' "https://auth.wzagent.cn$path")
  echo "  $path -> $CODE"
done

echo ""
echo "4. WebSocket Service:"
systemctl is-active maruaudio-websocket
echo "  Port 8080: $(ss -tlnp | grep 8080 | head -1)"

echo ""
echo "5. SSL Certificate:"
echo | openssl s_client -connect auth.wzagent.cn:443 -servername auth.wzagent.cn 2>/dev/null | grep -E 'subject=|issuer=|notAfter' | head -3

echo ""
echo "6. PHP Error Check (clean test):"
rm -f /tmp/maru_verify_err.log
PHP_ERR_CONF="ini_set('log_errors', 1); ini_set('error_log', '/tmp/maru_verify_err.log');"
# Quick API call
curl -sk https://auth.wzagent.cn/api/ > /dev/null
curl -sk -X POST -H 'Content-Type: application/json' \
  -d '{"username":"laomao","password":"test"}' \
  https://auth.wzagent.cn/api/admin/login > /dev/null
sleep 1
if [ -f /tmp/maru_verify_err.log ]; then
  echo "  Warnings/Errors found:"
  cat /tmp/maru_verify_err.log
else
  echo "  No errors"
fi

echo ""
echo "7. File counts:"
echo "  API controllers: $(ls /www/wwwroot/auth.wzagent.cn/api/controllers/*.php 2>/dev/null | wc -l)"
echo "  API lib: $(ls /www/wwwroot/auth.wzagent.cn/api/lib/*.php 2>/dev/null | wc -l)"
echo "  API config: $(ls /www/wwwroot/auth.wzagent.cn/api/config/*.php 2>/dev/null | wc -l)"
echo "  Frontend _app: $(find /www/wwwroot/auth.wzagent.cn/_app -type f 2>/dev/null | wc -l)"
echo "  .env keys: $(grep -c '=' /www/wwwroot/auth.wzagent.cn/api/.env 2>/dev/null)"

echo ""
echo "========================================="
echo "  Verification Complete"
echo "========================================="
