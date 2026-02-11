#!/bin/bash
# Create .env file for MaruAudio API
cat > /www/wwwroot/auth.wzagent.cn/api/.env << 'EOF'
MARUAUDIO_ENV=production
MARUAUDIO_DB_HOST=localhost
MARUAUDIO_DB_PORT=3306
MARUAUDIO_DB_NAME=maruaudio
MARUAUDIO_DB_USER=maruaudio
MARUAUDIO_DB_PASSWORD=6FS64ybEGeyMcpZs
MARUAUDIO_JWT_SECRET=f701a3e4daf0fb6c80c16d595ee4ba6490a5d47895bc7246c0ef484e77f03326
MARUAUDIO_SIGNATURE_KEY=8468c61b3309fe0c7f1ad92a0daf864d02e7c65eec20f26c9ee3024f595f3e4f
EOF
chmod 600 /www/wwwroot/auth.wzagent.cn/api/.env
chown www:www /www/wwwroot/auth.wzagent.cn/api/.env
echo "Created .env file"
