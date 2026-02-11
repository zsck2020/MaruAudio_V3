<?php
echo "JWT_SECRET=" . (getenv('MARUAUDIO_JWT_SECRET') ?: getenv('JWT_SECRET') ?: 'NOT_SET') . "\n";
echo "DB_PASSWORD=" . (getenv('MARUAUDIO_DB_PASSWORD') ?: getenv('DB_PASSWORD') ?: 'NOT_SET') . "\n";
echo "DB_HOST=" . (getenv('MARUAUDIO_DB_HOST') ?: getenv('DB_HOST') ?: 'NOT_SET') . "\n";
echo "DB_NAME=" . (getenv('MARUAUDIO_DB_NAME') ?: getenv('DB_NAME') ?: 'NOT_SET') . "\n";
echo "DB_USER=" . (getenv('MARUAUDIO_DB_USER') ?: getenv('DB_USER') ?: 'NOT_SET') . "\n";
echo "SMTP_USER=" . (getenv('MARUAUDIO_SMTP_USER') ?: 'NOT_SET') . "\n";
echo "SMTP_PASS=" . (getenv('MARUAUDIO_SMTP_PASS') ?: 'NOT_SET') . "\n";
echo "ENV=" . (getenv('MARUAUDIO_ENV') ?: 'NOT_SET') . "\n";
echo "SIGNATURE_KEY=" . (getenv('MARUAUDIO_SIGNATURE_KEY') ?: getenv('SIGNATURE_KEY') ?: 'NOT_SET') . "\n";
