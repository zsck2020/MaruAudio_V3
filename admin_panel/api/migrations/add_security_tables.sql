-- 安全加固相关数据库表
-- 用于存储已使用的授权码，防止重放攻击

CREATE TABLE IF NOT EXISTS `used_auth_codes` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `code_hash` VARCHAR(64) NOT NULL COMMENT '授权码哈希值',
    `user_id` INT UNSIGNED NOT NULL COMMENT '使用者ID',
    `used_at` DATETIME NOT NULL COMMENT '使用时间',
    UNIQUE KEY `uk_code_hash` (`code_hash`),
    KEY `idx_used_at` (`used_at`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='已使用的TTS授权码';

-- 定期清理过期记录的事件（可选）
-- CREATE EVENT IF NOT EXISTS `cleanup_used_auth_codes`
-- ON SCHEDULE EVERY 1 HOUR
-- DO DELETE FROM `used_auth_codes` WHERE `used_at` < DATE_SUB(NOW(), INTERVAL 1 HOUR);
