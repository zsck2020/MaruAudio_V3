#!/bin/bash
# ============================================
# MaruAudio 一键部署/迁移脚本
# 用法: bash deploy.sh [--nginx] [--websocket] [--ssl] [--all]
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/deploy.env"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 加载环境变量
if [ ! -f "$ENV_FILE" ]; then
    log_error "找不到 deploy.env 文件: $ENV_FILE"
    exit 1
fi
source "$ENV_FILE"

# 变量替换函数
render_template() {
    local template="$1"
    local output="$2"
    cp "$template" "$output"
    sed -i "s|{{DOMAIN}}|${DOMAIN}|g" "$output"
    sed -i "s|{{PROJECT_ROOT}}|${PROJECT_ROOT}|g" "$output"
    sed -i "s|{{PHP_FPM_SOCK}}|${PHP_FPM_SOCK}|g" "$output"
    sed -i "s|{{SSL_CERT_DIR}}|${SSL_CERT_DIR}|g" "$output"
    sed -i "s|{{WS_PORT}}|${WS_PORT}|g" "$output"
    sed -i "s|{{WS_INTERNAL_PORT}}|${WS_INTERNAL_PORT}|g" "$output"
    sed -i "s|{{WS_LOG}}|${WS_LOG}|g" "$output"
    sed -i "s|{{NGINX_VHOST_DIR}}|${NGINX_VHOST_DIR}|g" "$output"
    sed -i "s|{{NGINX_REWRITE_DIR}}|${NGINX_REWRITE_DIR}|g" "$output"
    sed -i "s|{{LOG_DIR}}|${LOG_DIR}|g" "$output"
    sed -i "s|{{RUN_USER}}|${RUN_USER}|g" "$output"
    sed -i "s|{{RUN_GROUP}}|${RUN_GROUP}|g" "$output"
}

# ============================================
# 部署 Nginx 配置
# ============================================
deploy_nginx() {
    log_info "部署 Nginx 配置..."

    local NGINX_CONF="${NGINX_VHOST_DIR}/${DOMAIN}.conf"
    local REWRITE_CONF="${NGINX_REWRITE_DIR}/${DOMAIN}.conf"

    # 备份现有配置
    if [ -f "$NGINX_CONF" ]; then
        cp "$NGINX_CONF" "${NGINX_CONF}.bak.$(date +%Y%m%d%H%M%S)"
        log_info "已备份现有 Nginx 配置"
    fi

    # 渲染模板
    render_template "${SCRIPT_DIR}/nginx.conf.template" "$NGINX_CONF"
    log_info "Nginx 配置已生成: $NGINX_CONF"

    # 确保 rewrite 配置存在
    if [ ! -f "$REWRITE_CONF" ]; then
        echo "# Rewrite rules handled by location blocks" > "$REWRITE_CONF"
        log_info "创建 rewrite 配置: $REWRITE_CONF"
    fi

    # 确保 well-known 配置目录存在
    local WELL_KNOWN_DIR="${NGINX_VHOST_DIR}/well-known"
    local WELL_KNOWN_CONF="${WELL_KNOWN_DIR}/${DOMAIN}.conf"
    mkdir -p "$WELL_KNOWN_DIR"
    if [ ! -f "$WELL_KNOWN_CONF" ]; then
        echo "location ~ /.well-known { allow all; }" > "$WELL_KNOWN_CONF"
        log_info "创建 well-known 配置"
    fi

    # 确保 extension 目录存在
    mkdir -p "${NGINX_VHOST_DIR}/extension/${DOMAIN}"

    # 测试 Nginx 配置
    if nginx -t 2>&1; then
        nginx -s reload
        log_info "Nginx 配置已重载"
    else
        log_error "Nginx 配置测试失败，请检查配置文件"
        exit 1
    fi
}

# ============================================
# 部署 WebSocket Systemd 服务
# ============================================
deploy_websocket() {
    log_info "部署 WebSocket 服务..."

    local SERVICE_FILE="/etc/systemd/system/maruaudio-websocket.service"

    # 停止旧的 nohup 进程（如果存在）
    pkill -f "php.*server.php" 2>/dev/null || true

    # 安装 Composer 依赖
    if [ ! -d "${PROJECT_ROOT}/websocket/vendor" ]; then
        log_info "安装 WebSocket Composer 依赖..."
        cd "${PROJECT_ROOT}/websocket"
        composer install --no-dev --optimize-autoloader
    fi

    # 渲染并安装 Systemd 服务
    render_template "${SCRIPT_DIR}/maruaudio-websocket.service" "$SERVICE_FILE"
    log_info "Systemd 服务文件已安装: $SERVICE_FILE"

    # 启用并启动服务
    systemctl daemon-reload
    systemctl enable maruaudio-websocket
    systemctl restart maruaudio-websocket

    sleep 2
    if systemctl is-active --quiet maruaudio-websocket; then
        log_info "WebSocket 服务已启动并设为开机自启"
    else
        log_warn "WebSocket 服务启动可能失败，请检查: journalctl -u maruaudio-websocket"
    fi
}

# ============================================
# 部署 SSL 自动续期
# ============================================
deploy_ssl() {
    log_info "部署 SSL 自动续期脚本..."

    local SSL_SCRIPT="/root/ssl_auto_renew.sh"
    cp "${SCRIPT_DIR}/ssl_auto_renew.sh" "$SSL_SCRIPT"
    chmod +x "$SSL_SCRIPT"

    # 检查 crontab 中是否已有续期任务
    if ! crontab -l 2>/dev/null | grep -q "ssl_auto_renew"; then
        (crontab -l 2>/dev/null; echo "0 3 * * * ${SSL_SCRIPT}") | crontab -
        log_info "SSL 续期定时任务已添加 (每天凌晨3点)"
    else
        log_info "SSL 续期定时任务已存在，跳过"
    fi
}

# ============================================
# 修复文件权限
# ============================================
fix_permissions() {
    log_info "修复文件权限..."
    chown -R ${RUN_USER}:${RUN_GROUP} "${PROJECT_ROOT}"
    chmod -R 755 "${PROJECT_ROOT}"
    chmod -R 777 "${PROJECT_ROOT}/uploads" 2>/dev/null
    chmod -R 777 "${PROJECT_ROOT}/api/uploads" 2>/dev/null
    chmod -R 777 "${PROJECT_ROOT}/backups" 2>/dev/null
    log_info "文件权限已修复"
}

# ============================================
# 验证部署
# ============================================
verify_deployment() {
    log_info "验证部署状态..."
    echo ""
    echo "============================================"
    echo "  MaruAudio 部署验证报告"
    echo "============================================"

    # Nginx
    if nginx -t 2>&1 | grep -q "successful"; then
        echo -e "  Nginx 配置:     ${GREEN}✓ 正常${NC}"
    else
        echo -e "  Nginx 配置:     ${RED}✗ 异常${NC}"
    fi

    # PHP-FPM
    if [ -S "$PHP_FPM_SOCK" ]; then
        echo -e "  PHP-FPM:        ${GREEN}✓ 运行中${NC}"
    else
        echo -e "  PHP-FPM:        ${RED}✗ Socket 不存在${NC}"
    fi

    # MySQL
    if mysqladmin ping 2>/dev/null | grep -q "alive"; then
        echo -e "  MySQL:          ${GREEN}✓ 运行中${NC}"
    else
        echo -e "  MySQL:          ${YELLOW}? 无法验证${NC}"
    fi

    # WebSocket
    if systemctl is-active --quiet maruaudio-websocket 2>/dev/null; then
        echo -e "  WebSocket:      ${GREEN}✓ 运行中 (Systemd)${NC}"
    elif ss -tlnp | grep -q ":${WS_PORT}"; then
        echo -e "  WebSocket:      ${YELLOW}✓ 运行中 (非 Systemd)${NC}"
    else
        echo -e "  WebSocket:      ${RED}✗ 未运行${NC}"
    fi

    # SSL
    if [ -f "${SSL_CERT_DIR}/fullchain.pem" ]; then
        local EXPIRE=$(openssl x509 -enddate -noout -in "${SSL_CERT_DIR}/fullchain.pem" 2>/dev/null | cut -d= -f2)
        echo -e "  SSL 证书:       ${GREEN}✓ 有效 (到期: ${EXPIRE})${NC}"
    else
        echo -e "  SSL 证书:       ${RED}✗ 未找到${NC}"
    fi

    # API 测试
    local API_STATUS=$(curl -sk -o /dev/null -w "%{http_code}" "https://${DOMAIN}/api/" 2>/dev/null)
    if [ "$API_STATUS" = "200" ]; then
        echo -e "  API 接口:       ${GREEN}✓ 可访问 (HTTP ${API_STATUS})${NC}"
    else
        echo -e "  API 接口:       ${RED}✗ 不可访问 (HTTP ${API_STATUS})${NC}"
    fi

    # Admin 测试
    local ADMIN_STATUS=$(curl -sk -o /dev/null -w "%{http_code}" "https://${DOMAIN}/admin/" 2>/dev/null)
    if [ "$ADMIN_STATUS" = "200" ]; then
        echo -e "  管理后台:       ${GREEN}✓ 可访问 (HTTP ${ADMIN_STATUS})${NC}"
    else
        echo -e "  管理后台:       ${RED}✗ 不可访问 (HTTP ${ADMIN_STATUS})${NC}"
    fi

    echo "============================================"
    echo ""
}

# ============================================
# 主逻辑
# ============================================
case "${1:-}" in
    --nginx)
        deploy_nginx
        ;;
    --websocket)
        deploy_websocket
        ;;
    --ssl)
        deploy_ssl
        ;;
    --verify)
        verify_deployment
        ;;
    --all|"")
        log_info "开始全量部署 MaruAudio..."
        echo ""
        fix_permissions
        deploy_nginx
        deploy_websocket
        deploy_ssl
        echo ""
        verify_deployment
        log_info "全量部署完成!"
        ;;
    *)
        echo "用法: bash deploy.sh [--nginx] [--websocket] [--ssl] [--verify] [--all]"
        echo ""
        echo "  --nginx      仅部署 Nginx 配置"
        echo "  --websocket  仅部署 WebSocket 服务"
        echo "  --ssl        仅部署 SSL 续期脚本"
        echo "  --verify     验证部署状态"
        echo "  --all        全量部署（默认）"
        exit 1
        ;;
esac
