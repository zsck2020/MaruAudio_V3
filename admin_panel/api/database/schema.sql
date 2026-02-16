-- 丸子配音数据库表结构
-- 创建时间: 2025-01-16

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(500) DEFAULT NULL,
    `user_group` ENUM('free', 'monthly', 'yearly', 'permanent') DEFAULT 'free',
    `expire_time` DATETIME DEFAULT NULL,
    `invite_code` VARCHAR(20) DEFAULT NULL UNIQUE,
    `invited_by` INT UNSIGNED DEFAULT NULL,
    `register_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `last_login_time` DATETIME DEFAULT NULL,
    `status` ENUM('active', 'banned') DEFAULT 'active',
    `password_changed_at` DATETIME DEFAULT NULL,
    INDEX `idx_email` (`email`),
    INDEX `idx_invite_code` (`invite_code`),
    INDEX `idx_invited_by` (`invited_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 机器码绑定表
CREATE TABLE IF NOT EXISTS `machine_bindings` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `machine_code` VARCHAR(64) NOT NULL,
    `bind_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_user_machine` (`user_id`, `machine_code`),
    INDEX `idx_machine_code` (`machine_code`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 卡密表
CREATE TABLE IF NOT EXISTS `card_keys` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `card_key` VARCHAR(50) NOT NULL UNIQUE,
    `card_type` ENUM('monthly', 'yearly', 'permanent') NOT NULL,
    `duration_days` INT UNSIGNED DEFAULT 30,
    `status` ENUM('unused', 'used', 'disabled') DEFAULT 'unused',
    `product_code` VARCHAR(50) DEFAULT 'dubbing',
    `batch_id` VARCHAR(50) DEFAULT NULL,
    `remark` VARCHAR(255) DEFAULT NULL,
    `created_by` INT UNSIGNED DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `used_at` DATETIME DEFAULT NULL,
    `used_by` INT UNSIGNED DEFAULT NULL,
    INDEX `idx_status` (`status`),
    INDEX `idx_batch_id` (`batch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 验证码表
CREATE TABLE IF NOT EXISTS `verification_codes` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `type` ENUM('register', 'reset', 'login') NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `used` TINYINT(1) DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_email_type` (`email`, `type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 佣金记录表
CREATE TABLE IF NOT EXISTS `commissions` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL COMMENT '佣金所属用户',
    `from_user_id` INT UNSIGNED NOT NULL COMMENT '产生佣金的用户（被邀请人）',
    `order_id` INT UNSIGNED DEFAULT NULL COMMENT '关联订单ID',
    `amount` DECIMAL(10, 2) NOT NULL COMMENT '佣金金额',
    `rate` DECIMAL(5, 2) DEFAULT 10.00 COMMENT '佣金比例',
    `status` ENUM('available', 'frozen', 'withdrawn') DEFAULT 'available',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_status` (`status`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 提现申请表
CREATE TABLE IF NOT EXISTS `withdrawals` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `account_type` ENUM('alipay', 'wechat', 'bank') DEFAULT 'alipay',
    `account` VARCHAR(255) NOT NULL COMMENT '收款账号',
    `real_name` VARCHAR(50) DEFAULT NULL COMMENT '真实姓名',
    `qrcode_url` VARCHAR(500) DEFAULT NULL COMMENT '收款二维码',
    `status` ENUM('pending', 'completed', 'rejected') DEFAULT 'pending',
    `reject_reason` VARCHAR(255) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `processed_at` DATETIME DEFAULT NULL,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_status` (`status`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 登录日志表
CREATE TABLE IF NOT EXISTS `login_logs` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `ip` VARCHAR(45) DEFAULT NULL,
    `machine_code` VARCHAR(64) DEFAULT NULL,
    `user_agent` VARCHAR(500) DEFAULT NULL,
    `status` ENUM('success', 'failed') DEFAULT 'success',
    `fail_reason` VARCHAR(100) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 系统设置表
CREATE TABLE IF NOT EXISTS `system_settings` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `setting_key` VARCHAR(100) NOT NULL UNIQUE,
    `setting_value` TEXT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 管理员表
CREATE TABLE IF NOT EXISTS `admins` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(255) DEFAULT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('super', 'admin', 'operator') DEFAULT 'admin',
    `last_login_time` DATETIME DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认管理员（密码: admin123）
INSERT IGNORE INTO `admins` (`username`, `password_hash`, `role`) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super');

-- 插入默认系统设置
INSERT IGNORE INTO `system_settings` (`setting_key`, `setting_value`) VALUES
('registration_enabled', '1'),
('machine_code_limit', '2'),
('machine_change_cooldown', '7'),
('login_fail_limit', '5'),
('login_lock_duration', '30'),
('trial_enabled', '1'),
('trial_duration_days', '3'),
('invite_enabled', '1'),
('invite_rules', '[]'),
('commission_enabled', '1'),
('commission_rate', '10'),
('commission_min_withdraw', '50'),
('current_version', '1.0.0'),
('force_update', '0');
