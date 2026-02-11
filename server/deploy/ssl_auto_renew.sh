#!/bin/bash
# MaruAudio SSL 证书自动续期脚本
# 建议添加到 crontab: 0 3 * * * /path/to/ssl_auto_renew.sh

# 加载部署配置
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/deploy.env" 2>/dev/null

# 如果没有加载到配置，使用默认值
DOMAIN="${DOMAIN:-wzuser.wzagent.cn}"
SSL_CERT_DIR="${SSL_CERT_DIR:-/www/server/panel/vhost/cert/${DOMAIN}}"
CERT_FILE="${SSL_CERT_DIR}/fullchain.pem"
LOG_FILE="/var/log/ssl_renew.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

if [ ! -f "$CERT_FILE" ]; then
    log "ERROR: 证书文件不存在: $CERT_FILE"
    exit 1
fi

EXPIRE_DATE=$(openssl x509 -enddate -noout -in "$CERT_FILE" | cut -d= -f2)
EXPIRE_TIMESTAMP=$(date -d "$EXPIRE_DATE" +%s)
NOW_TIMESTAMP=$(date +%s)
DAYS_LEFT=$(( (EXPIRE_TIMESTAMP - NOW_TIMESTAMP) / 86400 ))

log "证书剩余有效期: $DAYS_LEFT 天 (域名: $DOMAIN)"

if [ "$DAYS_LEFT" -le 7 ]; then
    log "开始续期 SSL 证书..."
    cd /www/server/panel
    /www/server/panel/pyenv/bin/python /www/server/panel/class/acme_v2.py --renew=1 >> "$LOG_FILE" 2>&1
    RENEW_RESULT=$?

    if [ $RENEW_RESULT -eq 0 ]; then
        log "SSL 证书续期成功"
        nginx -s reload >> "$LOG_FILE" 2>&1
        NEW_EXPIRE=$(openssl x509 -enddate -noout -in "$CERT_FILE" | cut -d= -f2)
        log "新证书到期时间: $NEW_EXPIRE"
    else
        log "ERROR: SSL 证书续期失败，返回码: $RENEW_RESULT"
        exit 1
    fi
else
    log "证书有效期充足，无需续期"
fi
