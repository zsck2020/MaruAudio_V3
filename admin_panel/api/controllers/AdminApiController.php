<?php
/**
 * 管理后台 API 控制器
 */
class AdminApiController {
    
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
     * 敏感操作二次验证
     * 验证管理员密码，返回短期有效的 verify_token
     */
    public static function verifyPassword($input) {
        $payload = self::checkAdminAuth();
        
        $password = $input['password'] ?? '';
        if (empty($password)) {
            Response::error('请输入密码', 1001);
        }
        
        $db = Database::getInstance();
        $admin = $db->fetch("SELECT password_hash FROM admins WHERE id = ?", [$payload['admin_id']]);
        
        if (!$admin || !password_verify($password, $admin['password_hash'])) {
            self::logOperation('敏感操作验证失败', 'admin', $payload['admin_id']);
            Response::error('密码错误', 2002);
        }
        
        // 生成 5 分钟有效的 verify_token
        $tokenData = [
            'admin_id' => $payload['admin_id'],
            'purpose' => 'sensitive_verify',
            'exp' => time() + 300,
            'rand' => bin2hex(random_bytes(8))
        ];
        $tokenJson = json_encode($tokenData);
        $signature = hash_hmac('sha256', $tokenJson, getenv('MARUAUDIO_JWT_SECRET') ?: 'MaruAudio_JWT_Secret_2026_Secure_Key');
        $verifyToken = base64_encode($tokenJson . '.' . $signature);
        
        self::logOperation('敏感操作验证通过', 'admin', $payload['admin_id']);
        
        Response::success(['verify_token' => $verifyToken, 'expires_in' => 300], '验证成功');
    }
    
    /**
     * 检查敏感操作二次验证（如果开关开启）
     * 从请求头 X-Verify-Token 获取验证令牌
     */
    private static function checkSensitiveAuth($payload) {
        $db = Database::getInstance();
        
        // 检查开关是否开启
        $setting = $db->fetch(
            "SELECT setting_value FROM system_settings WHERE setting_key = 'admin_sensitive_verify'"
        );
        $enabled = $setting && $setting['setting_value'] === '1';
        
        if (!$enabled) {
            return; // 开关关闭，跳过验证
        }
        
        // 从请求头获取 verify_token
        $headers = getallheaders();
        $verifyToken = $headers['X-Verify-Token'] ?? '';
        
        if (empty($verifyToken)) {
            Response::error('此操作需要二次验证，请输入管理员密码', 4010);
        }
        
        // 验证 token
        $decoded = base64_decode($verifyToken);
        if (!$decoded) {
            Response::error('验证令牌无效', 4011);
        }
        
        $parts = explode('.', $decoded, 2);
        if (count($parts) !== 2) {
            Response::error('验证令牌无效', 4011);
        }
        
        list($tokenJson, $signature) = $parts;
        $expectedSig = hash_hmac('sha256', $tokenJson, getenv('MARUAUDIO_JWT_SECRET') ?: 'MaruAudio_JWT_Secret_2026_Secure_Key');
        
        if (!hash_equals($expectedSig, $signature)) {
            Response::error('验证令牌无效', 4011);
        }
        
        $tokenData = json_decode($tokenJson, true);
        if (!$tokenData || ($tokenData['purpose'] ?? '') !== 'sensitive_verify') {
            Response::error('验证令牌无效', 4011);
        }
        
        if (time() > ($tokenData['exp'] ?? 0)) {
            Response::error('验证已过期，请重新验证', 4012);
        }
        
        if (($tokenData['admin_id'] ?? 0) !== ($payload['admin_id'] ?? -1)) {
            Response::error('验证令牌与当前用户不匹配', 4011);
        }
    }
    
    /**
     * 记录操作日志
     */
    private static function logOperation($action, $targetType = null, $targetId = null, $details = null) {
        try {
            $db = Database::getInstance();
            $adminData = JWTAuth::getPayloadFromRequest();
            
            if (!$adminData) {
                return; // 无法获取管理员信息，跳过日志记录
            }
            
            $db->insert('admin_operation_logs', [
                'admin_id' => $adminData['admin_id'] ?? 0,
                'admin_username' => $adminData['username'] ?? 'unknown',
                'action' => $action,
                'target_type' => $targetType,
                'target_id' => $targetId,
                'details' => $details ? json_encode($details, JSON_UNESCAPED_UNICODE) : null,
                'ip' => $_SERVER['REMOTE_ADDR'] ?? ''
            ]);
        } catch (Exception $e) {
            // 日志记录失败不影响主流程
            error_log('操作日志记录失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 获取操作日志
     */
    public static function getOperationLogs($input) {
        self::checkAdminAuth();
        
        $db = Database::getInstance();
        
        $page = max(1, (int)($input['page'] ?? 1));
        $pageSize = min(100, max(1, (int)($input['page_size'] ?? 20)));
        $offset = ($page - 1) * $pageSize;
        
        $total = $db->fetch("SELECT COUNT(*) as count FROM admin_operation_logs")['count'] ?? 0;
        
        $logs = $db->fetchAll(
            "SELECT * FROM admin_operation_logs ORDER BY created_at DESC LIMIT ?, ?",
            [$offset, $pageSize]
        );
        
        Response::success([
            'list' => $logs,
            'total' => (int)$total,
            'page' => $page,
            'page_size' => $pageSize
        ]);
    }
    
    /**
     * 获取统计数据
     */
    public static function getStats() {
        self::checkAdminAuth();
        
        $db = Database::getInstance();
        
        // 总用户数
        $totalUsers = 0;
        $vipUsers = 0;
        $unusedCards = 0;
        $todayLogins = 0;
        $todayNewUsers = 0;
        $totalCommission = 0;
        $pendingWithdrawals = ['count' => 0, 'total' => 0];
        $monthlyUsedCards = 0;
        
        try {
            $result = $db->fetch("SELECT COUNT(*) as count FROM users");
            $totalUsers = $result['count'] ?? 0;
        } catch (Exception $e) {}
        
        try {
            $result = $db->fetch("SELECT COUNT(*) as count FROM users WHERE user_group != 'free'");
            $vipUsers = $result['count'] ?? 0;
        } catch (Exception $e) {}
        
        try {
            $result = $db->fetch("SELECT COUNT(*) as count FROM card_keys WHERE status = 'unused'");
            $unusedCards = $result['count'] ?? 0;
        } catch (Exception $e) {}
        
        try {
            $result = $db->fetch("SELECT COUNT(DISTINCT user_id) as count FROM user_login_logs WHERE DATE(created_at) = CURDATE() AND login_result = 'success'");
            $todayLogins = $result['count'] ?? 0;
        } catch (Exception $e) {}
        
        try {
            $result = $db->fetch("SELECT COUNT(*) as count FROM users WHERE DATE(register_time) = CURDATE()");
            $todayNewUsers = $result['count'] ?? 0;
        } catch (Exception $e) {}
        
        try {
            $result = $db->fetch("SELECT COALESCE(SUM(amount), 0) as total FROM commissions");
            $totalCommission = $result['total'] ?? 0;
        } catch (Exception $e) {}
        
        try {
            $pendingWithdrawals = $db->fetch("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE status = 'pending'") ?? ['count' => 0, 'total' => 0];
        } catch (Exception $e) {}
        
        try {
            $result = $db->fetch("SELECT COUNT(*) as count FROM card_keys WHERE status = 'used' AND DATE_FORMAT(used_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')");
            $monthlyUsedCards = $result['count'] ?? 0;
        } catch (Exception $e) {}
        
        // 获取卡密价格设置
        $cardPrices = ['monthly' => 0, 'yearly' => 0, 'permanent' => 0];
        try {
            $priceSettings = $db->fetchAll(
                "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('card_price_monthly', 'card_price_yearly', 'card_price_permanent')"
            );
            foreach ($priceSettings as $row) {
                $key = str_replace('card_price_', '', $row['setting_key']);
                $cardPrices[$key] = (float)$row['setting_value'];
            }
        } catch (Exception $e) {}
        
        // 今日销售额
        $todaySales = 0;
        try {
            $todayCards = $db->fetchAll(
                "SELECT card_type, COUNT(*) as count FROM card_keys WHERE status = 'used' AND DATE(used_at) = CURDATE() GROUP BY card_type"
            );
            foreach ($todayCards as $row) {
                $todaySales += ($cardPrices[$row['card_type']] ?? 0) * $row['count'];
            }
        } catch (Exception $e) {}
        
        // 本月销售额
        $monthSales = 0;
        try {
            $monthCards = $db->fetchAll(
                "SELECT card_type, COUNT(*) as count FROM card_keys WHERE status = 'used' AND DATE_FORMAT(used_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m') GROUP BY card_type"
            );
            foreach ($monthCards as $row) {
                $monthSales += ($cardPrices[$row['card_type']] ?? 0) * $row['count'];
            }
        } catch (Exception $e) {}
        
        // 累计销售额
        $totalSales = 0;
        try {
            $allCards = $db->fetchAll(
                "SELECT card_type, COUNT(*) as count FROM card_keys WHERE status = 'used' GROUP BY card_type"
            );
            foreach ($allCards as $row) {
                $totalSales += ($cardPrices[$row['card_type']] ?? 0) * $row['count'];
            }
        } catch (Exception $e) {}
        
        Response::success([
            'totalUsers' => (int)$totalUsers,
            'vipUsers' => (int)$vipUsers,
            'unusedCards' => (int)$unusedCards,
            'todayLogins' => (int)$todayLogins,
            'todayNewUsers' => (int)$todayNewUsers,
            'totalCommission' => (float)$totalCommission,
            'pendingWithdrawals' => (int)($pendingWithdrawals['count'] ?? 0),
            'pendingWithdrawalsAmount' => (float)($pendingWithdrawals['total'] ?? 0),
            'monthlyUsedCards' => (int)$monthlyUsedCards,
            'todaySales' => (float)$todaySales,
            'monthSales' => (float)$monthSales,
            'totalSales' => (float)$totalSales
        ]);
    }
    
    /**
     * 获取用户列表
     */
    public static function getUsers($input) {
        self::checkAdminAuth();
        
        $db = Database::getInstance();
        
        $page = max(1, (int)($input['page'] ?? 1));
        $pageSize = min(100, max(1, (int)($input['page_size'] ?? 10)));
        $offset = ($page - 1) * $pageSize;

        // 兼容旧参数，同时支持新的 keyword + search_type 搜索
        $email = trim($input['email'] ?? '');
        $keyword = trim($input['keyword'] ?? '');
        $searchType = $input['search_type'] ?? 'email';
        
        $where = "1=1";
        $params = [];
        
        if (!empty($keyword)) {
            switch ($searchType) {
                case 'machine_code':
                    // 按机器码搜索：存在绑定该机器码的用户
                    $where .= " AND EXISTS (
                        SELECT 1 FROM machine_bindings mb 
                        WHERE mb.user_id = u.id AND mb.machine_code LIKE ?
                    )";
                    $params[] = '%' . $keyword . '%';
                    break;
                case 'card_key':
                    // 按卡密搜索：该卡密已被用户使用
                    $where .= " AND EXISTS (
                        SELECT 1 FROM card_keys ck 
                        WHERE ck.used_by = u.id AND ck.card_key LIKE ?
                    )";
                    $params[] = '%' . $keyword . '%';
                    break;
                case 'email':
                default:
                    $where .= " AND u.email LIKE ?";
                    $params[] = '%' . $keyword . '%';
                    break;
            }
        } elseif (!empty($email)) {
            // 兼容老版仅按邮箱搜索
            $where .= " AND u.email LIKE ?";
            $params[] = "%{$email}%";
        }
        
        // 获取总数
        $total = $db->fetch("SELECT COUNT(*) as count FROM users u WHERE {$where}", $params)['count'];
        
        // 获取列表（包含邀请人数和佣金）
        $userParams = array_merge($params, [$offset, $pageSize]);
        $users = $db->fetchAll(
            "SELECT u.id, u.email, u.avatar, u.user_group, u.expire_time, u.register_time, u.register_ip, 
                    u.last_login_time, u.last_login_ip, u.status, u.invite_code, u.invited_by,
                    (SELECT COUNT(*) FROM users WHERE invited_by = u.id) as invite_count,
                    (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE user_id = u.id AND status = 'available') as commission_balance
             FROM users u WHERE {$where} ORDER BY u.id DESC LIMIT ?, ?",
            $userParams
        );
        
        // 获取每个用户的机器码，并检查试用会员是否过期
        foreach ($users as &$user) {
            $binding = $db->fetch(
                "SELECT machine_code FROM machine_bindings WHERE user_id = ? ORDER BY bind_time DESC LIMIT 1",
                [$user['id']]
            );
            $user['machine_code'] = $binding ? $binding['machine_code'] : null;
            
            // 检查试用会员是否已过期，如果过期则自动降级为免费用户
            if ($user['user_group'] === 'trial' && !empty($user['expire_time'])) {
                if (strtotime($user['expire_time']) < time()) {
                    // 试用已过期，降级为免费用户
                    $db->update('users', [
                        'user_group' => 'free',
                        'expire_time' => null
                    ], 'id = ?', [$user['id']]);
                    
                    // 更新返回数据
                    $user['user_group'] = 'free';
                    $user['expire_time'] = null;
                }
            }
            
            // 判断是否是试用会员（user_group = 'trial'）
            $user['is_trial'] = ($user['user_group'] === 'trial');
        }
        
        Response::success([
            'list' => $users,
            'total' => (int)$total,
            'page' => $page,
            'page_size' => $pageSize
        ]);
    }
    
    /**
     * 管理员重置用户密码
     */
    public static function resetUserPassword($input) {
        $payload = self::checkAdminAuth();
        self::checkSensitiveAuth($payload);
        
        $userId = (int)($input['user_id'] ?? 0);
        $newPassword = trim($input['new_password'] ?? '');
        
        if ($userId <= 0) {
            Response::error('用户ID无效', 1001);
        }
        
        if (strlen($newPassword) < 6) {
            Response::error('密码长度至少6位', 1001);
        }
        
        $db = Database::getInstance();
        
        $user = $db->fetch("SELECT id, email FROM users WHERE id = ?", [$userId]);
        if (!$user) {
            Response::error('用户不存在', 3001);
        }
        
        $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT);
        $db->update('users', [
            'password_hash' => $passwordHash,
            'password_changed_at' => date('Y-m-d H:i:s')
        ], 'id = ?', [$userId]);
        
        self::logOperation('重置用户密码', 'user', $userId, [
            'email' => $user['email']
        ]);
        
        Response::success(null, '密码已重置');
    }
    
    /**
     * 获取用户邀请记录
     */
    public static function getUserInvites($input) {
        self::checkAdminAuth();
        
        $userId = (int)($input['user_id'] ?? 0);
        if ($userId <= 0) {
            Response::error('用户ID无效', 1001);
        }
        
        $db = Database::getInstance();
        
        $invites = $db->fetchAll(
            "SELECT id, email, user_group, register_time FROM users WHERE invited_by = ? ORDER BY register_time DESC LIMIT 50",
            [$userId]
        );
        
        Response::success(['list' => $invites]);
    }
    
    /**
     * 获取用户佣金记录
     */
    public static function getUserCommissions($input) {
        self::checkAdminAuth();
        
        $userId = (int)($input['user_id'] ?? 0);
        if ($userId <= 0) {
            Response::error('用户ID无效', 1001);
        }
        
        $db = Database::getInstance();
        
        $commissions = $db->fetchAll(
            "SELECT c.*, u.email as from_email 
             FROM commissions c 
             LEFT JOIN users u ON c.from_user_id = u.id 
             WHERE c.user_id = ? 
             ORDER BY c.created_at DESC LIMIT 50",
            [$userId]
        );
        
        $total = $db->fetch(
            "SELECT COALESCE(SUM(amount), 0) as total FROM commissions WHERE user_id = ?",
            [$userId]
        )['total'];
        
        $available = $db->fetch(
            "SELECT COALESCE(SUM(amount), 0) as total FROM commissions WHERE user_id = ? AND status = 'available'",
            [$userId]
        )['total'];
        
        Response::success([
            'list' => $commissions,
            'total' => (float)$total,
            'available' => (float)$available
        ]);
    }
    
    /**
     * 更新用户
     */
    public static function updateUser($input) {
        self::checkAdminAuth();
        
        $userId = (int)($input['user_id'] ?? 0);
        if ($userId <= 0) {
            Response::error('用户ID无效', 1001);
        }
        
        $db = Database::getInstance();
        
        // 获取当前用户信息
        $currentUser = $db->fetch("SELECT * FROM users WHERE id = ?", [$userId]);
        if (!$currentUser) {
            Response::error('用户不存在', 3001);
        }
        
        $updateData = [];
        
        // 处理用户组变更
        if (isset($input['user_group'])) {
            $newUserGroup = $input['user_group'];
            $oldUserGroup = $currentUser['user_group'];
            $updateData['user_group'] = $newUserGroup;
            
            // 如果设置为免费用户，强制清除到期时间
            if ($newUserGroup === 'free') {
                $updateData['expire_time'] = null;
                
                // 同时解除关联的卡密（将卡密状态改为 disabled，保留记录）
                $db->query(
                    "UPDATE card_keys SET status = 'disabled' WHERE used_by = ? AND status = 'used'",
                    [$userId]
                );
            }
            // 如果设置为试用会员，且没有传入到期时间，自动使用系统设置的试用时长
            elseif ($newUserGroup === 'trial' && !isset($input['expire_time'])) {
                $trialDays = $db->fetch("SELECT setting_value FROM system_settings WHERE setting_key = 'trial_duration_days'");
                $durationDays = $trialDays ? (int)$trialDays['setting_value'] : 3;
                $updateData['expire_time'] = date('Y-m-d H:i:s', time() + $durationDays * 86400);
            }
            // 如果从免费用户升级为付费会员，且没有传入到期时间，自动设置默认到期时间
            elseif ($oldUserGroup === 'free' && in_array($newUserGroup, ['monthly', 'yearly']) && !isset($input['expire_time'])) {
                // 根据会员类型设置默认时长
                $durationDays = $newUserGroup === 'monthly' ? 30 : 365;
                $updateData['expire_time'] = date('Y-m-d H:i:s', time() + $durationDays * 86400);
            }
            // 永久会员清空到期时间
            elseif ($newUserGroup === 'permanent') {
                $updateData['expire_time'] = null;
            }
        }
        
        // 处理到期时间（仅当不是免费用户时）
        if (isset($input['expire_time']) && (!isset($updateData['user_group']) || $updateData['user_group'] !== 'free')) {
            $expireTime = $input['expire_time'];
            
            // 处理空值或 null 或 "永久"
            if (empty($expireTime) || $expireTime === 'null' || $expireTime === null || $expireTime === '永久') {
                $updateData['expire_time'] = null;
            } else {
                // 转换各种日期格式为 MySQL 格式
                $updateData['expire_time'] = self::parseDateTime($expireTime);
            }
        }
        
        if (isset($input['status'])) {
            $allowedStatuses = ['active', 'banned'];
            if (!in_array($input['status'], $allowedStatuses, true)) {
                Response::error('无效的用户状态', 1001);
            }
            $updateData['status'] = $input['status'];
        }
        
        if (empty($updateData)) {
            Response::error('没有要更新的数据', 1001);
        }
        
        $db->update('users', $updateData, 'id = ?', [$userId]);
        
        // 记录操作日志
        self::logOperation('更新用户', 'user', $userId, $updateData);
        
        // 触发 WebSocket 推送通知（确保客户端实时同步）
        self::notifyUserUpdated($userId);
        
        Response::success(null, '更新成功');
    }
    
    /**
     * CSV 字段安全转义（防止 CSV 注入）
     */
    private static function csvEscape($value) {
        $value = (string)$value;
        // 防止 CSV 注入：以 =, +, -, @ 开头的值前加单引号
        if (preg_match('/^[=+\-@\t\r]/', $value)) {
            $value = "'" . $value;
        }
        // 包含逗号、引号、换行的字段用双引号包裹
        if (preg_match('/[,"\n\r]/', $value)) {
            $value = '"' . str_replace('"', '""', $value) . '"';
        }
        return $value;
    }
    
    /**
     * 导出用户数据
     */
    public static function exportUsers($input) {
        self::checkAdminAuth();
        
        $db = Database::getInstance();
        
        $users = $db->fetchAll(
            "SELECT id, email, user_group, expire_time, register_time, register_ip, last_login_time, status, invite_code, invited_by FROM users ORDER BY id DESC"
        );
        
        // 生成 CSV
        $csv = "ID,邮箱,用户组,到期时间,注册时间,注册IP,最后登录,状态,邀请码,邀请人ID\n";
        foreach ($users as $user) {
            $csv .= implode(',', array_map([self::class, 'csvEscape'], [
                $user['id'],
                $user['email'],
                $user['user_group'],
                $user['expire_time'] ?? '',
                $user['register_time'],
                $user['register_ip'] ?? '',
                $user['last_login_time'] ?? '',
                $user['status'],
                $user['invite_code'] ?? '',
                $user['invited_by'] ?? ''
            ])) . "\n";
        }
        
        Response::success(['csv' => $csv, 'filename' => 'users_' . date('Ymd_His') . '.csv']);
    }
    
    /**
     * 导出卡密数据
     */
    public static function exportCards($input) {
        self::checkAdminAuth();
        
        $db = Database::getInstance();
        
        $cards = $db->fetchAll(
            "SELECT id, card_key, card_type, status, created_at, used_at, used_by FROM card_keys ORDER BY id DESC"
        );
        
        // 生成 CSV
        $csv = "ID,卡密,类型,状态,创建时间,使用时间,使用者ID\n";
        foreach ($cards as $card) {
            $csv .= implode(',', array_map([self::class, 'csvEscape'], [
                $card['id'],
                $card['card_key'],
                $card['card_type'],
                $card['status'],
                $card['created_at'],
                $card['used_at'] ?? '',
                $card['used_by'] ?? ''
            ])) . "\n";
        }
        
        Response::success(['csv' => $csv, 'filename' => 'cards_' . date('Ymd_His') . '.csv']);
    }
    
    /**
     * 获取公告列表
     */
    public static function getAnnouncements($input) {
        self::checkAdminAuth();
        
        $db = Database::getInstance();
        
        $announcements = $db->fetchAll(
            "SELECT * FROM announcements ORDER BY priority DESC, created_at DESC LIMIT 50"
        );
        
        Response::success(['list' => $announcements]);
    }
    
    /**
     * 创建/更新公告
     */
    public static function saveAnnouncement($input) {
        self::checkAdminAuth();
        
        $db = Database::getInstance();
        $adminData = JWTAuth::getPayloadFromRequest();
        
        $id = (int)($input['id'] ?? 0);
        $title = trim($input['title'] ?? '');
        $content = trim($input['content'] ?? '');
        $type = $input['type'] ?? 'info';
        $priority = (int)($input['priority'] ?? 0);
        $isActive = isset($input['is_active']) ? ($input['is_active'] ? 1 : 0) : 1;
        $startTime = $input['start_time'] ?? null;
        $endTime = $input['end_time'] ?? null;
        
        // 转换 ISO 日期格式为 MySQL 格式
        if ($startTime) {
            $startTime = date('Y-m-d H:i:s', strtotime($startTime));
        }
        if ($endTime) {
            $endTime = date('Y-m-d H:i:s', strtotime($endTime));
        }
        
        if (empty($title) || empty($content)) {
            Response::error('标题和内容不能为空', 1001);
        }
        
        $data = [
            'title' => $title,
            'content' => $content,
            'type' => $type,
            'priority' => $priority,
            'is_active' => $isActive,
            'start_time' => $startTime,
            'end_time' => $endTime
        ];
        
        if ($id > 0) {
            $db->update('announcements', $data, 'id = ?', [$id]);
            self::logOperation('更新公告', 'announcement', $id, ['title' => $title]);
            self::notifyConfigUpdated('announcement');
            Response::success(null, '更新成功');
        } else {
            $data['created_by'] = $adminData['admin_id'] ?? 0;
            $newId = $db->insert('announcements', $data);
            self::logOperation('创建公告', 'announcement', $newId, ['title' => $title]);
            self::notifyConfigUpdated('announcement');
            Response::success(['id' => $newId], '创建成功');
        }
    }
    
    /**
     * 删除公告
     */
    public static function deleteAnnouncement($input) {
        $payload = self::checkAdminAuth();
        self::checkSensitiveAuth($payload);
        
        $id = (int)($input['id'] ?? 0);
        if ($id <= 0) {
            Response::error('公告ID无效', 1001);
        }
        
        $db = Database::getInstance();
        $db->query("DELETE FROM announcements WHERE id = ?", [$id]);
        
        self::logOperation('删除公告', 'announcement', $id);
        self::notifyConfigUpdated('announcement');
        Response::success(null, '删除成功');
    }
    
    /**
     * 切换用户状态
     */
    public static function toggleUserStatus($input) {
        $payload = self::checkAdminAuth();
        self::checkSensitiveAuth($payload);
        
        $userId = (int)($input['user_id'] ?? 0);
        if ($userId <= 0) {
            Response::error('用户ID无效', 1001);
        }
        
        $db = Database::getInstance();
        
        $user = $db->fetch("SELECT status, email FROM users WHERE id = ?", [$userId]);
        if (!$user) {
            Response::error('用户不存在', 2001);
        }
        
        $newStatus = $user['status'] === 'active' ? 'banned' : 'active';
        $db->update('users', ['status' => $newStatus], 'id = ?', [$userId]);
        
        // 记录操作日志
        self::logOperation($newStatus === 'active' ? '解封用户' : '封禁用户', 'user', $userId, ['email' => $user['email'] ?? '']);
        
        // 如果用户被封禁，通知客户端强制登出
        if ($newStatus === 'banned') {
            self::notifyForceLogout($userId, '您的账号已被封禁');
        }
        
        Response::success(['status' => $newStatus], $newStatus === 'active' ? '解封成功' : '封禁成功');
    }
    
    /**
     * 获取用户机器码绑定列表
     */
    public static function getUserMachines($input) {
        self::checkAdminAuth();
        
        $userId = (int)($input['user_id'] ?? 0);
        if ($userId <= 0) {
            Response::error('用户ID无效', 1001);
        }
        
        $db = Database::getInstance();
        $machines = $db->fetchAll(
            "SELECT machine_code, bind_time FROM machine_bindings WHERE user_id = ? ORDER BY bind_time DESC",
            [$userId]
        );
        
        Response::success([
            'list' => $machines
        ]);
    }
    
    /**
     * 解绑用户机器码
     */
    public static function unbindUserMachine($input) {
        self::checkAdminAuth();
        
        $userId = (int)($input['user_id'] ?? 0);
        $machineCode = trim($input['machine_code'] ?? '');
        
        if ($userId <= 0 || $machineCode === '') {
            Response::error('参数无效', 1001);
        }
        
        $db = Database::getInstance();
        
        $binding = $db->fetch(
            "SELECT id FROM machine_bindings WHERE user_id = ? AND machine_code = ?",
            [$userId, $machineCode]
        );
        
        if (!$binding) {
            Response::error('绑定记录不存在', 3001);
        }
        
        $db->query("DELETE FROM machine_bindings WHERE id = ?", [$binding['id']]);
        
        self::logOperation('解绑机器码', 'machine_binding', $userId, [
            'machine_code' => $machineCode
        ]);
        
        Response::success(null, '解绑成功');
    }
    
    /**
     * 为用户绑定机器码
     */
    public static function bindUserMachine($input) {
        self::checkAdminAuth();
        
        $userId = (int)($input['user_id'] ?? 0);
        $machineCode = trim($input['machine_code'] ?? '');
        
        if ($userId <= 0 || $machineCode === '') {
            Response::error('参数无效', 1001);
        }
        
        $db = Database::getInstance();
        
        // 检查机器码是否已绑定到其他用户
        $existing = $db->fetch(
            "SELECT user_id FROM machine_bindings WHERE machine_code = ? LIMIT 1",
            [$machineCode]
        );
        
        if ($existing && (int)$existing['user_id'] !== $userId) {
            Response::error('该机器码已绑定到其他用户', 3002);
        }
        
        // 如果已经绑定到当前用户，则直接返回成功
        if ($existing && (int)$existing['user_id'] === $userId) {
            Response::success(null, '绑定成功');
        }
        
        $db->insert('machine_bindings', [
            'user_id' => $userId,
            'machine_code' => $machineCode
        ]);
        
        self::logOperation('绑定机器码', 'machine_binding', $userId, [
            'machine_code' => $machineCode
        ]);
        
        Response::success(null, '绑定成功');
    }
    
    /**
     * 验证机器码归属
     */
    public static function verifyUserMachine($input) {
        self::checkAdminAuth();
        
        $userId = (int)($input['user_id'] ?? 0);
        $machineCode = trim($input['machine_code'] ?? '');
        
        if ($userId <= 0 || $machineCode === '') {
            Response::error('参数无效', 1001);
        }
        
        $db = Database::getInstance();
        
        $binding = $db->fetch(
            "SELECT mb.user_id, u.email FROM machine_bindings mb LEFT JOIN users u ON mb.user_id = u.id WHERE mb.machine_code = ? LIMIT 1",
            [$machineCode]
        );
        
        if (!$binding) {
            Response::success([
                'status' => 'none'
            ]);
        } elseif ((int)$binding['user_id'] === $userId) {
            Response::success([
                'status' => 'self'
            ]);
        } else {
            Response::success([
                'status' => 'other',
                'user_email' => $binding['email'] ?? ''
            ]);
        }
    }
    
    /**
     * 通知用户强制登出
     */
    private static function notifyForceLogout($userId, $reason = '') {
        try {
            require_once __DIR__ . '/../../websocket/src/PushService.php';
            $pushService = new \MaruAudio\WebSocket\PushService();
            
            $pushService->pushToUser($userId, 'force_logout', [
                'reason' => $reason,
                'timestamp' => time()
            ]);
        } catch (\Exception $e) {
            error_log("强制登出推送失败: " . $e->getMessage());
        }
    }
    
    /**
     * 获取用户登录日志
     */
    public static function getUserLogs($input) {
        self::checkAdminAuth();
        
        $userId = (int)($input['user_id'] ?? 0);
        if ($userId <= 0) {
            Response::error('用户ID无效', 1001);
        }
        
        $db = Database::getInstance();
        
        $logs = $db->fetchAll(
            "SELECT created_at as login_time, login_ip, machine_code, device_name, os_version, client_version, login_result, fail_reason 
             FROM user_login_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
            [$userId]
        );
        
        Response::success($logs);
    }
    
    /**
     * 获取卡密列表
     */
    public static function getCards($input) {
        self::checkAdminAuth();
        
        $db = Database::getInstance();
        
        $page = max(1, (int)($input['page'] ?? 1));
        $pageSize = min(100, max(1, (int)($input['page_size'] ?? 10)));
        $offset = ($page - 1) * $pageSize;
        $status = $input['status'] ?? '';
        $cardType = $input['card_type'] ?? '';
        $productCode = $input['product_code'] ?? '';
        
        $where = "1=1";
        $params = [];
        
        if (!empty($status)) {
            $where .= " AND c.status = ?";
            $params[] = $status;
        }
        if (!empty($cardType)) {
            $where .= " AND c.card_type = ?";
            $params[] = $cardType;
        }
        if (!empty($productCode)) {
            $where .= " AND c.product_code = ?";
            $params[] = $productCode;
        }
        
        $total = $db->fetch("SELECT COUNT(*) as count FROM card_keys c WHERE {$where}", $params)['count'];
        
        $cardParams = array_merge($params, [$offset, $pageSize]);
        $cards = $db->fetchAll(
            "SELECT c.id, c.card_key, c.card_type, c.duration_days, c.status, c.created_at, c.used_at, c.used_by, c.product_code, c.remark,
                    u.email as used_by_email
             FROM card_keys c
             LEFT JOIN users u ON c.used_by = u.id
             WHERE {$where} ORDER BY c.id DESC LIMIT ?, ?",
            $cardParams
        );
        
        // 获取激活用户的机器码
        foreach ($cards as &$card) {
            if ($card['used_by']) {
                $binding = $db->fetch(
                    "SELECT machine_code FROM machine_bindings WHERE user_id = ? ORDER BY bind_time DESC LIMIT 1",
                    [$card['used_by']]
                );
                $card['machine_code'] = $binding ? $binding['machine_code'] : null;
            } else {
                $card['machine_code'] = null;
            }
        }
        
        Response::success([
            'list' => $cards,
            'total' => (int)$total,
            'page' => $page,
            'page_size' => $pageSize
        ]);
    }
    
    /**
     * 生成卡密
     */
    public static function generateCards($input) {
        $payload = self::checkAdminAuth();
        self::checkSensitiveAuth($payload);
        
        $productCode = $input['product_code'] ?? 'dubbing';
        $cardType = $input['card_type'] ?? 'monthly';
        $count = min(100, max(1, (int)($input['count'] ?? 1)));
        $durationDays = (int)($input['duration_days'] ?? 30);
        $remark = $input['remark'] ?? '';
        
        // 根据类型设置天数
        switch ($cardType) {
            case 'monthly':
                $durationDays = 30;
                break;
            case 'yearly':
                $durationDays = 365;
                break;
            case 'permanent':
                $durationDays = 0;
                break;
        }
        
        $db = Database::getInstance();
        $batchId = date('YmdHis') . substr(uniqid(), -4);
        $cards = [];
        
        // 根据产品生成不同前缀
        $prefix = strtoupper(substr($productCode, 0, 4));
        
        for ($i = 0; $i < $count; $i++) {
            // 生成卡密格式: DUBB-XXXX-XXXX-XXXX 或 COMI-XXXX-XXXX-XXXX
            $cardKey = $prefix . '-' . 
                       strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 4)) . '-' .
                       strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 4)) . '-' .
                       strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 4));
            
            $db->insert('card_keys', [
                'card_key' => $cardKey,
                'card_type' => $cardType,
                'duration_days' => $durationDays,
                'status' => 'unused',
                'created_by' => $payload['admin_id'],
                'batch_id' => $batchId,
                'product_code' => $productCode,
                'remark' => $remark
            ]);
            
            $cards[] = $cardKey;
        }
        
        // 记录操作日志
        self::logOperation('生成卡密', 'card', null, [
            'count' => $count,
            'card_type' => $cardType,
            'product_code' => $productCode,
            'batch_id' => $batchId
        ]);
        
        Response::success([
            'cards' => $cards,
            'batch_id' => $batchId,
            'count' => $count,
            'product_code' => $productCode
        ], '生成成功');
    }
    
    /**
     * 禁用卡密
     */
    public static function disableCard($input) {
        self::checkAdminAuth();
        
        $cardId = (int)($input['card_id'] ?? 0);
        if ($cardId <= 0) {
            Response::error('卡密ID无效', 1001);
        }
        
        $db = Database::getInstance();
        
        $card = $db->fetch("SELECT status FROM card_keys WHERE id = ?", [$cardId]);
        if (!$card) {
            Response::error('卡密不存在', 3001);
        }
        
        if ($card['status'] !== 'unused') {
            Response::error('只能禁用未使用的卡密', 3002);
        }
        
        $db->update('card_keys', ['status' => 'disabled'], 'id = ?', [$cardId]);
        
        // 记录操作日志
        self::logOperation('禁用卡密', 'card', $cardId);
        
        Response::success(null, '禁用成功');
    }
    
    /**
     * 删除卡密
     */
    public static function deleteCard($input) {
        $payload = self::checkAdminAuth();
        self::checkSensitiveAuth($payload);
        
        $cardId = (int)($input['card_id'] ?? 0);
        if ($cardId <= 0) {
            Response::error('卡密ID无效', 1001);
        }
        
        $db = Database::getInstance();
        
        $card = $db->fetch("SELECT id, status, used_by FROM card_keys WHERE id = ?", [$cardId]);
        if (!$card) {
            Response::error('卡密不存在', 3001);
        }
        
        // 禁止删除已激活的卡密（卡密-机器码-用户是一体的）
        if ($card['status'] === 'used') {
            Response::error('已激活的卡密无法删除，请先将关联用户设为免费会员', 3003);
        }
        
        $db->query("DELETE FROM card_keys WHERE id = ?", [$cardId]);
        
        // 记录操作日志
        self::logOperation('删除卡密', 'card', $cardId);
        
        Response::success(null, '删除成功');
    }
    
    /**
     * 获取系统设置
     */
    public static function getSettings() {
        self::checkAdminAuth();
        
        $db = Database::getInstance();
        
        $settings = $db->fetchAll("SELECT setting_key, setting_value FROM system_settings");
        
        // 对敏感配置进行脱敏处理，避免在前端直接暴露完整密钥/密码
        $sensitiveKeys = [
            'smtp_pass',
            'dashscope_api_key'
        ];
        
        $result = [];
        foreach ($settings as $setting) {
            $key = $setting['setting_key'];
            $value = $setting['setting_value'];
            
            if (in_array($key, $sensitiveKeys, true)) {
                // 返回是否已配置的标记，前端据此显示状态；不回传真实值
                $result[$key] = !empty($value) ? '__MASKED__' : '';
            } else {
                $result[$key] = $value;
            }
        }
        
        Response::success($result);
    }
    
    /**
     * 更新系统设置
     */
    public static function updateSettings($input) {
        self::checkAdminAuth();
        
        $db = Database::getInstance();
        
        $allowedKeys = [
            'registration_enabled', 'machine_code_limit', 'machine_change_cooldown', 
            'login_fail_limit', 'login_lock_duration',
            'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'from_name',
            'current_version', 'force_update', 'update_changelog', 'update_download_url',
            'trial_enabled', 'trial_duration_days',
            'invite_enabled', 'invite_rules',
            'commission_enabled', 'commission_threshold', 'commission_min_level', 
            'commission_rate', 'commission_min_withdraw',
            'user_agreement', 'privacy_policy', 'support_qrcode_url',
            'group_join_url', 'tutorial_url', 'donate_url',
            'card_price_monthly', 'card_price_yearly', 'card_price_permanent',
            'comic_card_price_monthly', 'comic_card_price_yearly', 'comic_card_price_permanent',
            'purchase_url', 'purchase_qrcode_url',
            'dashscope_api_key',
            'admin_sensitive_verify',
            'disclaimer'
        ];
        
        // 敏感字段：如果前端传回的是掩码标记，说明用户未修改，跳过保存
        $sensitiveKeys = ['smtp_pass', 'dashscope_api_key'];
        
        $updatedKeys = [];
        foreach ($input as $key => $value) {
            if (in_array($key, $allowedKeys)) {
                // 跳过未修改的敏感字段（前端回传掩码标记）
                if (in_array($key, $sensitiveKeys) && ($value === '__MASKED__' || $value === '******')) {
                    continue;
                }
                $db->query(
                    "INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
                    [$key, $value, $value]
                );
                $updatedKeys[] = $key;
            }
        }
        
        // 记录操作日志
        if (!empty($updatedKeys)) {
            self::logOperation('更新系统设置', 'setting', null, ['keys' => implode(', ', $updatedKeys)]);
            self::notifyConfigUpdated('settings');
        }
        
        Response::success(null, '保存成功');
    }
    
    /**
     * 更新管理员信息
     */
    public static function updateAdmin($input) {
        $payload = self::checkAdminAuth();
        
        $db = Database::getInstance();
        
        $updateData = [];
        
        if (!empty($input['email'])) {
            $updateData['email'] = $input['email'];
        }
        
        if (!empty($input['new_password'])) {
            // 修改密码必须验证旧密码
            $oldPassword = $input['old_password'] ?? '';
            if (empty($oldPassword)) {
                Response::error('请输入当前密码', 1001);
            }
            $admin = $db->fetch("SELECT password_hash FROM admins WHERE id = ?", [$payload['admin_id']]);
            if (!$admin || !password_verify($oldPassword, $admin['password_hash'])) {
                Response::error('当前密码错误', 2002);
            }
            $updateData['password_hash'] = password_hash($input['new_password'], PASSWORD_BCRYPT);
        }
        
        if (empty($updateData)) {
            Response::error('没有要更新的数据', 1001);
        }
        
        $db->update('admins', $updateData, 'id = ?', [$payload['admin_id']]);
        
        // 记录操作日志
        self::logOperation('更新管理员信息', 'admin', $payload['admin_id']);
        
        Response::success(null, '更新成功');
    }
    
    /**
     * 测试邮件发送
     */
    public static function testMail($input) {
        self::checkAdminAuth();
        
        $to = $input['to'] ?? '';
        
        if (empty($to) || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
            Response::error('请提供有效的收件邮箱', 1001);
        }
        
        require_once __DIR__ . '/../lib/Mailer.php';
        
        // 发送测试邮件
        $subject = '【丸子配音】邮件配置测试';
        $body = '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: "Microsoft YaHei", Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .logo { text-align: center; margin-bottom: 20px; font-size: 24px; color: #3B82F6; font-weight: bold; }
        .title { text-align: center; font-size: 18px; color: #333; margin-bottom: 20px; }
        .content { color: #666; font-size: 14px; line-height: 1.8; text-align: center; }
        .success { color: #52c41a; font-size: 48px; margin: 20px 0; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🎙️ 丸子配音</div>
        <div class="title">邮件配置测试</div>
        <div class="success">✓</div>
        <div class="content">
            <p>恭喜！您的邮件配置正确。</p>
            <p>此邮件由丸子配音管理后台发送。</p>
        </div>
        <div class="footer">
            © 2025 丸子配音 - 智能 AI 配音工具
        </div>
    </div>
</body>
</html>';
        $result = Mailer::send($to, $subject, $body);

        if ($result) {
            Response::success(null, '测试邮件发送成功');
        } else {
            Response::error('邮件发送失败，请检查SMTP配置', 5002);
        }
    }

    /**
     * 获取提现申请列表
     */
    public static function getWithdrawals($input) {
        self::checkAdminAuth();

        $db = Database::getInstance();
        $page = max(1, (int)($input['page'] ?? 1));
        $pageSize = min(50, max(10, (int)($input['page_size'] ?? 10)));
        $offset = ($page - 1) * $pageSize;
        $status = $input['status'] ?? '';

        $where = "1=1";
        $params = [];

        if ($status) {
            $where .= " AND w.status = ?";
            $params[] = $status;
        }

        $sql = "SELECT w.*, u.email as user_email,
                (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE user_id = w.user_id) as total_commission
                FROM withdrawals w
                LEFT JOIN users u ON w.user_id = u.id
                WHERE {$where}
                ORDER BY w.created_at DESC
                LIMIT ? OFFSET ?";

        $params[] = $pageSize;
        $params[] = $offset;

        $withdrawals = $db->fetchAll($sql, $params);

        // 获取统计
        $pendingStats = $db->fetch("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE status = 'pending'");
        $completedStats = $db->fetch("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE status = 'completed'");

        $countSql = "SELECT COUNT(*) as total FROM withdrawals w WHERE {$where}";
        $countParams = array_slice($params, 0, -2);
        $total = $db->fetch($countSql, $countParams)['total'];

        Response::success([
            'list' => $withdrawals,
            'total' => (int)$total,
            'page' => $page,
            'page_size' => $pageSize,
            'stats' => [
                'pending_count' => (int)$pendingStats['count'],
                'pending_amount' => (float)$pendingStats['total'],
                'completed_count' => (int)$completedStats['count'],
                'total_paid' => (float)$completedStats['total']
            ]
        ]);
    }

    /**
     * 处理提现申请
     */
    public static function processWithdrawal($input) {
        self::checkAdminAuth();

        $withdrawalId = (int)($input['id'] ?? 0);
        $action = $input['action'] ?? '';
        $reason = $input['reason'] ?? '';

        if ($withdrawalId <= 0) {
            Response::error('提现申请ID无效', 1001);
        }

        if (!in_array($action, ['approve', 'reject'])) {
            Response::error('操作类型无效', 1001);
        }

        $db = Database::getInstance();

        $withdrawal = $db->fetch("SELECT * FROM withdrawals WHERE id = ?", [$withdrawalId]);
        if (!$withdrawal) {
            Response::error('提现申请不存在', 3001);
        }

        if ($withdrawal['status'] !== 'pending') {
            Response::error('该申请已处理', 3002);
        }

        if ($action === 'approve') {
            // 开始事务
            $pdo = $db->getConnection();
            $pdo->beginTransaction();
            
            try {
                $db->update('withdrawals', [
                    'status' => 'completed',
                    'processed_at' => date('Y-m-d H:i:s')
                ], 'id = ?', [$withdrawalId]);
                
                // 将冻结的佣金状态改为已提现
                $db->query(
                    "UPDATE commissions SET status = 'withdrawn' WHERE withdrawal_id = ? AND status = 'frozen'",
                    [$withdrawalId]
                );
                
                $pdo->commit();
                
                // 记录操作日志
                self::logOperation('审批提现', 'withdrawal', $withdrawalId, ['action' => 'approve', 'amount' => $withdrawal['amount']]);
                
                // 通知用户提现已完成
                self::notifyWithdrawalProcessed($withdrawal['user_id'], 'approved', $withdrawal['amount']);
                
                Response::success(null, '已完成打款');
            } catch (Exception $e) {
                $pdo->rollBack();
                Response::error('处理失败，请重试', 5001);
            }
        } else {
            if (empty($reason)) {
                Response::error('请填写拒绝原因', 1001);
            }
            
            // 开始事务
            $pdo = $db->getConnection();
            $pdo->beginTransaction();
            
            try {
                $db->update('withdrawals', [
                    'status' => 'rejected',
                    'reject_reason' => $reason,
                    'processed_at' => date('Y-m-d H:i:s')
                ], 'id = ?', [$withdrawalId]);
                
                // 返还冻结的佣金（状态改回 available）
                $db->query(
                    "UPDATE commissions SET status = 'available', withdrawal_id = NULL WHERE withdrawal_id = ? AND status = 'frozen'",
                    [$withdrawalId]
                );
                
                $pdo->commit();
                
                // 记录操作日志
                self::logOperation('拒绝提现', 'withdrawal', $withdrawalId, ['action' => 'reject', 'reason' => $reason]);
                
                // 通知用户提现被拒绝
                self::notifyWithdrawalProcessed($withdrawal['user_id'], 'rejected', $withdrawal['amount'], $reason);
                
                Response::success(null, '已拒绝该申请，佣金已返还');
            } catch (Exception $e) {
                $pdo->rollBack();
                Response::error('处理失败，请重试', 5001);
            }
        }
    }
    
    /**
     * 获取版本历史
     */
    public static function getVersionHistory($input) {
        self::checkAdminAuth();
        
        $db = Database::getInstance();
        $productCode = $input['product_code'] ?? 'dubbing';
        
        $history = $db->fetchAll(
            "SELECT * FROM version_history WHERE product_code = ? ORDER BY created_at DESC LIMIT 20",
            [$productCode]
        );
        
        Response::success(['list' => $history]);
    }
    
    /**
     * 发布新版本
     */
    public static function publishVersion($input) {
        $payload = self::checkAdminAuth();
        
        $version = trim($input['version'] ?? '');
        $forceUpdate = isset($input['force_update']) ? ($input['force_update'] ? 1 : 0) : 0;
        $changelog = trim($input['changelog'] ?? '');
        $downloadUrl = trim($input['download_url'] ?? '');
        $backupDownloadUrl = trim($input['backup_download_url'] ?? '');
        $productCode = $input['product_code'] ?? 'dubbing';
        
        if (empty($version)) {
            Response::error('版本号不能为空', 1001);
        }
        
        $db = Database::getInstance();
        
        // 插入版本历史
        $db->insert('version_history', [
            'product_code' => $productCode,
            'version' => $version,
            'force_update' => $forceUpdate,
            'changelog' => $changelog,
            'download_url' => $downloadUrl,
            'backup_download_url' => $backupDownloadUrl,
            'published_by' => $payload['admin_id'] ?? 0
        ]);
        
        // 更新系统设置中的当前版本（根据产品使用不同的key）
        $versionKey = $productCode === 'comic' ? 'comic_current_version' : 'dubbing_current_version';
        $db->query(
            "INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
            [$versionKey, $version, $version]
        );
        $db->query(
            "INSERT INTO system_settings (setting_key, setting_value) VALUES ('force_update', ?) ON DUPLICATE KEY UPDATE setting_value = ?",
            [$forceUpdate ? '1' : '0', $forceUpdate ? '1' : '0']
        );
        $db->query(
            "INSERT INTO system_settings (setting_key, setting_value) VALUES ('update_changelog', ?) ON DUPLICATE KEY UPDATE setting_value = ?",
            [$changelog, $changelog]
        );
        $db->query(
            "INSERT INTO system_settings (setting_key, setting_value) VALUES ('update_download_url', ?) ON DUPLICATE KEY UPDATE setting_value = ?",
            [$downloadUrl, $downloadUrl]
        );
        $db->query(
            "INSERT INTO system_settings (setting_key, setting_value) VALUES ('backup_download_url', ?) ON DUPLICATE KEY UPDATE setting_value = ?",
            [$backupDownloadUrl, $backupDownloadUrl]
        );
        
        // 记录操作日志
        self::logOperation('发布版本', 'version', null, ['version' => $version, 'force_update' => $forceUpdate]);
        
        // 广播版本更新通知
        self::notifyConfigUpdated('version');
        
        Response::success(null, '版本发布成功');
    }
    
    /**
     * 数据库备份
     */
    public static function backupDatabase($input) {
        $payload = self::checkAdminAuth();
        self::checkSensitiveAuth($payload);
        
        // 生成备份文件名
        $filename = 'backup_' . date('Ymd_His') . '.sql';
        $backupDir = '/www/wwwroot/auth.wzagent.cn/backups/';
        $backupPath = $backupDir . $filename;
        
        // 执行备份命令（使用 --defaults-extra-file 避免密码出现在命令行中）
        $dbConfig = require __DIR__ . '/../config/database.php';
        
        // 创建临时配置文件传递密码，避免命令行泄露
        $tmpCnf = tempnam(sys_get_temp_dir(), 'mydb_');
        file_put_contents($tmpCnf, sprintf(
            "[mysqldump]\nuser=%s\npassword=%s\nhost=%s\nport=%d\n",
            $dbConfig['username'],
            $dbConfig['password'],
            $dbConfig['host'],
            $dbConfig['port'] ?? 3306
        ));
        chmod($tmpCnf, 0600);
        
        $cmd = sprintf(
            'mysqldump --defaults-extra-file=%s %s > %s 2>&1',
            escapeshellarg($tmpCnf),
            escapeshellarg($dbConfig['database']),
            escapeshellarg($backupPath)
        );
        
        // 确保备份目录存在
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }
        
        exec($cmd, $output, $returnCode);
        @unlink($tmpCnf); // 清理临时配置文件
        
        if ($returnCode === 0 && file_exists($backupPath)) {
            $fileSize = filesize($backupPath);
            
            // 记录操作日志
            self::logOperation('数据库备份', 'backup', null, ['filename' => $filename, 'size' => $fileSize]);
            
            Response::success([
                'filename' => $filename,
                'size' => $fileSize
            ], '备份成功');
        } else {
            Response::error('备份失败', 5001);
        }
    }
    
    /**
     * 获取备份列表
     */
    public static function getBackupList($input) {
        self::checkAdminAuth();
        
        $backupDir = '/www/wwwroot/auth.wzagent.cn/backups/';
        $backups = [];
        
        if (is_dir($backupDir)) {
            $files = scandir($backupDir);
            foreach ($files as $file) {
                if (preg_match('/^backup_\d{8}_\d{6}\.sql$/', $file)) {
                    $filePath = $backupDir . $file;
                    $backups[] = [
                        'filename' => $file,
                        'size' => filesize($filePath),
                        'created_at' => date('Y-m-d H:i:s', filemtime($filePath))
                    ];
                }
            }
        }
        
        // 按时间倒序
        usort($backups, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });
        
        Response::success(['list' => $backups]);
    }
    
    /**
     * 清理过期日志
     */
    public static function cleanupLogs($input) {
        $payload = self::checkAdminAuth();
        self::checkSensitiveAuth($payload);
        
        $db = Database::getInstance();
        $days = (int)($input['days'] ?? 30);
        
        if ($days < 7) {
            Response::error('保留天数不能少于7天', 1001);
        }
        
        $cutoffDate = date('Y-m-d H:i:s', strtotime("-{$days} days"));
        
        // 清理操作日志
        $deletedLogs = $db->query(
            "DELETE FROM admin_operation_logs WHERE created_at < ?",
            [$cutoffDate]
        )->rowCount();
        
        // 清理登录日志
        $deletedLoginLogs = $db->query(
            "DELETE FROM user_login_logs WHERE created_at < ?",
            [$cutoffDate]
        )->rowCount();
        
        // 记录操作日志
        self::logOperation('清理日志', 'system', null, [
            'days' => $days,
            'deleted_operation_logs' => $deletedLogs,
            'deleted_login_logs' => $deletedLoginLogs
        ]);
        
        Response::success([
            'deleted_operation_logs' => $deletedLogs,
            'deleted_login_logs' => $deletedLoginLogs
        ], '清理完成');
    }
    
    /**
     * 上传文件
     */
    public static function upload() {
        self::checkAdminAuth();
        
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            Response::error('文件上传失败', 1001);
        }
        
        $file = $_FILES['file'];
        $type = $_POST['type'] ?? 'default';
        
        // 验证文件类型
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $isSvg = ($ext === 'svg' || $file['type'] === 'image/svg+xml');
        
        if (!$isSvg && !in_array($file['type'], $allowedTypes)) {
            Response::error('只支持 JPG、PNG、GIF、WEBP、SVG 格式', 1002);
        }
        
        // 验证文件大小 (2MB)
        if ($file['size'] > 2 * 1024 * 1024) {
            Response::error('文件大小不能超过 2MB', 1003);
        }
        
        // SVG 安全清洗：移除 script、event handler 等危险内容
        if ($isSvg) {
            $svgContent = file_get_contents($file['tmp_name']);
            // 移除 <script> 标签
            $svgContent = preg_replace('/<script\b[^>]*>.*?<\/script>/is', '', $svgContent);
            // 移除 on* 事件属性（onclick, onerror, onload 等）
            $svgContent = preg_replace('/\s+on\w+\s*=\s*["\'][^"\']*["\']/i', '', $svgContent);
            $svgContent = preg_replace('/\s+on\w+\s*=\s*\S+/i', '', $svgContent);
            // 移除 javascript: 协议
            $svgContent = preg_replace('/javascript\s*:/i', 'blocked:', $svgContent);
            // 移除 data: 协议（防止嵌入恶意内容）
            $svgContent = preg_replace('/data\s*:\s*text\/html/i', 'blocked:text/html', $svgContent);
            // 移除 <foreignObject> 标签（可嵌入 HTML）
            $svgContent = preg_replace('/<foreignObject\b[^>]*>.*?<\/foreignObject>/is', '', $svgContent);
            file_put_contents($file['tmp_name'], $svgContent);
            $ext = 'svg';
        }
        $filename = $type . '_' . date('YmdHis') . '_' . uniqid() . '.' . $ext;
        
        // 上传目录 - 使用 api/uploads 目录
        $uploadDir = __DIR__ . '/../uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $targetPath = $uploadDir . $filename;
        
        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            Response::error('文件保存失败', 1004);
        }
        
        // 返回文件 URL（使用相对路径，兼容任何域名）
        $url = '/api/uploads/' . $filename;
        
        // 记录操作日志
        self::logOperation('上传文件', 'file', null, [
            'type' => $type,
            'filename' => $filename,
            'size' => $file['size']
        ]);
        
        Response::success([
            'url' => $url,
            'filename' => $filename
        ], '上传成功');
    }
    
    /**
     * 通知用户信息已更新（通过 WebSocket 推送）
     */
    private static function notifyUserUpdated($userId) {
        try {
            // 获取用户最新信息
            $db = Database::getInstance();
            $user = $db->fetch("SELECT id, email, user_group, expire_time, status FROM users WHERE id = ?", [$userId]);
            
            if (!$user) {
                return;
            }
            
            // 计算 is_vip 和 is_trial
            $isVip = in_array($user['user_group'], ['monthly', 'yearly', 'permanent', 'trial']);
            $isTrial = $user['user_group'] === 'trial';
            
            // 通过 WebSocket 推送用户信息更新
            require_once __DIR__ . '/../../websocket/src/PushService.php';
            $pushService = new \MaruAudio\WebSocket\PushService();
            
            $pushService->pushToUser($userId, 'user_updated', [
                'user_group' => $user['user_group'],
                'expire_time' => $user['expire_time'],
                'is_vip' => $isVip,
                'is_trial' => $isTrial,
                'status' => $user['status']
            ]);
            
            // 同时推送会员状态变更事件
            $pushService->pushToUser($userId, 'membership_changed', [
                'user_group' => $user['user_group'],
                'expire_time' => $user['expire_time'],
                'is_vip' => $isVip,
                'is_trial' => $isTrial
            ]);
        } catch (Exception $e) {
            error_log("WebSocket 推送失败: " . $e->getMessage());
        }
    }
    
    /**
     * 解析日期时间字符串为 MySQL 格式
     */
    private static function parseDateTime($dateTime) {
        if (empty($dateTime)) {
            return null;
        }
        
        // 如果已经是正确的 MySQL 格式，直接返回
        if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $dateTime)) {
            return $dateTime;
        }
        
        // 如果只有日期部分，补全时间
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTime)) {
            return $dateTime . ' 00:00:00';
        }
        
        // 处理 ISO 8601 格式: 2026-03-23T00:00:00.000Z
        $cleanTime = $dateTime;
        
        // 移除毫秒部分 (.000, .000000 等)
        $cleanTime = preg_replace('/\.\d+/', '', $cleanTime);
        
        // 移除Z后缀（UTC时区标识）
        $cleanTime = rtrim($cleanTime, 'Z');
        
        // 替换T为空格
        $cleanTime = str_replace('T', ' ', $cleanTime);
        
        // 验证转换后的格式
        if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $cleanTime)) {
            return $cleanTime;
        }
        
        // 尝试使用 strtotime 解析
        $timestamp = strtotime($cleanTime);
        if ($timestamp !== false) {
            return date('Y-m-d H:i:s', $timestamp);
        }
        
        // 尝试原始格式
        $timestamp = strtotime($dateTime);
        if ($timestamp !== false) {
            return date('Y-m-d H:i:s', $timestamp);
        }
        
        // 解析失败，返回错误
        Response::error('日期格式无效: ' . $dateTime, 1002);
    }
    
    /**
     * 通知配置已更新 - 通过 WebSocket 广播给所有在线用户
     */
    private static function notifyConfigUpdated($key) {
        try {
            require_once __DIR__ . '/../../websocket/src/PushService.php';
            $pushService = new \MaruAudio\WebSocket\PushService();
            
            // 广播配置更新通知
            $pushService->broadcast('config_updated', [
                'type' => $key,
                'timestamp' => time()
            ]);
        } catch (\Exception $e) {
            error_log("配置更新广播失败: " . $e->getMessage());
        }
    }
    
    /**
     * 通知用户提现处理结果
     */
    private static function notifyWithdrawalProcessed($userId, $status, $amount, $reason = '') {
        try {
            require_once __DIR__ . '/../../websocket/src/PushService.php';
            $pushService = new \MaruAudio\WebSocket\PushService();
            
            $pushService->pushToUser($userId, 'withdrawal_processed', [
                'status' => $status,
                'amount' => $amount,
                'reason' => $reason,
                'timestamp' => time()
            ]);
        } catch (\Exception $e) {
            error_log("提现通知推送失败: " . $e->getMessage());
        }
    }
    
    /**
     * 通知用户余额已更新
     */
    private static function notifyBalanceUpdated($userId, $newBalance) {
        try {
            require_once __DIR__ . '/../../websocket/src/PushService.php';
            $pushService = new \MaruAudio\WebSocket\PushService();
            
            $pushService->pushToUser($userId, 'balance_updated', [
                'balance' => $newBalance,
                'timestamp' => time()
            ]);
        } catch (\Exception $e) {
            error_log("余额更新推送失败: " . $e->getMessage());
        }
    }
    
    /**
     * 测试 DashScope API Key
     */
    public static function testDashScopeApi($input) {
        self::checkAdminAuth();
        
        $apiKey = $input['api_key'] ?? '';
        
        // 如果前端未传入 key，从数据库读取已保存的 key
        if (empty($apiKey)) {
            $db = Database::getInstance();
            $setting = $db->fetch("SELECT setting_value FROM system_settings WHERE setting_key = 'dashscope_api_key'");
            $apiKey = $setting ? $setting['setting_value'] : '';
        }
        
        if (empty($apiKey)) {
            Response::error('API Key 未配置，请先保存 API Key', 1001);
            return;
        }
        
        $url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
        
        $payload = json_encode([
            'model' => 'qwen3-tts-flash',
            'input' => [
                'text' => '测试',
                'voice' => 'Cherry',
                'language_type' => 'Chinese'
            ]
        ]);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        if ($curlError) {
            Response::error('API 连接失败: ' . $curlError, 5001);
            return;
        }
        
        $result = json_decode($response, true);
        
        if ($httpCode === 200 && isset($result['output']['audio']['url'])) {
            Response::success(['message' => 'API Key 验证成功']);
        } elseif (isset($result['code']) && $result['code'] === 'InvalidApiKey') {
            Response::error('API Key 无效', 4001);
        } else {
            $errorMsg = $result['message'] ?? $result['code'] ?? '未知错误';
            Response::error('API 返回异常: ' . $errorMsg, 5002);
        }
    }
    
    /**
     * 获取字符包激活码列表
     */
    public static function getCharacterPackCodes($input) {
        self::checkAdminAuth();
        
        $db = Database::getInstance();
        $page = max(1, intval($input['page'] ?? 1));
        $pageSize = min(100, max(10, intval($input['page_size'] ?? 20)));
        $offset = ($page - 1) * $pageSize;
        
        $where = "1=1";
        $params = [];
        
        if (!empty($input['status'])) {
            $where .= " AND status = ?";
            $params[] = $input['status'];
        }
        
        if (!empty($input['pack_type'])) {
            $where .= " AND pack_type = ?";
            $params[] = $input['pack_type'];
        }
        
        if (!empty($input['batch_id'])) {
            $where .= " AND batch_id = ?";
            $params[] = $input['batch_id'];
        }
        
        if (!empty($input['code'])) {
            $where .= " AND code LIKE ?";
            $params[] = '%' . $input['code'] . '%';
        }
        
        $total = $db->fetch(
            "SELECT COUNT(*) as count FROM character_pack_codes WHERE $where",
            $params
        );
        
        $params[] = $pageSize;
        $params[] = $offset;
        
        $codes = $db->fetchAll(
            "SELECT c.*, u.email as used_by_email 
             FROM character_pack_codes c 
             LEFT JOIN users u ON c.used_by = u.id 
             WHERE $where 
             ORDER BY c.created_at DESC 
             LIMIT ? OFFSET ?",
            $params
        );
        
        Response::success([
            'codes' => $codes,
            'total' => (int)$total['count'],
            'page' => $page,
            'page_size' => $pageSize
        ]);
    }
    
    /**
     * 生成字符包激活码
     */
    public static function generateCharacterPackCodes($input) {
        $adminData = self::checkAdminAuth();
        
        $packType = $input['pack_type'] ?? '';
        $count = max(1, min(100, intval($input['count'] ?? 1)));
        $remark = $input['remark'] ?? '';
        
        if (!in_array($packType, ['basic', 'standard', 'professional'])) {
            Response::error('无效的套餐类型', 3001);
        }
        
        $db = Database::getInstance();
        
        // 获取套餐配置
        $config = $db->fetch(
            "SELECT * FROM character_pack_config WHERE pack_type = ?",
            [$packType]
        );
        
        if (!$config) {
            Response::error('套餐配置不存在', 3002);
        }
        
        // 生成批次ID
        $batchId = 'CP' . date('YmdHis') . rand(1000, 9999);
        
        // 生成激活码
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $code = self::generateUniqueCode();
            
            $db->insert('character_pack_codes', [
                'code' => $code,
                'pack_type' => $packType,
                'characters' => $config['characters'],
                'price' => $config['price'],
                'validity_days' => $config['validity_days'],
                'batch_id' => $batchId,
                'remark' => $remark,
                'created_by' => $adminData['admin_id']
            ]);
            
            $codes[] = $code;
        }
        
        self::logOperation('生成字符包激活码', 'character_pack_codes', $batchId, [
            'pack_type' => $packType,
            'count' => $count,
            'characters' => $config['characters']
        ]);
        
        Response::success([
            'batch_id' => $batchId,
            'codes' => $codes,
            'count' => $count,
            'pack_type' => $packType,
            'characters' => (int)$config['characters'],
            'price' => $config['price']
        ]);
    }
    
    /**
     * 生成唯一激活码
     */
    private static function generateUniqueCode() {
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $code = '';
        for ($i = 0; $i < 16; $i++) {
            if ($i > 0 && $i % 4 === 0) {
                $code .= '-';
            }
            $code .= $chars[random_int(0, strlen($chars) - 1)];
        }
        return $code;
    }
    
    /**
     * 禁用字符包激活码
     */
    public static function disableCharacterPackCode($input) {
        self::checkAdminAuth();
        
        $codeId = intval($input['id'] ?? 0);
        
        if ($codeId <= 0) {
            Response::error('无效的激活码ID', 3001);
        }
        
        $db = Database::getInstance();
        
        $code = $db->fetch(
            "SELECT * FROM character_pack_codes WHERE id = ?",
            [$codeId]
        );
        
        if (!$code) {
            Response::error('激活码不存在', 3002);
        }
        
        if ($code['status'] === 'used') {
            Response::error('已使用的激活码无法禁用', 3003);
        }
        
        $db->update('character_pack_codes', [
            'status' => 'disabled'
        ], 'id = ?', [$codeId]);
        
        self::logOperation('禁用字符包激活码', 'character_pack_codes', $codeId, [
            'code' => $code['code']
        ]);
        
        Response::success(['message' => '激活码已禁用']);
    }
    
    /**
     * 删除字符包激活码
     */
    public static function deleteCharacterPackCode($input) {
        $payload = self::checkAdminAuth();
        self::checkSensitiveAuth($payload);
        
        $codeId = intval($input['id'] ?? 0);
        
        if ($codeId <= 0) {
            Response::error('无效的激活码ID', 3001);
        }
        
        $db = Database::getInstance();
        
        $code = $db->fetch(
            "SELECT * FROM character_pack_codes WHERE id = ?",
            [$codeId]
        );
        
        if (!$code) {
            Response::error('激活码不存在', 3002);
        }
        
        if ($code['status'] === 'used') {
            Response::error('已使用的激活码无法删除', 3003);
        }
        
        $db->query("DELETE FROM character_pack_codes WHERE id = ?", [$codeId]);
        
        self::logOperation('删除字符包激活码', 'character_pack_codes', $codeId, [
            'code' => $code['code'],
            'pack_type' => $code['pack_type']
        ]);
        
        Response::success(['message' => '激活码已删除']);
    }
    
    /**
     * 获取用户字符余额列表
     */
    public static function getCharacterPackUsers($input) {
        self::checkAdminAuth();
        
        $db = Database::getInstance();
        $page = max(1, intval($input['page'] ?? 1));
        $pageSize = min(100, max(10, intval($input['page_size'] ?? 20)));
        $offset = ($page - 1) * $pageSize;
        
        $where = "1=1";
        $params = [];
        
        if (!empty($input['email'])) {
            $where .= " AND u.email LIKE ?";
            $params[] = '%' . $input['email'] . '%';
        }
        
        if (isset($input['has_balance']) && $input['has_balance']) {
            $where .= " AND b.balance > 0";
        }
        
        $total = $db->fetch(
            "SELECT COUNT(*) as count 
             FROM user_character_balance b 
             JOIN users u ON b.user_id = u.id 
             WHERE $where",
            $params
        );
        
        $params[] = $pageSize;
        $params[] = $offset;
        
        $users = $db->fetchAll(
            "SELECT b.*, u.email, u.register_time 
             FROM user_character_balance b 
             JOIN users u ON b.user_id = u.id 
             WHERE $where 
             ORDER BY b.balance DESC 
             LIMIT ? OFFSET ?",
            $params
        );
        
        Response::success([
            'users' => $users,
            'total' => (int)$total['count'],
            'page' => $page,
            'page_size' => $pageSize
        ]);
    }
    
    /**
     * 调整用户字符余额
     */
    public static function adjustUserCharacterBalance($input) {
        $adminData = self::checkAdminAuth();
        
        $userId = intval($input['user_id'] ?? 0);
        $adjustment = intval($input['adjustment'] ?? 0);
        $reason = $input['reason'] ?? '';
        
        if ($userId <= 0) {
            Response::error('无效的用户ID', 3001);
        }
        
        if ($adjustment === 0) {
            Response::error('调整数量不能为0', 3002);
        }
        
        $db = Database::getInstance();
        
        // 检查用户是否存在
        $user = $db->fetch("SELECT id, email FROM users WHERE id = ?", [$userId]);
        if (!$user) {
            Response::error('用户不存在', 3003);
        }
        
        $db->beginTransaction();
        
        try {
            // 获取或创建余额记录
            $balance = $db->fetch(
                "SELECT * FROM user_character_balance WHERE user_id = ? FOR UPDATE",
                [$userId]
            );
            
            if ($balance) {
                $newBalance = max(0, $balance['balance'] + $adjustment);
                $newTotal = $balance['total_characters'];
                if ($adjustment > 0) {
                    $newTotal += $adjustment;
                }
                
                $db->update('user_character_balance', [
                    'balance' => $newBalance,
                    'total_characters' => $newTotal
                ], 'user_id = ?', [$userId]);
                
                $balanceBefore = $balance['balance'];
            } else {
                if ($adjustment < 0) {
                    $db->rollback();
                    Response::error('用户没有余额记录，无法扣减', 3004);
                }
                
                $db->insert('user_character_balance', [
                    'user_id' => $userId,
                    'total_characters' => $adjustment,
                    'used_characters' => 0,
                    'balance' => $adjustment,
                    'expire_time' => date('Y-m-d H:i:s', strtotime('+365 days'))
                ]);
                
                $balanceBefore = 0;
                $newBalance = $adjustment;
            }
            
            // 记录日志
            $db->insert('character_usage_logs', [
                'user_id' => $userId,
                'action' => 'adjust',
                'characters' => $adjustment,
                'balance_before' => $balanceBefore,
                'balance_after' => $newBalance,
                'source' => 'admin_adjust',
                'source_id' => $adminData['username'] . ':' . $reason
            ]);
            
            $db->commit();
            
            self::logOperation('调整用户字符余额', 'user_character_balance', $userId, [
                'email' => $user['email'],
                'adjustment' => $adjustment,
                'reason' => $reason,
                'balance_before' => $balanceBefore,
                'balance_after' => $newBalance
            ]);
            
            // 通知用户余额已更新
            self::notifyBalanceUpdated($userId, $newBalance);
            
            Response::success([
                'message' => '余额调整成功',
                'balance_before' => (int)$balanceBefore,
                'balance_after' => (int)$newBalance
            ]);
            
        } catch (Exception $e) {
            $db->rollback();
            Response::error('调整失败：' . $e->getMessage(), 5001);
        }
    }
    
    /**
     * 获取字符包统计数据
     */
    public static function getCharacterPackStats() {
        self::checkAdminAuth();
        
        $db = Database::getInstance();
        
        // 激活码统计
        $codeStats = $db->fetch(
            "SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'unused' THEN 1 ELSE 0 END) as unused,
                SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as used,
                SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) as disabled
             FROM character_pack_codes"
        );
        
        // 用户余额统计
        $balanceStats = $db->fetch(
            "SELECT 
                COUNT(*) as total_users,
                SUM(balance) as total_balance,
                SUM(used_characters) as total_used,
                SUM(total_characters) as total_recharged
             FROM user_character_balance"
        );
        
        // 今日消耗
        $todayUsage = $db->fetch(
            "SELECT 
                COUNT(*) as count,
                SUM(ABS(characters)) as total
             FROM character_usage_logs 
             WHERE action = 'consume' 
             AND DATE(created_at) = CURDATE()"
        );
        
        // 套餐销售统计
        $packStats = $db->fetchAll(
            "SELECT 
                pack_type,
                COUNT(*) as sold,
                SUM(characters) as total_characters,
                SUM(price) as total_revenue
             FROM character_pack_codes 
             WHERE status = 'used' 
             GROUP BY pack_type"
        );
        
        Response::success([
            'codes' => [
                'total' => (int)$codeStats['total'],
                'unused' => (int)$codeStats['unused'],
                'used' => (int)$codeStats['used'],
                'disabled' => (int)$codeStats['disabled']
            ],
            'balance' => [
                'total_users' => (int)$balanceStats['total_users'],
                'total_balance' => (int)$balanceStats['total_balance'],
                'total_used' => (int)$balanceStats['total_used'],
                'total_recharged' => (int)$balanceStats['total_recharged']
            ],
            'today' => [
                'consume_count' => (int)$todayUsage['count'],
                'consume_total' => (int)$todayUsage['total']
            ],
            'packs' => $packStats
        ]);
    }
    
    /**
     * 获取字符包套餐配置
     */
    public static function getCharacterPackPackages() {
        self::checkAdminAuth();
        
        $db = Database::getInstance();
        
        $packages = $db->fetchAll(
            "SELECT pack_type, name, characters, price, validity_days, description, is_active, sort_order 
             FROM character_pack_config 
             ORDER BY sort_order ASC"
        );
        
        Response::success(['packages' => $packages]);
    }
    
    /**
     * 更新字符包套餐配置
     */
    public static function updateCharacterPackPackages($input) {
        self::checkAdminAuth();
        
        $packages = $input['packages'] ?? [];
        
        if (empty($packages)) {
            Response::error('套餐数据不能为空', 3001);
        }
        
        $db = Database::getInstance();
        
        foreach ($packages as $pkg) {
            $packType = $pkg['pack_type'] ?? '';
            if (empty($packType)) continue;
            
            $db->update('character_pack_config', [
                'characters' => intval($pkg['characters'] ?? 0),
                'price' => floatval($pkg['price'] ?? 0),
                'validity_days' => intval($pkg['validity_days'] ?? 365),
                'description' => $pkg['description'] ?? ''
            ], 'pack_type = ?', [$packType]);
        }
        
        self::logOperation('更新字符包套餐配置', 'character_pack_config', null, ['count' => count($packages)]);
        
        Response::success(['message' => '套餐配置已更新']);
    }
}
