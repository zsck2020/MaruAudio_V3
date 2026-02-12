#!/bin/bash
set -e

NEW_ROOT="/www/wwwroot/auth.wzagent.cn"

echo "=== Step 1: Clean new server API ==="
rm -rf $NEW_ROOT/api/controllers $NEW_ROOT/api/config $NEW_ROOT/api/lib
rm -f $NEW_ROOT/api/index.php $NEW_ROOT/api/composer.json $NEW_ROOT/api/composer.lock
rm -rf $NEW_ROOT/api/vendor $NEW_ROOT/api/tests $NEW_ROOT/api/phpunit.xml $NEW_ROOT/api/bootstrap.php

echo "=== Step 2: Copy API from old server ==="
# This script runs on the NEW server
# We'll use scp from new to old
scp -r root@175.178.131.67:/www/wwwroot/MaruAudio/api/index.php $NEW_ROOT/api/
scp -r root@175.178.131.67:/www/wwwroot/MaruAudio/api/controllers $NEW_ROOT/api/
scp -r root@175.178.131.67:/www/wwwroot/MaruAudio/api/config $NEW_ROOT/api/
scp -r root@175.178.131.67:/www/wwwroot/MaruAudio/api/lib $NEW_ROOT/api/
scp -r root@175.178.131.67:/www/wwwroot/MaruAudio/api/composer.json $NEW_ROOT/api/ 2>/dev/null || true
scp -r root@175.178.131.67:/www/wwwroot/MaruAudio/api/composer.lock $NEW_ROOT/api/ 2>/dev/null || true

echo "=== Step 3: Copy admin frontend from old server ==="
rm -rf $NEW_ROOT/admin/*
scp -r root@175.178.131.67:/www/wwwroot/MaruAudio/admin/* $NEW_ROOT/admin/

echo "=== Step 4: Fix database config for new server ==="
cat > $NEW_ROOT/api/config/database.php << 'DBEOF'
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
DBEOF

echo "=== Step 5: Install composer deps ==="
cd $NEW_ROOT/api
composer install 2>&1 | tail -3

echo "=== Step 6: Fix permissions ==="
chown -R www:www $NEW_ROOT/ 2>/dev/null || true

echo "=== Step 7: Verify ==="
echo "API files:"
ls $NEW_ROOT/api/controllers/
echo "Admin files:"
ls $NEW_ROOT/admin/ | head -5
echo "API test:"
curl -sk https://auth.wzagent.cn/api/
echo ""
echo "Admin test:"
curl -sk -o /dev/null -w '%{http_code}' https://auth.wzagent.cn/admin/
echo ""

echo "=== DONE ==="
