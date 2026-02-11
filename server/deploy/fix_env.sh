#!/bin/bash
# Add API_SIGN_SECRET to .env if not present
ENV_FILE="/www/wwwroot/auth.wzagent.cn/api/.env"
if ! grep -q "MARUAUDIO_API_SIGN_SECRET" "$ENV_FILE"; then
    SECRET=$(openssl rand -hex 32)
    echo "MARUAUDIO_API_SIGN_SECRET=$SECRET" >> "$ENV_FILE"
    echo "Added MARUAUDIO_API_SIGN_SECRET"
else
    echo "MARUAUDIO_API_SIGN_SECRET already exists"
fi
chmod 600 "$ENV_FILE"
