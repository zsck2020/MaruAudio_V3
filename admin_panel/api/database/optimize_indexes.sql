-- 数据库索引优化脚本
-- 用于提升查询性能和数据完整性

-- 为 users 表添加 status 字段索引（用于快速查询活跃/封禁用户）
ALTER TABLE `users` ADD INDEX IF NOT EXISTS `idx_status` (`status`);

-- 为 users 表添加 user_group 字段索引（用于快速查询会员类型）
ALTER TABLE `users` ADD INDEX IF NOT EXISTS `idx_user_group` (`user_group`);

-- 为 users 表添加 expire_time 字段索引（用于快速查询即将过期的会员）
ALTER TABLE `users` ADD INDEX IF NOT EXISTS `idx_expire_time` (`expire_time`);

-- 为 users 表添加复合索引（用于常见查询组合）
ALTER TABLE `users` ADD INDEX IF NOT EXISTS `idx_status_group` (`status`, `user_group`);

-- 为 machine_bindings 表添加 user_id 索引（如果不存在）
ALTER TABLE `machine_bindings` ADD INDEX IF NOT EXISTS `idx_user_id` (`user_id`);

-- 为 card_keys 表添加 used_by 索引（用于快速查询用户使用的卡密）
ALTER TABLE `card_keys` ADD INDEX IF NOT EXISTS `idx_used_by` (`used_by`);

-- 为 card_keys 表添加 created_at 索引（用于按时间排序）
ALTER TABLE `card_keys` ADD INDEX IF NOT EXISTS `idx_created_at` (`created_at`);

-- 为 commissions 表添加 from_user_id 索引（用于查询被邀请人的佣金）
ALTER TABLE `commissions` ADD INDEX IF NOT EXISTS `idx_from_user_id` (`from_user_id`);

-- 为 commissions 表添加 created_at 索引（用于按时间排序）
ALTER TABLE `commissions` ADD INDEX IF NOT EXISTS `idx_created_at` (`created_at`);

-- 为 withdrawals 表添加 created_at 索引（用于按时间排序）
ALTER TABLE `withdrawals` ADD INDEX IF NOT EXISTS `idx_created_at` (`created_at`);

-- 为 user_login_logs 表添加复合索引（用于快速查询登录失败记录）
ALTER TABLE `user_login_logs` ADD INDEX IF NOT EXISTS `idx_email_result` (`email`, `login_result`, `created_at`);

-- 为 user_login_logs 表添加 ip 索引（用于快速查询IP登录记录）
ALTER TABLE `user_login_logs` ADD INDEX IF NOT EXISTS `idx_login_ip` (`login_ip`);

-- 为 admin_login_logs 表添加复合索引（如果表存在）
-- ALTER TABLE `admin_login_logs` ADD INDEX IF NOT EXISTS `idx_username_result` (`username`, `login_result`, `created_at`);

-- 为 admin_operation_logs 表添加复合索引（如果表存在）
-- ALTER TABLE `admin_operation_logs` ADD INDEX IF NOT EXISTS `idx_admin_action` (`admin_id`, `action`, `created_at`);
















