<?php
/**
 * Banner 轮播图管理控制器
 * 
 * 管理后台：CRUD 操作（需要管理员权限）
 * 公共接口：获取启用的 Banner 列表（无需登录）
 */
class BannerController {
    
    /**
     * 验证管理员 Token
     */
    private static function checkAdminAuth() {
        $payload = JWTAuth::getPayloadFromRequest();
        
        if (!$payload || !isset($payload['type']) || $payload['type'] !== 'admin') {
            Response::error('未登录或Token已过期', 4001);
        }
        
        return $payload;
    }
    
    /**
     * 记录操作日志
     */
    private static function logOperation($action, $targetId = null, $details = null) {
        try {
            $db = Database::getInstance();
            $adminData = JWTAuth::getPayloadFromRequest();
            
            if (!$adminData) {
                return;
            }
            
            $db->insert('admin_operation_logs', [
                'admin_id' => $adminData['admin_id'] ?? 0,
                'admin_username' => $adminData['username'] ?? 'unknown',
                'action' => $action,
                'target_type' => 'banner',
                'target_id' => $targetId,
                'details' => $details ? json_encode($details, JSON_UNESCAPED_UNICODE) : null,
                'ip' => $_SERVER['REMOTE_ADDR'] ?? ''
            ]);
        } catch (Exception $e) {
            error_log('操作日志记录失败: ' . $e->getMessage());
        }
    }
    
    // ==================== 公共接口 ====================
    
    /**
     * 获取启用的 Banner 列表（公共接口，无需登录）
     * GET /api/banners
     */
    public static function getActiveBanners($input) {
        $db = Database::getInstance();
        
        $productCode = $input['product_code'] ?? 'dubbing';
        
        $banners = $db->fetchAll(
            "SELECT id, title, image_url, link_url, link_type, sort_order 
             FROM banners 
             WHERE is_enabled = 1 AND product_code = ?
             ORDER BY sort_order DESC, id DESC",
            [$productCode]
        );
        
        Response::success($banners);
    }
    
    // ==================== 管理后台接口 ====================
    
    /**
     * 获取所有 Banner 列表（管理后台）
     * GET /api/admin/banners
     */
    public static function list($input) {
        self::checkAdminAuth();
        
        $db = Database::getInstance();
        
        $productCode = $input['product_code'] ?? '';
        
        $where = '1=1';
        $params = [];
        
        if (!empty($productCode)) {
            $where .= ' AND product_code = ?';
            $params[] = $productCode;
        }
        
        $banners = $db->fetchAll(
            "SELECT * FROM banners WHERE {$where} ORDER BY sort_order DESC, id DESC",
            $params
        );
        
        Response::success([
            'list' => $banners,
            'total' => count($banners)
        ]);
    }
    
    /**
     * 创建 Banner
     * POST /api/admin/banners/create
     */
    public static function create($input) {
        self::checkAdminAuth();
        
        // 验证必填字段
        if (empty($input['title'])) {
            Response::error('Banner标题不能为空');
        }
        if (empty($input['image_url'])) {
            Response::error('Banner图片不能为空');
        }
        
        $db = Database::getInstance();
        
        $data = [
            'title' => trim($input['title']),
            'image_url' => trim($input['image_url']),
            'link_url' => trim($input['link_url'] ?? ''),
            'link_type' => in_array($input['link_type'] ?? 'none', ['none', 'url', 'page']) ? $input['link_type'] : 'none',
            'sort_order' => (int)($input['sort_order'] ?? 0),
            'is_enabled' => isset($input['is_enabled']) ? (int)$input['is_enabled'] : 1,
            'product_code' => trim($input['product_code'] ?? 'dubbing')
        ];
        
        $id = $db->insert('banners', $data);
        
        self::logOperation('创建Banner', $id, ['title' => $data['title']]);
        
        Response::success(['id' => $id], '创建成功');
    }
    
    /**
     * 更新 Banner
     * POST /api/admin/banners/update
     */
    public static function update($input) {
        self::checkAdminAuth();
        
        if (empty($input['id'])) {
            Response::error('Banner ID不能为空');
        }
        
        $db = Database::getInstance();
        
        // 检查是否存在
        $banner = $db->fetch("SELECT * FROM banners WHERE id = ?", [$input['id']]);
        if (!$banner) {
            Response::error('Banner不存在');
        }
        
        $data = [];
        
        if (isset($input['title'])) {
            $data['title'] = trim($input['title']);
        }
        if (isset($input['image_url'])) {
            $data['image_url'] = trim($input['image_url']);
        }
        if (isset($input['link_url'])) {
            $data['link_url'] = trim($input['link_url']);
        }
        if (isset($input['link_type'])) {
            $data['link_type'] = in_array($input['link_type'], ['none', 'url', 'page']) ? $input['link_type'] : 'none';
        }
        if (isset($input['sort_order'])) {
            $data['sort_order'] = (int)$input['sort_order'];
        }
        if (isset($input['is_enabled'])) {
            $data['is_enabled'] = (int)$input['is_enabled'];
        }
        if (isset($input['product_code'])) {
            $data['product_code'] = trim($input['product_code']);
        }
        
        if (empty($data)) {
            Response::error('没有需要更新的字段');
        }
        
        $db->update('banners', $data, 'id = ?', [$input['id']]);
        
        self::logOperation('更新Banner', $input['id'], $data);
        
        Response::success(null, '更新成功');
    }
    
    /**
     * 删除 Banner
     * POST /api/admin/banners/delete
     */
    public static function delete($input) {
        self::checkAdminAuth();
        
        if (empty($input['id'])) {
            Response::error('Banner ID不能为空');
        }
        
        $db = Database::getInstance();
        
        $banner = $db->fetch("SELECT * FROM banners WHERE id = ?", [$input['id']]);
        if (!$banner) {
            Response::error('Banner不存在');
        }
        
        $db->query("DELETE FROM banners WHERE id = ?", [$input['id']]);
        
        self::logOperation('删除Banner', $input['id'], ['title' => $banner['title']]);
        
        Response::success(null, '删除成功');
    }
    
    /**
     * 切换 Banner 启用/禁用状态
     * POST /api/admin/banners/toggle
     */
    public static function toggle($input) {
        self::checkAdminAuth();
        
        if (empty($input['id'])) {
            Response::error('Banner ID不能为空');
        }
        
        $db = Database::getInstance();
        
        $banner = $db->fetch("SELECT * FROM banners WHERE id = ?", [$input['id']]);
        if (!$banner) {
            Response::error('Banner不存在');
        }
        
        $newStatus = $banner['is_enabled'] ? 0 : 1;
        $db->update('banners', ['is_enabled' => $newStatus], 'id = ?', [$input['id']]);
        
        $statusText = $newStatus ? '启用' : '禁用';
        self::logOperation("{$statusText}Banner", $input['id'], ['title' => $banner['title']]);
        
        Response::success(['is_enabled' => $newStatus], "{$statusText}成功");
    }
    
    /**
     * 批量更新排序
     * POST /api/admin/banners/sort
     */
    public static function updateSort($input) {
        self::checkAdminAuth();
        
        if (empty($input['items']) || !is_array($input['items'])) {
            Response::error('排序数据不能为空');
        }
        
        $db = Database::getInstance();
        
        foreach ($input['items'] as $item) {
            if (isset($item['id']) && isset($item['sort_order'])) {
                $db->update('banners', ['sort_order' => (int)$item['sort_order']], 'id = ?', [$item['id']]);
            }
        }
        
        self::logOperation('批量更新Banner排序', null, ['count' => count($input['items'])]);
        
        Response::success(null, '排序更新成功');
    }
}
