#!/bin/bash
# WebSocket 服务安装脚本
# 在服务器上执行: bash install.sh

echo "=== 丸子配音 WebSocket 服务安装 ==="

# 检查 Composer
if ! command -v composer &> /dev/null; then
    echo "安装 Composer..."
    curl -sS https://getcomposer.org/installer | php
    mv composer.phar /usr/local/bin/composer
    chmod +x /usr/local/bin/composer
fi

# 进入 API 目录
cd /www/wwwroot/maruaudio/api

# 创建 composer.json（如果不存在）
if [ ! -f "composer.json" ]; then
    echo '{
    "name": "maruaudio/api",
    "require": {
        "cboden/ratchet": "^0.4"
    }
}' > composer.json
fi

# 安装依赖
echo "安装 Ratchet..."
composer install

# 创建 WebSocket 目录
mkdir -p websocket/queue

# 创建 systemd 服务
echo "创建 systemd 服务..."
cat > /etc/systemd/system/maruaudio-websocket.service << 'EOF'
[Unit]
Description=丸子配音 WebSocket Server
After=network.target

[Service]
Type=simple
User=www
WorkingDirectory=/www/wwwroot/maruaudio/api
ExecStart=/usr/bin/php /www/wwwroot/maruaudio/api/websocket/server.php
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# 重载 systemd
systemctl daemon-reload

# 启动服务
systemctl start maruaudio-websocket
systemctl enable maruaudio-websocket

# 检查状态
systemctl status maruaudio-websocket

echo "=== 安装完成 ==="
echo "WebSocket 服务运行在 ws://0.0.0.0:8080"
echo ""
echo "请确保防火墙开放 8080 端口："
echo "  firewall-cmd --add-port=8080/tcp --permanent"
echo "  firewall-cmd --reload"
