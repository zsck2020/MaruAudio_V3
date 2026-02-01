-- 云端字符包系统数据库表结构
-- 创建时间: 2025-01-25

-- 字符包激活码表
CREATE TABLE IF NOT EXISTS `character_pack_codes` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(32) NOT NULL UNIQUE COMMENT '激活码',
    `pack_type` ENUM('basic', 'standard', 'professional') NOT NULL COMMENT '套餐类型',
    `characters` INT UNSIGNED NOT NULL COMMENT '字符数量',
    `price` DECIMAL(10, 2) NOT NULL COMMENT '售价',
    `validity_days` INT UNSIGNED DEFAULT 365 COMMENT '有效期天数',
    `status` ENUM('unused', 'used', 'disabled') DEFAULT 'unused' COMMENT '状态',
    `batch_id` VARCHAR(50) DEFAULT NULL COMMENT '批次ID',
    `remark` VARCHAR(255) DEFAULT NULL COMMENT '备注',
    `created_by` INT UNSIGNED DEFAULT NULL COMMENT '创建管理员ID',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `used_at` DATETIME DEFAULT NULL COMMENT '使用时间',
    `used_by` INT UNSIGNED DEFAULT NULL COMMENT '使用用户ID',
    INDEX `idx_code` (`code`),
    INDEX `idx_status` (`status`),
    INDEX `idx_batch_id` (`batch_id`),
    INDEX `idx_pack_type` (`pack_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='字符包激活码表';

-- 用户字符余额表
CREATE TABLE IF NOT EXISTS `user_character_balance` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL UNIQUE COMMENT '用户ID',
    `total_characters` BIGINT UNSIGNED DEFAULT 0 COMMENT '累计获得字符数',
    `used_characters` BIGINT UNSIGNED DEFAULT 0 COMMENT '已使用字符数',
    `balance` BIGINT UNSIGNED DEFAULT 0 COMMENT '当前余额',
    `expire_time` DATETIME DEFAULT NULL COMMENT '最近一次充值的到期时间',
    `last_use_time` DATETIME DEFAULT NULL COMMENT '最后使用时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_balance` (`balance`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户字符余额表';

-- 字符消耗日志表
CREATE TABLE IF NOT EXISTS `character_usage_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
    `action` ENUM('consume', 'refund', 'recharge', 'adjust', 'expire') NOT NULL COMMENT '操作类型',
    `characters` INT NOT NULL COMMENT '字符变动数量(正数增加,负数减少)',
    `balance_before` BIGINT UNSIGNED NOT NULL COMMENT '操作前余额',
    `balance_after` BIGINT UNSIGNED NOT NULL COMMENT '操作后余额',
    `text_length` INT UNSIGNED DEFAULT NULL COMMENT '原始文本长度',
    `text_preview` VARCHAR(100) DEFAULT NULL COMMENT '文本预览(前100字符)',
    `source` VARCHAR(50) DEFAULT NULL COMMENT '来源(激活码/管理员调整等)',
    `source_id` VARCHAR(50) DEFAULT NULL COMMENT '来源ID(激活码ID等)',
    `ip` VARCHAR(45) DEFAULT NULL COMMENT 'IP地址',
    `machine_code` VARCHAR(64) DEFAULT NULL COMMENT '机器码',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_action` (`action`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_user_action` (`user_id`, `action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='字符消耗日志表';

-- 字符包套餐配置表
CREATE TABLE IF NOT EXISTS `character_pack_config` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `pack_type` VARCHAR(20) NOT NULL UNIQUE COMMENT '套餐类型',
    `name` VARCHAR(50) NOT NULL COMMENT '套餐名称',
    `characters` INT UNSIGNED NOT NULL COMMENT '字符数量',
    `price` DECIMAL(10, 2) NOT NULL COMMENT '售价',
    `validity_days` INT UNSIGNED DEFAULT 365 COMMENT '有效期天数',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
    `sort_order` INT DEFAULT 0 COMMENT '排序',
    `is_active` TINYINT(1) DEFAULT 1 COMMENT '是否启用',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='字符包套餐配置表';

-- 插入默认套餐配置
INSERT INTO `character_pack_config` (`pack_type`, `name`, `characters`, `price`, `validity_days`, `description`, `sort_order`) VALUES
('basic', '基础版', 100000, 38.00, 365, '适合轻度用户，100,000字符额度', 1),
('standard', '标准版', 500000, 158.00, 365, '适合中度用户，500,000字符额度', 2),
('professional', '专业版', 1000000, 288.00, 365, '适合重度用户，1,000,000字符额度', 3);

-- 添加系统设置
INSERT IGNORE INTO `system_settings` (`setting_key`, `setting_value`) VALUES
('character_pack_enabled', '1'),
('character_pack_notice', '字符消耗说明：1个中文=2字符，1个英文/数字/标点/空格=1字符');
