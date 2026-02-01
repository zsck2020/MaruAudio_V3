-- 添加单设备在线控制所需的字段
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `current_session_id` VARCHAR(64) DEFAULT NULL COMMENT '当前会话ID，用于单设备在线控制',
ADD COLUMN IF NOT EXISTS `current_machine_code` VARCHAR(100) DEFAULT NULL COMMENT '当前登录的机器码';

-- 添加索引
ALTER TABLE `users` ADD INDEX IF NOT EXISTS `idx_current_session_id` (`current_session_id`);
