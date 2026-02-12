#!/bin/bash
echo "=== TABLES ==="
mysql -u maruaudio -p'6FS64ybEGeyMcpZs' maruaudio -e "SHOW TABLES;"
echo ""
echo "=== SCHEMA ==="
mysql -u maruaudio -p'6FS64ybEGeyMcpZs' maruaudio -e "
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA='maruaudio'
ORDER BY TABLE_NAME, ORDINAL_POSITION;
"
