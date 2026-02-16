-- 修复机器码字段长度问题
-- 执行此脚本修复 SQLSTATE[22001] 错误

-- 创建 register_codes 表（如果不存在）
CREATE TABLE IF NOT EXISTS `register_codes` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `machine_code` VARCHAR(100) DEFAULT NULL,
    `expires_at` DATETIME NOT NULL,
    `used` TINYINT(1) DEFAULT 0,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_email` (`email`),
    INDEX `idx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建 password_reset_codes 表（如果不存在）
CREATE TABLE IF NOT EXISTS `password_reset_codes` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `used` TINYINT(1) DEFAULT 0,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_email` (`email`),
    INDEX `idx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建 machine_registrations 表（如果不存在）
CREATE TABLE IF NOT EXISTS `machine_registrations` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `machine_code` VARCHAR(100) NOT NULL,
    `user_id` INT UNSIGNED NOT NULL,
    `register_ip` VARCHAR(45) DEFAULT NULL,
    `hardware_info` TEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_machine_code` (`machine_code`),
    INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建 user_login_logs 表（如果不存在）
CREATE TABLE IF NOT EXISTS `user_login_logs` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED DEFAULT NULL,
    `email` VARCHAR(255) DEFAULT NULL,
    `login_ip` VARCHAR(45) DEFAULT NULL,
    `machine_code` VARCHAR(100) DEFAULT NULL,
    `device_name` VARCHAR(100) DEFAULT NULL,
    `os_version` VARCHAR(100) DEFAULT NULL,
    `client_version` VARCHAR(50) DEFAULT NULL,
    `login_result` ENUM('success', 'failed') DEFAULT 'success',
    `fail_reason` VARCHAR(255) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 修改 users 表添加 register_machine_code 和 register_ip 字段
ALTER TABLE `users` 
    ADD COLUMN IF NOT EXISTS `register_machine_code` VARCHAR(100) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `register_ip` VARCHAR(45) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `last_login_ip` VARCHAR(45) DEFAULT NULL;

-- 修改现有表的 machine_code 字段长度（如果需要）
ALTER TABLE `machine_bindings` MODIFY COLUMN `machine_code` VARCHAR(100) NOT NULL;
ALTER TABLE `login_logs` MODIFY COLUMN `machine_code` VARCHAR(100) DEFAULT NULL;
