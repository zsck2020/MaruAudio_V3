#!/bin/bash
cat > /www/wwwroot/auth.wzagent.cn/api/config/database.php << 'EOF'
<?php
/**
 * 数据库配置
 */
return [
    'host' => 'localhost',
    'port' => 3306,
    'database' => 'maruaudio',
    'username' => 'maruaudio',
    'password' => '6FS64ybEGeyMcpZs',
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
];
EOF
echo "database.php updated"

# Install composer deps
cd /www/wwwroot/auth.wzagent.cn/api
composer install 2>&1 | tail -3

# Fix permissions
chown -R www:www /www/wwwroot/auth.wzagent.cn/ 2>/dev/null || true

# Verify
echo ""
echo "=== API Test ==="
curl -sk https://auth.wzagent.cn/api/
echo ""
echo "=== Admin Test ==="
curl -sk -o /dev/null -w '%{http_code}' https://auth.wzagent.cn/admin/
echo ""
echo "=== Login Test ==="
curl -sk -X POST -H 'Content-Type: application/json' \
  -d '{"username":"laomao","password":"test"}' \
  https://auth.wzagent.cn/api/admin/login
echo ""
echo "=== Admin Files ==="
ls /www/wwwroot/auth.wzagent.cn/admin/
echo "=== API Files ==="
ls /www/wwwroot/auth.wzagent.cn/api/controllers/
