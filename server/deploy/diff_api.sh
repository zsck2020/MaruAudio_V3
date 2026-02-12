#!/bin/bash
# Dump old server API code for comparison
echo "=== index.php MD5 ==="
md5sum /www/wwwroot/MaruAudio/api/index.php
echo "=== index.php lines ==="
wc -l /www/wwwroot/MaruAudio/api/index.php
echo ""

echo "=== AdminController.php ==="
md5sum /www/wwwroot/MaruAudio/api/controllers/AdminController.php
wc -l /www/wwwroot/MaruAudio/api/controllers/AdminController.php
echo ""

echo "=== AdminApiController.php ==="
md5sum /www/wwwroot/MaruAudio/api/controllers/AdminApiController.php
wc -l /www/wwwroot/MaruAudio/api/controllers/AdminApiController.php
echo ""

echo "=== UserController.php ==="
md5sum /www/wwwroot/MaruAudio/api/controllers/UserController.php
wc -l /www/wwwroot/MaruAudio/api/controllers/UserController.php
echo ""

echo "=== AuthController.php ==="
md5sum /www/wwwroot/MaruAudio/api/controllers/AuthController.php
wc -l /www/wwwroot/MaruAudio/api/controllers/AuthController.php
echo ""

echo "=== Database.php ==="
md5sum /www/wwwroot/MaruAudio/api/lib/Database.php
wc -l /www/wwwroot/MaruAudio/api/lib/Database.php
echo ""

echo "=== JWTAuth.php ==="
md5sum /www/wwwroot/MaruAudio/api/lib/JWTAuth.php
wc -l /www/wwwroot/MaruAudio/api/lib/JWTAuth.php
echo ""

echo "=== Response.php ==="
md5sum /www/wwwroot/MaruAudio/api/lib/Response.php
wc -l /www/wwwroot/MaruAudio/api/lib/Response.php
echo ""

echo "=== app.php ==="
md5sum /www/wwwroot/MaruAudio/api/config/app.php
wc -l /www/wwwroot/MaruAudio/api/config/app.php
echo ""

echo "=== database.php config ==="
cat /www/wwwroot/MaruAudio/api/config/database.php
echo ""

echo "=== Nginx config ==="
cat /www/server/panel/vhost/nginx/MaruAudio.conf 2>/dev/null || cat /www/server/panel/vhost/nginx/*.conf 2>/dev/null | head -50
echo ""

echo "=== Admin frontend location ==="
find /www/wwwroot/MaruAudio -name 'index.html' -path '*/admin/*' 2>/dev/null | head -5
ls /www/wwwroot/MaruAudio/admin/ 2>/dev/null || echo "No admin dir"
find /www/wwwroot -name 'index.html' -path '*/admin*' 2>/dev/null | head -5
