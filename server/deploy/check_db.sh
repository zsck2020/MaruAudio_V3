#!/bin/bash
mysql -u maruaudio -p'6FS64ybEGeyMcpZs' maruaudio << 'EOF'
SHOW TABLES;
DESCRIBE admin_login_logs;
DESCRIBE admins;
EOF
