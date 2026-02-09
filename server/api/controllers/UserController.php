<?php
/**
 * 用户控制器
 */
class UserController {
    
    /**
     * 获取用户信息
     */
    public static function info() {
        $payload = JWTAuth::getPayloadFromRequest();
        
        if (!$payload) {
            Response::error('未登录或Token已过期', 4001);
        }
        
        $db = Database::getInstance();
        $user = $db->fetch(
            "SELECT id, email, avatar, user_group, expire_time, register_time, last_login_time, current_session_id, current_machine_code FROM users WHERE id = ?",
            [$payload['user_id']]
        );
        
        if (!$user) {
            Response::error('用户不存在', 2001);
        }
        
        // 检查 session_id 是否匹配（单设备在线控制）
        $tokenSessionId = $payload['session_id'] ?? null;
        if ($tokenSessionId && $user['current_session_id'] && $tokenSessionId !== $user['current_session_id']) {
            Response::error('您的账号已在其他设备登录，当前设备已被踢下线', 4002);
        }
        
        // 获取绑定的机器码（按绑定时间排序）
        $bindings = $db->fetchAll(
            "SELECT machine_code, bind_time FROM machine_bindings WHERE user_id = ? ORDER BY bind_time ASC",
            [$user['id']]
        );
        
        $user['machine_bindings'] = $bindings;
        
        // 获取前2个绑定的机器码
        $validMachineCodes = [];
        for ($i = 0; $i < min(2, count($bindings)); $i++) {
            $validMachineCodes[] = $bindings[$i]['machine_code'];
        }
        
        // 检查当前机器码是否在前2个绑定的机器码中
        $currentMachineCode = $user['current_machine_code'] ?? null;
        $isMachineCodeValid = empty($currentMachineCode) || in_array($currentMachineCode, $validMachineCodes);
        
        // 判断是否是试用会员（user_group = 'trial'）
        $user['is_trial'] = ($user['user_group'] === 'trial');
        
        // 计算会员状态（只有前2个机器码享有会员权益）
        $user['is_vip'] = false;
        $shouldDowngrade = false;  // 是否需要降级为免费用户
        
        if ($isMachineCodeValid) {
            if ($user['user_group'] === 'free') {
                // 免费用户不享受会员功能
                $user['is_vip'] = false;
            } elseif ($user['user_group'] === 'permanent') {
                // 永久会员
                $user['is_vip'] = true;
            } elseif ($user['user_group'] === 'trial') {
                // 试用会员：检查到期时间
                if ($user['expire_time'] && strtotime($user['expire_time']) > time()) {
                    $user['is_vip'] = true;
                } else {
                    // 试用已过期，标记需要降级
                    $shouldDowngrade = true;
                }
            } elseif (in_array($user['user_group'], ['monthly', 'yearly'])) {
                // 月卡/年卡会员：检查到期时间
                if ($user['expire_time'] && strtotime($user['expire_time']) > time()) {
                    $user['is_vip'] = true;
                } elseif (empty($user['expire_time'])) {
                    // 如果到期时间为空但用户组是付费会员，说明管理员手动设置，视为有效
                    $user['is_vip'] = true;
                } else {
                    // 会员已过期，标记需要降级
                    $shouldDowngrade = true;
                }
            }
        }
        
        // 会员到期自动降级为免费用户
        if ($shouldDowngrade) {
            $db->update('users', ['user_group' => 'free'], 'id = ?', [$user['id']]);
            $user['user_group'] = 'free';
            $user['is_vip'] = false;
        }
        
        // 添加机器码有效性标记
        $user['machine_code_valid'] = $isMachineCodeValid;
        $user['valid_machine_codes'] = $validMachineCodes;
        
        // 移除敏感字段
        unset($user['current_session_id']);
        
        Response::success($user);
    }
    
    /**
     * 卡密激活
     */
    public static function activate($input) {
        $payload = JWTAuth::getPayloadFromRequest();
        
        if (!$payload) {
            Response::error('未登录或Token已过期', 4001);
        }
        
        $cardKey = trim($input['card_key'] ?? '');
        $clientProductCode = trim($input['product_code'] ?? 'dubbing');  // 客户端传入的产品代码
        
        if (empty($cardKey)) {
            Response::error('卡密不能为空', 1001);
        }
        
        if (strlen($cardKey) > 255) {
            Response::error('卡密长度超出限制', 1001);
        }
        
        if (strlen($clientProductCode) > 50) {
            Response::error('产品代码长度超出限制', 1001);
        }
        
        $db = Database::getInstance();
        
        // 查找卡密
        $card = $db->fetch(
            "SELECT * FROM card_keys WHERE card_key = ?",
            [$cardKey]
        );
        
        if (!$card) {
            Response::error('卡密不存在', 3001);
        }
        
        if ($card['status'] === 'used') {
            Response::error('卡密已被使用', 3002);
        }
        
        if ($card['status'] === 'disabled') {
            Response::error('卡密已被禁用', 3002);
        }
        
        // 校验产品代码（卡密必须与当前产品匹配）
        $cardProductCode = $card['product_code'] ?? 'dubbing';
        if ($cardProductCode !== $clientProductCode) {
            Response::error('该卡密不适用于当前产品', 3004);
        }
        
        // 获取用户信息
        $user = $db->fetch("SELECT * FROM users WHERE id = ?", [$payload['user_id']]);
        
        // 计算新的到期时间
        $currentExpire = $user['expire_time'];
        $durationDays = $card['duration_days'];
        
        if ($card['card_type'] === 'permanent') {
            $newExpireTime = null;
            $newUserGroup = 'permanent';
        } else {
            // 如果当前有会员且未过期，从当前到期时间开始计算
            if ($currentExpire && strtotime($currentExpire) > time()) {
                $baseTime = strtotime($currentExpire);
            } else {
                $baseTime = time();
            }
            
            $newExpireTime = date('Y-m-d H:i:s', $baseTime + $durationDays * 86400);
            $newUserGroup = $card['card_type'];
        }
        
        // 更新用户
        $updateData = ['user_group' => $newUserGroup];
        if ($newExpireTime) {
            $updateData['expire_time'] = $newExpireTime;
        } else {
            // 永久会员清除到期时间
            $updateData['expire_time'] = null;
        }
        
        // 注意：数据库表中没有 trial_expire_time 字段，所以不需要清除
        // 试用会员的逻辑通过 user_group 字段来判断
        
        $db->update('users', $updateData, 'id = ?', [$user['id']]);
        
        // 更新卡密状态
        $db->update('card_keys', [
            'status' => 'used',
            'used_at' => date('Y-m-d H:i:s'),
            'used_by' => $user['id']
        ], 'id = ?', [$card['id']]);
        
        // 计算邀请人佣金
        if (!empty($user['invited_by'])) {
            $commissionEnabled = $db->fetch("SELECT setting_value FROM system_settings WHERE setting_key = 'commission_enabled'");
            if ($commissionEnabled && $commissionEnabled['setting_value'] === '1') {
                $commissionRate = $db->fetch("SELECT setting_value FROM system_settings WHERE setting_key = 'commission_rate'");
                $rate = $commissionRate ? (float)$commissionRate['setting_value'] : 10;
                
                // 从数据库获取卡密价格
                $priceMonthly = $db->fetch("SELECT setting_value FROM system_settings WHERE setting_key = 'card_price_monthly'");
                $priceYearly = $db->fetch("SELECT setting_value FROM system_settings WHERE setting_key = 'card_price_yearly'");
                $pricePermanent = $db->fetch("SELECT setting_value FROM system_settings WHERE setting_key = 'card_price_permanent'");
                
                $cardPrices = [
                    'monthly' => $priceMonthly ? (float)$priceMonthly['setting_value'] : 29.9,
                    'yearly' => $priceYearly ? (float)$priceYearly['setting_value'] : 199,
                    'permanent' => $pricePermanent ? (float)$pricePermanent['setting_value'] : 399
                ];
                $cardPrice = $cardPrices[$card['card_type']] ?? 0;
                
                if ($cardPrice > 0) {
                    $commissionAmount = $cardPrice * $rate / 100;
                    
                    // 创建佣金记录
                    $db->insert('commissions', [
                        'user_id' => $user['invited_by'],
                        'from_user_id' => $user['id'],
                        'amount' => $commissionAmount,
                        'rate' => $rate,
                        'status' => 'available'
                    ]);
                }
            }
        }
        
        // 通知用户会员状态已更新
        self::notifyMembershipChanged($user['id'], $newUserGroup, $newExpireTime);
        
        Response::success([
            'user_group' => $newUserGroup,
            'expire_time' => $newExpireTime,
            'duration_days' => $durationDays
        ], '激活成功');
    }
    
    /**
     * 通知用户会员状态已更新
     */
    private static function notifyMembershipChanged($userId, $userGroup, $expireTime) {
        try {
            require_once __DIR__ . '/../../websocket/src/PushService.php';
            $pushService = new \MaruAudio\WebSocket\PushService();
            
            $pushService->pushToUser($userId, 'membership_changed', [
                'user_group' => $userGroup,
                'expire_time' => $expireTime,
                'is_vip' => $userGroup !== 'free',
                'timestamp' => time()
            ]);
        } catch (\Exception $e) {
            error_log("会员状态推送失败: " . $e->getMessage());
        }
    }
    
    /**
     * 获取邀请信息
     */
    public static function getInviteInfo() {
        $payload = JWTAuth::getPayloadFromRequest();
        
        if (!$payload) {
            Response::error('未登录或Token已过期', 4001);
        }
        
        $db = Database::getInstance();
        $userId = $payload['user_id'];
        
        // 获取用户邀请码
        $user = $db->fetch("SELECT invite_code FROM users WHERE id = ?", [$userId]);
        
        // 如果没有邀请码，生成一个
        if (empty($user['invite_code'])) {
            $inviteCode = strtoupper(substr(md5($userId . time()), 0, 8));
            $db->update('users', ['invite_code' => $inviteCode], 'id = ?', [$userId]);
            $user['invite_code'] = $inviteCode;
        }
        
        // 获取邀请统计
        $inviteCount = $db->fetch(
            "SELECT COUNT(*) as count FROM users WHERE invited_by = ?",
            [$userId]
        )['count'];
        
        // 获取佣金余额
        $commission = $db->fetch(
            "SELECT COALESCE(SUM(amount), 0) as total FROM commissions WHERE user_id = ? AND status = 'available'",
            [$userId]
        )['total'];
        
        // 获取已提现金额
        $withdrawn = $db->fetch(
            "SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE user_id = ? AND status = 'completed'",
            [$userId]
        )['total'];
        
        // 获取邀请奖励规则
        $inviteRules = $db->fetch("SELECT setting_value FROM system_settings WHERE setting_key = 'invite_rules'");
        $rules = $inviteRules ? json_decode($inviteRules['setting_value'], true) : [];
        
        Response::success([
            'invite_code' => $user['invite_code'],
            'invite_count' => (int)$inviteCount,
            'commission_balance' => (float)$commission,
            'withdrawn_total' => (float)$withdrawn,
            'invite_rules' => $rules
        ]);
    }
    
    /**
     * 获取邀请记录
     */
    public static function getInviteRecords($input) {
        $payload = JWTAuth::getPayloadFromRequest();
        
        if (!$payload) {
            Response::error('未登录或Token已过期', 4001);
        }
        
        $db = Database::getInstance();
        $userId = $payload['user_id'];
        $page = max(1, (int)($input['page'] ?? 1));
        $pageSize = min(50, max(10, (int)($input['page_size'] ?? 20)));
        $offset = ($page - 1) * $pageSize;
        
        // 获取邀请的用户列表
        $records = $db->fetchAll(
            "SELECT id, email, register_time, user_group FROM users WHERE invited_by = ? ORDER BY register_time DESC LIMIT ? OFFSET ?",
            [$userId, $pageSize, $offset]
        );
        
        // 隐藏邮箱部分字符
        foreach ($records as &$record) {
            $email = $record['email'];
            $atPos = strpos($email, '@');
            if ($atPos > 2) {
                $record['email'] = substr($email, 0, 2) . str_repeat('*', $atPos - 2) . substr($email, $atPos);
            }
        }
        
        $total = $db->fetch(
            "SELECT COUNT(*) as count FROM users WHERE invited_by = ?",
            [$userId]
        )['count'];
        
        Response::success([
            'records' => $records,
            'total' => (int)$total,
            'page' => $page,
            'page_size' => $pageSize
        ]);
    }
    
    /**
     * 申请提现
     */
    public static function requestWithdraw($input) {
        $payload = JWTAuth::getPayloadFromRequest();
        
        if (!$payload) {
            Response::error('未登录或Token已过期', 4001);
        }
        
        $amount = (float)($input['amount'] ?? 0);
        $account = trim($input['account'] ?? '');
        $accountType = $input['account_type'] ?? 'alipay';
        
        if ($amount <= 0) {
            Response::error('提现金额必须大于0', 1001);
        }
        
        if ($amount > 100000) {
            Response::error('单次提现金额不能超过100000', 1001);
        }
        
        if (empty($account)) {
            Response::error('请填写收款账号', 1001);
        }
        
        if (strlen($account) > 255) {
            Response::error('收款账号长度超出限制', 1001);
        }
        
        if (!in_array($accountType, ['alipay', 'wechat', 'bank'])) {
            Response::error('不支持的收款方式', 1001);
        }
        
        $db = Database::getInstance();
        $userId = $payload['user_id'];
        
        // 获取最低提现金额
        $minWithdraw = $db->fetch("SELECT setting_value FROM system_settings WHERE setting_key = 'commission_min_withdraw'");
        $minAmount = $minWithdraw ? (float)$minWithdraw['setting_value'] : 50;
        
        if ($amount < $minAmount) {
            Response::error("最低提现金额为 ¥{$minAmount}", 1001);
        }
        
        // 获取可用佣金余额
        $balance = $db->fetch(
            "SELECT COALESCE(SUM(amount), 0) as total FROM commissions WHERE user_id = ? AND status = 'available'",
            [$userId]
        )['total'];
        
        if ($amount > $balance) {
            Response::error('余额不足', 1001);
        }
        
        // 开始事务
        $pdo = $db->getConnection();
        $pdo->beginTransaction();
        
        try {
            // 创建提现申请
            $withdrawalId = $db->insert('withdrawals', [
                'user_id' => $userId,
                'amount' => $amount,
                'account_type' => $accountType,
                'account' => $account,
                'status' => 'pending',
                'created_at' => date('Y-m-d H:i:s')
            ]);
            
            // 冻结对应金额的佣金
            // 按时间顺序冻结佣金记录，直到达到提现金额
            $remainingAmount = $amount;
            $commissions = $db->fetchAll(
                "SELECT id, amount FROM commissions WHERE user_id = ? AND status = 'available' ORDER BY created_at ASC",
                [$userId]
            );
            
            foreach ($commissions as $commission) {
                if ($remainingAmount <= 0) break;
                
                $db->update('commissions', [
                    'status' => 'frozen',
                    'withdrawal_id' => $withdrawalId
                ], 'id = ?', [$commission['id']]);
                
                $remainingAmount -= $commission['amount'];
            }
            
            $pdo->commit();
            Response::success(null, '提现申请已提交，请等待审核');
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error('提现申请失败，请稍后重试', 5001);
        }
    }
    
    /**
     * 获取用户消息
     */
    public static function getMessages($input) {
        $payload = JWTAuth::getPayloadFromRequest();
        
        if (!$payload) {
            Response::error('未登录或Token已过期', 4001);
        }
        
        $db = Database::getInstance();
        $userId = $payload['user_id'];
        
        $messages = $db->fetchAll(
            "SELECT * FROM user_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
            [$userId]
        );
        
        $unreadCount = $db->fetch(
            "SELECT COUNT(*) as count FROM user_messages WHERE user_id = ? AND is_read = 0",
            [$userId]
        )['count'] ?? 0;
        
        Response::success([
            'list' => $messages,
            'unread_count' => (int)$unreadCount
        ]);
    }
    
    /**
     * 标记消息已读
     */
    public static function markMessageRead($input) {
        $payload = JWTAuth::getPayloadFromRequest();
        
        if (!$payload) {
            Response::error('未登录或Token已过期', 4001);
        }
        
        $messageId = (int)($input['message_id'] ?? 0);
        $userId = $payload['user_id'];
        
        $db = Database::getInstance();
        
        if ($messageId > 0) {
            $db->update('user_messages', ['is_read' => 1], 'id = ? AND user_id = ?', [$messageId, $userId]);
        } else {
            // 标记全部已读
            $db->query("UPDATE user_messages SET is_read = 1 WHERE user_id = ?", [$userId]);
        }
        
        Response::success(null, '已标记为已读');
    }
    
    /**
     * 同步用户状态（轻量级轮询端点，替代 WebSocket）
     * 用于检查关键状态和版本信息，客户端通过版本判断是否有新变化
     */
    public static function sync() {
        $payload = JWTAuth::getPayloadFromRequest();
        
        if (!$payload) {
            Response::error('未登录或Token已过期', 4001);
        }
        
        $db = Database::getInstance();
        
        // 获取用户关键状态
        $user = $db->fetch(
            "SELECT id, user_group, expire_time, current_session_id FROM users WHERE id = ?",
            [$payload['user_id']]
        );
        
        if (!$user) {
            Response::error('用户不存在', 2001);
        }
        
        // 检查 session_id 是否匹配（单设备在线控制）
        $tokenSessionId = $payload['session_id'] ?? null;
        if ($tokenSessionId && $user['current_session_id'] && $tokenSessionId !== $user['current_session_id']) {
            Response::error('您的账号已在其他设备登录，当前设备已被踢下线', 4002);
        }
        
        // 获取最新公告 ID
        $latestAnnouncement = $db->fetch(
            "SELECT id FROM announcements WHERE is_active = 1 ORDER BY priority DESC, id DESC LIMIT 1"
        );
        
        // 获取版本信息
        $versionInfo = $db->fetch(
            "SELECT setting_value FROM system_settings WHERE setting_key = 'current_version'"
        );
        $forceUpdate = $db->fetch(
            "SELECT setting_value FROM system_settings WHERE setting_key = 'force_update'"
        );
        
        // 计算同步版本号（使用用户最后更新时间 + 系统配置更新时间）
        $userUpdateTime = $db->fetch(
            "SELECT UNIX_TIMESTAMP(GREATEST(COALESCE(last_login_time, register_time), register_time)) as ts FROM users WHERE id = ?",
            [$payload['user_id']]
        );
        $configUpdateTime = $db->fetch(
            "SELECT MAX(UNIX_TIMESTAMP(updated_at)) as ts FROM system_settings"
        );
        
        $syncVersion = max(
            (int)($userUpdateTime['ts'] ?? 0),
            (int)($configUpdateTime['ts'] ?? 0)
        );
        
        // 判断会员状态，并检查是否需要降级
        $isVip = false;
        $shouldDowngrade = false;
        
        if ($user['user_group'] === 'permanent') {
            $isVip = true;
        } elseif ($user['user_group'] === 'free') {
            $isVip = false;
        } elseif (in_array($user['user_group'], ['monthly', 'yearly', 'trial'])) {
            if ($user['expire_time'] && strtotime($user['expire_time']) > time()) {
                $isVip = true;
            } elseif (empty($user['expire_time'])) {
                // 到期时间为空但用户组是付费会员，说明管理员手动设置，视为有效
                $isVip = true;
            } else {
                // 会员已过期，标记需要降级
                $shouldDowngrade = true;
            }
        }
        
        // 会员到期自动降级为免费用户（在 sync 端点也执行降级）
        if ($shouldDowngrade) {
            $db->update('users', ['user_group' => 'free'], 'id = ?', [$payload['user_id']]);
            $user['user_group'] = 'free';
            $isVip = false;
        }
        
        Response::success([
            'sync_version' => $syncVersion,
            'user' => [
                'user_group' => $user['user_group'],
                'expire_time' => $user['expire_time'],
                'is_vip' => $isVip
            ],
            'config' => [
                'latest_version' => $versionInfo['setting_value'] ?? '1.0.0',
                'force_update' => ($forceUpdate['setting_value'] ?? '0') === '1',
                'latest_announcement_id' => (int)($latestAnnouncement['id'] ?? 0)
            ]
        ]);
    }
}
