-- 添加RBAC和增强日志记录支持
-- 执行时间: 2024

-- 创建管理员操作日志表（如果不存在）
CREATE TABLE IF NOT EXISTS `admin_operation_logs` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `admin_id` INT UNSIGNED NOT NULL COMMENT '管理员ID',
    `admin_username` VARCHAR(50) NOT NULL COMMENT '管理员用户名',
    `admin_role` VARCHAR(20) DEFAULT NULL COMMENT '管理员角色',
    `action` VARCHAR(100) NOT NULL COMMENT '操作类型',
    `target_type` VARCHAR(50) DEFAULT NULL COMMENT '目标类型',
    `target_id` INT UNSIGNED DEFAULT NULL COMMENT '目标ID',
    `details` TEXT DEFAULT NULL COMMENT '操作详情(JSON)',
    `ip` VARCHAR(45) DEFAULT NULL COMMENT 'IP地址',
    `user_agent` VARCHAR(255) DEFAULT NULL COMMENT 'User Agent',
    `request_uri` VARCHAR(500) DEFAULT NULL COMMENT '请求URI',
    `request_method` VARCHAR(10) DEFAULT NULL COMMENT '请求方法',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX `idx_admin_id` (`admin_id`),
    INDEX `idx_action` (`action`),
    INDEX `idx_target` (`target_type`, `target_id`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员操作日志表';

-- 为现有表添加新字段（如果不存在）
ALTER TABLE `admin_operation_logs` 
    ADD COLUMN IF NOT EXISTS `admin_role` VARCHAR(20) DEFAULT NULL COMMENT '管理员角色' AFTER `admin_username`,
    ADD COLUMN IF NOT EXISTS `user_agent` VARCHAR(255) DEFAULT NULL COMMENT 'User Agent' AFTER `ip`,
    ADD COLUMN IF NOT EXISTS `request_uri` VARCHAR(500) DEFAULT NULL COMMENT '请求URI' AFTER `user_agent`,
    ADD COLUMN IF NOT EXISTS `request_method` VARCHAR(10) DEFAULT NULL COMMENT '请求方法' AFTER `request_uri`;

