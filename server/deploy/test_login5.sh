#!/bin/bash
# Temporarily enable error display in the actual index.php
cd /www/wwwroot/auth.wzagent.cn/api
cp index.php index.php.bak
sed -i "s/ini_set('display_errors', 0)/ini_set('display_errors', 1)/" index.php

# Test login
curl -sk -X POST -H 'Content-Type: application/json' \
  -d '{"username":"laomao","password":"123456"}' \
  https://auth.wzagent.cn/api/admin/login

echo ""

# Restore
cp index.php.bak index.php
rm index.php.bak
