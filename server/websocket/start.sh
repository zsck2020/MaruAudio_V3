#!/bin/bash
# 丸子配音 WebSocket 服务器启动脚本

cd "$(dirname "$0")"

# 安装依赖
if [ ! -d "vendor" ]; then
    echo "Installing dependencies..."
    composer install
fi

# 启动服务器
echo "Starting WebSocket server..."
php server.php
