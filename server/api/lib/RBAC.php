<?php
/**
 * 基于角色的访问控制 (RBAC)
 */
class RBAC {
    // 角色定义
    const ROLE_SUPER = 'super';      // 超级管理员 - 所有权限
    const ROLE_ADMIN = 'admin';       // 管理员 - 大部分权限
    const ROLE_OPERATOR = 'operator'; // 操作员 - 有限权限
    
    // 权限定义
    const PERMISSION_USER_MANAGE = 'user.manage';           // 用户管理
    const PERMISSION_USER_DELETE = 'user.delete';           // 删除用户
    const PERMISSION_USER_RESET_PASSWORD = 'user.reset_password'; // 重置密码
    const PERMISSION_CARD_MANAGE = 'card.manage';           // 卡密管理
    const PERMISSION_CARD_GENERATE = 'card.generate';       // 生成卡密
    const PERMISSION_CARD_DELETE = 'card.delete';          // 删除卡密
    const PERMISSION_SETTING_MANAGE = 'setting.manage';    // 系统设置
    const PERMISSION_WITHDRAWAL_MANAGE = 'withdrawal.manage'; // 提现管理
    const PERMISSION_BACKUP_MANAGE = 'backup.manage';      // 备份管理
    const PERMISSION_LOG_VIEW = 'log.view';                // 查看日志
    const PERMISSION_LOG_CLEANUP = 'log.cleanup';          // 清理日志
    const PERMISSION_VERSION_MANAGE = 'version.manage';    // 版本管理
    const PERMISSION_ADMIN_MANAGE = 'admin.manage';        // 管理员管理
    const PERMISSION_CHARACTER_PACK_MANAGE = 'character_pack.manage'; // 字符包管理
    
    /**
     * 角色权限映射
     */
    private static $rolePermissions = [
        self::ROLE_SUPER => [
            // 超级管理员拥有所有权限
            self::PERMISSION_USER_MANAGE,
            self::PERMISSION_USER_DELETE,
            self::PERMISSION_USER_RESET_PASSWORD,
            self::PERMISSION_CARD_MANAGE,
            self::PERMISSION_CARD_GENERATE,
            self::PERMISSION_CARD_DELETE,
            self::PERMISSION_SETTING_MANAGE,
            self::PERMISSION_WITHDRAWAL_MANAGE,
            self::PERMISSION_BACKUP_MANAGE,
            self::PERMISSION_LOG_VIEW,
            self::PERMISSION_LOG_CLEANUP,
            self::PERMISSION_VERSION_MANAGE,
            self::PERMISSION_ADMIN_MANAGE,
            self::PERMISSION_CHARACTER_PACK_MANAGE,
        ],
        self::ROLE_ADMIN => [
            // 管理员权限（排除敏感操作）
            self::PERMISSION_USER_MANAGE,
            self::PERMISSION_CARD_MANAGE,
            self::PERMISSION_CARD_GENERATE,
            self::PERMISSION_WITHDRAWAL_MANAGE,
            self::PERMISSION_LOG_VIEW,
            self::PERMISSION_VERSION_MANAGE,
            self::PERMISSION_CHARACTER_PACK_MANAGE,
        ],
        self::ROLE_OPERATOR => [
            // 操作员权限（只读和基本操作）
            self::PERMISSION_USER_MANAGE,
            self::PERMISSION_LOG_VIEW,
        ],
    ];
    
    /**
     * 检查管理员是否有指定权限
     */
    public static function hasPermission($role, $permission) {
        if ($role === self::ROLE_SUPER) {
            return true; // 超级管理员拥有所有权限
        }
        
        if (!isset(self::$rolePermissions[$role])) {
            return false;
        }
        
        return in_array($permission, self::$rolePermissions[$role]);
    }
    
    /**
     * 获取管理员角色
     */
    public static function getAdminRole($adminId) {
        $db = Database::getInstance();
        $admin = $db->fetch("SELECT role FROM admins WHERE id = ?", [$adminId]);
        return $admin ? $admin['role'] : null;
    }
    
    /**
     * 检查并验证权限（中间件）
     */
    public static function checkPermission($permission) {
        $payload = JWTAuth::getPayloadFromRequest();
        
        if (!$payload || !isset($payload['type']) || $payload['type'] !== 'admin') {
            Response::error('未登录或Token已过期', 4001);
        }
        
        $adminId = $payload['admin_id'] ?? 0;
        $role = self::getAdminRole($adminId);
        
        if (!$role) {
            Response::error('管理员不存在', 4003);
        }
        
        if (!self::hasPermission($role, $permission)) {
            Response::error('权限不足', 4004);
        }
        
        return $payload;
    }
    
    /**
     * 检查是否为超级管理员
     */
    public static function isSuperAdmin($adminId) {
        $role = self::getAdminRole($adminId);
        return $role === self::ROLE_SUPER;
    }
    
    /**
     * 获取角色名称
     */
    public static function getRoleName($role) {
        $names = [
            self::ROLE_SUPER => '超级管理员',
            self::ROLE_ADMIN => '管理员',
            self::ROLE_OPERATOR => '操作员',
        ];
        return $names[$role] ?? '未知';
    }
}

