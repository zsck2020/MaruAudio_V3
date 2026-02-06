<?php
/**
 * 管理员操作辅助类
 * 提供统一的权限检查和日志记录功能
 */
class AdminHelper {
    /**
     * 检查管理员身份验证
     */
    public static function checkAuth() {
        $payload = JWTAuth::getPayloadFromRequest();
        
        if (!$payload || !isset($payload['type']) || $payload['type'] !== 'admin') {
            Response::error('未登录或Token已过期', 4001);
        }
        
        return $payload;
    }
    
    /**
     * 检查权限（RBAC）
     */
    public static function checkPermission($permission) {
        return RBAC::checkPermission($permission);
    }
    
    /**
     * 记录操作日志（增强版）
     */
    public static function logOperation($action, $targetType = null, $targetId = null, $details = null) {
        try {
            $db = Database::getInstance();
            $adminData = JWTAuth::getPayloadFromRequest();
            
            if (!$adminData) {
                return; // 未登录时不记录日志
            }
            
            // 获取请求信息
            $ip = $_SERVER['REMOTE_ADDR'] ?? '';
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
            $requestUri = $_SERVER['REQUEST_URI'] ?? '';
            $requestMethod = $_SERVER['REQUEST_METHOD'] ?? '';
            
            // 获取管理员角色
            $adminId = $adminData['admin_id'] ?? 0;
            $role = RBAC::getAdminRole($adminId);
            
            // 准备日志数据
            $logData = [
                'admin_id' => $adminId,
                'admin_username' => $adminData['username'] ?? 'unknown',
                'action' => $action,
                'target_type' => $targetType,
                'target_id' => $targetId,
                'details' => $details ? json_encode($details, JSON_UNESCAPED_UNICODE) : null,
                'ip' => $ip
            ];
            
            // 添加可选字段（如果表中有这些字段）
            if ($role) {
                $logData['admin_role'] = $role;
            }
            if ($userAgent) {
                $logData['user_agent'] = substr($userAgent, 0, 255);
            }
            if ($requestUri) {
                $logData['request_uri'] = substr($requestUri, 0, 500);
            }
            if ($requestMethod) {
                $logData['request_method'] = $requestMethod;
            }
            
            $db->insert('admin_operation_logs', $logData);
        } catch (Exception $e) {
            // 日志记录失败不影响主流程
            error_log('操作日志记录失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 使用事务执行操作
     */
    public static function withTransaction($callback) {
        $db = Database::getInstance();
        
        $db->beginTransaction();
        try {
            $result = $callback($db);
            $db->commit();
            return $result;
        } catch (Exception $e) {
            $db->rollback();
            throw $e;
        }
    }
}

