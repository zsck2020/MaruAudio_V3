<?php
/**
 * 认证控制器
 */
class AuthController {
    
    /**
     * 发送验证码
     */
    public static function sendCode($input) {
        $email = $input['email'] ?? '';
        $type = $input['type'] ?? 'register'; // register, reset
        $machineCode = $input['machine_code'] ?? '';
        
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('邮箱格式不正确', 1001);
        }
        
        $db = Database::getInstance();
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        
        // 检查发送频率
        $table = ($type === 'register' || $type === 'smart') ? 'register_codes' : 'password_reset_codes';
        $lastCode = $db->fetch(
            "SELECT * FROM {$table} WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)",
            [$email]
        );
        
        if ($lastCode) {
            Response::error('发送太频繁，请稍后再试', 4001);
        }
        
        // 注册/智能登录时的检查
        if ($type === 'register' || $type === 'smart') {
            // 智能登录模式：不检查邮箱是否已存在（允许新用户和老用户）
            // 传统注册模式：检查邮箱是否已存在
            if ($type === 'register') {
                $existUser = $db->fetch("SELECT id FROM users WHERE email = ?", [$email]);
                if ($existUser) {
                    Response::error('该邮箱已注册', 2004);
                }
            }
            
            // 检查机器码注册限制（仅对新用户有效，智能登录时在smartLogin中判断）
            if ($type === 'register' && !empty($machineCode)) {
                // 获取机器码注册限制设置
                $limitSetting = $db->fetch("SELECT setting_value FROM system_settings WHERE setting_key = 'machine_code_limit'");
                $machineCodeLimit = $limitSetting ? (int)$limitSetting['setting_value'] : 1;
                
                // 检查该机器码已注册的账号数
                $registeredCount = $db->fetch(
                    "SELECT COUNT(*) as count FROM machine_registrations WHERE machine_code = ?",
                    [$machineCode]
                );
                
                if ($registeredCount && (int)$registeredCount['count'] >= $machineCodeLimit) {
                    Response::error("该设备已注册 {$machineCodeLimit} 个账号，无法继续注册", 2005);
                }
            }
        }
        
        // 重置密码时检查邮箱是否存在
        if ($type === 'reset') {
            $existUser = $db->fetch("SELECT id FROM users WHERE email = ?", [$email]);
            if (!$existUser) {
                Response::error('该邮箱未注册', 2001);
            }
        }
        
        // 生成验证码
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = date('Y-m-d H:i:s', time() + 300);
        
        // 保存验证码
        // register 和 smart 类型保存到 register_codes 表（智能登录也使用此表验证）
        if ($type === 'register' || $type === 'smart') {
            $db->insert('register_codes', [
                'email' => $email,
                'code' => $code,
                'machine_code' => $machineCode,
                'expires_at' => $expiresAt,
                'ip_address' => $ip
            ]);
        } else {
            $db->insert('password_reset_codes', [
                'email' => $email,
                'code' => $code,
                'expires_at' => $expiresAt,
                'ip_address' => $ip
            ]);
        }
        
        // 发送验证码邮件
        require_once __DIR__ . '/../lib/Mailer.php';
        $sendResult = Mailer::sendVerificationCode($email, $code, $type);
        
        if ($sendResult) {
            Response::success([
                'message' => '验证码已发送到您的邮箱'
            ]);
        } else {
            Response::error('验证码发送失败，请稍后重试', 5002);
        }
    }
    
    /**
     * 用户注册
     */
    public static function register($input) {
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';
        $code = $input['code'] ?? '';
        $machineCode = $input['machine_code'] ?? '';
        $deviceInfo = $input['device_info'] ?? [];
        $inviteCode = $input['invite_code'] ?? '';
        
        // 参数验证
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('邮箱格式不正确', 1001);
        }
        if (empty($password) || strlen($password) < 6) {
            Response::error('密码长度至少6位', 1001);
        }
        if (empty($code)) {
            Response::error('验证码不能为空', 1001);
        }
        if (empty($machineCode)) {
            Response::error('机器码不能为空', 1001);
        }
        
        $db = Database::getInstance();
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        
        // 验证验证码
        $codeRecord = $db->fetch(
            "SELECT * FROM register_codes WHERE email = ? AND code = ? AND used = 0 AND expires_at > NOW()",
            [$email, $code]
        );
        
        if (!$codeRecord) {
            Response::error('验证码错误或已过期', 1002);
        }
        
        // 检查邮箱是否已注册
        $existUser = $db->fetch("SELECT id FROM users WHERE email = ?", [$email]);
        if ($existUser) {
            Response::error('该邮箱已注册', 2004);
        }
        
        // 检查机器码是否已注册
        $existMachine = $db->fetch(
            "SELECT id FROM machine_registrations WHERE machine_code = ?",
            [$machineCode]
        );
        if ($existMachine) {
            Response::error('该设备已注册账号', 2005);
        }
        
        // 查找邀请人
        $inviterId = null;
        if (!empty($inviteCode)) {
            $inviter = $db->fetch("SELECT id FROM users WHERE invite_code = ?", [$inviteCode]);
            if ($inviter) {
                $inviterId = $inviter['id'];
            }
        }
        
        // 生成用户邀请码
        $userInviteCode = strtoupper(substr(md5($email . time()), 0, 8));
        
        // 检查免费试用设置
        $trialEnabled = $db->fetch("SELECT setting_value FROM system_settings WHERE setting_key = 'trial_enabled'");
        $trialDays = $db->fetch("SELECT setting_value FROM system_settings WHERE setting_key = 'trial_duration_days'");
        
        $userGroup = 'free';
        $expireTime = null;
        
        // 开启免费试用时，新用户为 trial 用户组
        if ($trialEnabled && $trialEnabled['setting_value'] === '1') {
            $days = $trialDays ? (int)$trialDays['setting_value'] : 3;
            $userGroup = 'trial';
            $expireTime = date('Y-m-d H:i:s', time() + $days * 86400);
        }
        
        // 创建用户
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $userId = $db->insert('users', [
            'email' => $email,
            'password_hash' => $passwordHash,
            'user_group' => $userGroup,
            'expire_time' => $expireTime,
            'invite_code' => $userInviteCode,
            'invited_by' => $inviterId,
            'register_ip' => $ip,
            'register_machine_code' => $machineCode
        ]);
        
        // 记录机器码
        $db->insert('machine_registrations', [
            'machine_code' => $machineCode,
            'user_id' => $userId,
            'register_ip' => $ip,
            'hardware_info' => json_encode($deviceInfo)
        ]);
        
        // 绑定机器码
        $db->insert('machine_bindings', [
            'user_id' => $userId,
            'machine_code' => $machineCode
        ]);
        
        // 标记验证码已使用
        $db->update('register_codes', ['used' => 1], 'id = ?', [$codeRecord['id']]);
        
        // 生成 Token
        $token = JWTAuth::generate([
            'user_id' => $userId,
            'email' => $email
        ]);
        
        // 计算 is_trial 和 is_vip
        $isTrial = ($userGroup === 'trial');
        $isVip = in_array($userGroup, ['trial', 'monthly', 'yearly', 'permanent']);
        
        Response::success([
            'user_id' => $userId,
            'email' => $email,
            'user_group' => $userGroup,
            'expire_time' => $expireTime,
            'token' => $token,
            'is_trial' => $isTrial,
            'is_vip' => $isVip
        ], '注册成功');
    }
    
    /**
     * 用户登录
     */
    public static function login($input) {
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';
        $machineCode = $input['machine_code'] ?? '';
        // 支持扁平化字段和嵌套对象两种方式
        $deviceInfo = [
            'device_name' => $input['device_name'] ?? ($input['device_info']['device_name'] ?? null),
            'os_version' => $input['os_version'] ?? ($input['device_info']['os_version'] ?? null),
            'client_version' => $input['client_version'] ?? ($input['device_info']['client_version'] ?? null),
        ];
        
        if (empty($email) || empty($password)) {
            Response::error('邮箱和密码不能为空', 1001);
        }
        
        $db = Database::getInstance();
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        
        // 获取登录失败锁定设置
        $failLimitSetting = $db->fetch("SELECT setting_value FROM system_settings WHERE setting_key = 'login_fail_limit'");
        $lockDurationSetting = $db->fetch("SELECT setting_value FROM system_settings WHERE setting_key = 'login_lock_duration'");
        $loginFailLimit = $failLimitSetting ? (int)$failLimitSetting['setting_value'] : 5;
        $loginLockDuration = $lockDurationSetting ? (int)$lockDurationSetting['setting_value'] : 30;
        
        // 检查是否被锁定（基于 IP 或邮箱）
        $lockCheckTime = date('Y-m-d H:i:s', time() - $loginLockDuration * 60);
        $recentFailures = $db->fetch(
            "SELECT COUNT(*) as count FROM user_login_logs 
             WHERE (email = ? OR login_ip = ?) 
             AND login_result = 'failed' 
             AND created_at > ?",
            [$email, $ip, $lockCheckTime]
        );
        
        if ($recentFailures && (int)$recentFailures['count'] >= $loginFailLimit) {
            Response::error("登录失败次数过多，请 {$loginLockDuration} 分钟后再试", 4002);
        }
        
        // 查找用户
        $user = $db->fetch("SELECT * FROM users WHERE email = ?", [$email]);
        
        // 记录登录日志
        $logData = [
            'email' => $email,
            'login_ip' => $ip,
            'machine_code' => $machineCode,
            'device_name' => $deviceInfo['device_name'] ?? null,
            'os_version' => $deviceInfo['os_version'] ?? null,
            'client_version' => $deviceInfo['client_version'] ?? null
        ];
        
        if (!$user) {
            $logData['login_result'] = 'failed';
            $logData['fail_reason'] = '用户不存在';
            $db->insert('user_login_logs', $logData);
            Response::error('用户不存在', 2001);
        }
        
        if ($user['status'] === 'banned') {
            $logData['user_id'] = $user['id'];
            $logData['login_result'] = 'failed';
            $logData['fail_reason'] = '账号已被封禁';
            $db->insert('user_login_logs', $logData);
            Response::error('账号已被封禁', 2003);
        }
        
        if (!password_verify($password, $user['password_hash'])) {
            $logData['user_id'] = $user['id'];
            $logData['login_result'] = 'failed';
            $logData['fail_reason'] = '密码错误';
            $db->insert('user_login_logs', $logData);
            Response::error('密码错误', 2002);
        }
        
        // 登录成功
        $logData['user_id'] = $user['id'];
        $logData['login_result'] = 'success';
        $db->insert('user_login_logs', $logData);
        
        // 检查机器码绑定（不限制绑定数量，但会影响会员权益）
        if (!empty($machineCode)) {
            $existingBinding = $db->fetch(
                "SELECT id FROM machine_bindings WHERE user_id = ? AND machine_code = ?",
                [$user['id'], $machineCode]
            );
            
            if (!$existingBinding) {
                // 检查机器码更换冷却时间
                $cooldownSetting = $db->fetch("SELECT setting_value FROM system_settings WHERE setting_key = 'machine_change_cooldown'");
                $cooldownDays = $cooldownSetting ? (int)$cooldownSetting['setting_value'] : 30;
                
                // 获取用户最后一次绑定新机器码的时间
                $lastBinding = $db->fetch(
                    "SELECT bind_time FROM machine_bindings WHERE user_id = ? ORDER BY bind_time DESC LIMIT 1",
                    [$user['id']]
                );
                
                if ($lastBinding) {
                    $lastBindTime = strtotime($lastBinding['bind_time']);
                    $cooldownEnd = $lastBindTime + ($cooldownDays * 86400);
                    
                    if (time() < $cooldownEnd) {
                        $remainingDays = ceil(($cooldownEnd - time()) / 86400);
                        // 不阻止登录，但记录警告（用户可以登录，但新机器码不会获得会员权益）
                        // 这里我们仍然允许绑定，但在获取用户信息时会限制权益
                    }
                }
                
                // 绑定新机器码（不限制数量）
                $db->insert('machine_bindings', [
                    'user_id' => $user['id'],
                    'machine_code' => $machineCode
                ]);
            }
        }
        
        // 生成唯一的 session_id 用于单设备在线控制
        $sessionId = bin2hex(random_bytes(32));
        
        // 更新用户的当前 session（踢掉其他设备）
        $db->update('users', [
            'last_login_time' => date('Y-m-d H:i:s'),
            'last_login_ip' => $ip,
            'current_session_id' => $sessionId,
            'current_machine_code' => $machineCode
        ], 'id = ?', [$user['id']]);
        
        // 生成 Token（包含 session_id）
        $token = JWTAuth::generate([
            'user_id' => $user['id'],
            'email' => $user['email'],
            'session_id' => $sessionId
        ]);
        
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
        
        // 计算 is_trial 和 is_vip
        $isTrial = ($user['user_group'] === 'trial');
        $isVip = in_array($user['user_group'], ['trial', 'monthly', 'yearly', 'permanent']);
        
        // 生成 Refresh Token
        require_once __DIR__ . '/../lib/SecurityHelper.php';
        $refreshToken = SecurityHelper::generateRefreshToken($user['id']);
        
        Response::success([
            'user_id' => $user['id'],
            'email' => $user['email'],
            'user_group' => $user['user_group'],
            'expire_time' => $user['expire_time'],
            'register_time' => $user['register_time'],
            'token' => $token,
            'refresh_token' => $refreshToken,
            'is_trial' => $isTrial,
            'is_vip' => $isVip
        ], '登录成功');
    }
    
    /**
     * 智能登录（合并登录/注册）
     * 如果账号存在则登录，不存在则自动注册
     */
    public static function smartLogin($input) {
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';
        $code = $input['code'] ?? '';
        $machineCode = $input['machine_code'] ?? '';
        $inviteCode = $input['invite_code'] ?? '';
        $deviceInfo = [
            'device_name' => $input['device_name'] ?? ($input['device_info']['device_name'] ?? null),
            'os_version' => $input['os_version'] ?? ($input['device_info']['os_version'] ?? null),
            'client_version' => $input['client_version'] ?? ($input['device_info']['client_version'] ?? null),
        ];
        
        // 参数验证
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('邮箱格式不正确', 1001);
        }
        if (empty($password) || strlen($password) < 6) {
            Response::error('密码长度至少6位', 1001);
        }
        if (empty($code)) {
            Response::error('验证码不能为空', 1001);
        }
        if (empty($machineCode)) {
            Response::error('机器码不能为空', 1001);
        }
        
        $db = Database::getInstance();
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        
        // 验证验证码（使用 register_codes 表，因为发送时使用的是这个表）
        $codeRecord = $db->fetch(
            "SELECT * FROM register_codes WHERE email = ? AND code = ? AND used = 0 AND expires_at > NOW()",
            [$email, $code]
        );
        
        if (!$codeRecord) {
            Response::error('验证码错误或已过期', 1002);
        }
        
        // 检查用户是否存在
        $user = $db->fetch("SELECT * FROM users WHERE email = ?", [$email]);
        
        if ($user) {
            // ===== 用户存在：执行登录流程 =====
            
            // 检查账号状态
            if ($user['status'] === 'banned') {
                Response::error('账号已被封禁', 2003);
            }
            
            // 验证密码
            if (!password_verify($password, $user['password_hash'])) {
                Response::error('密码错误', 2002);
            }
            
            // 记录登录日志
            $db->insert('user_login_logs', [
                'user_id' => $user['id'],
                'email' => $email,
                'login_ip' => $ip,
                'machine_code' => $machineCode,
                'device_name' => $deviceInfo['device_name'],
                'os_version' => $deviceInfo['os_version'],
                'client_version' => $deviceInfo['client_version'],
                'login_result' => 'success'
            ]);
            
            // 检查并绑定机器码
            if (!empty($machineCode)) {
                $existingBinding = $db->fetch(
                    "SELECT id FROM machine_bindings WHERE user_id = ? AND machine_code = ?",
                    [$user['id'], $machineCode]
                );
                
                if (!$existingBinding) {
                    $db->insert('machine_bindings', [
                        'user_id' => $user['id'],
                        'machine_code' => $machineCode
                    ]);
                }
            }
            
            // 生成 session_id
            $sessionId = bin2hex(random_bytes(32));
            
            // 更新用户登录信息
            $db->update('users', [
                'last_login_time' => date('Y-m-d H:i:s'),
                'last_login_ip' => $ip,
                'current_session_id' => $sessionId,
                'current_machine_code' => $machineCode
            ], 'id = ?', [$user['id']]);
            
            // 标记验证码已使用
            $db->update('register_codes', ['used' => 1], 'id = ?', [$codeRecord['id']]);
            
            // 生成 Token
            $token = JWTAuth::generate([
                'user_id' => $user['id'],
                'email' => $user['email'],
                'session_id' => $sessionId
            ]);
            
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
            
            // 计算 is_trial 和 is_vip
            $isTrial = ($user['user_group'] === 'trial');
            $isVip = in_array($user['user_group'], ['trial', 'monthly', 'yearly', 'permanent']);
            
            // 生成 Refresh Token
            require_once __DIR__ . '/../lib/SecurityHelper.php';
            $refreshToken = SecurityHelper::generateRefreshToken($user['id']);
            
            Response::success([
                'user_id' => $user['id'],
                'email' => $user['email'],
                'user_group' => $user['user_group'],
                'expire_time' => $user['expire_time'],
                'register_time' => $user['register_time'],
                'token' => $token,
                'refresh_token' => $refreshToken,
                'is_new_user' => false,
                'is_trial' => $isTrial,
                'is_vip' => $isVip
            ], '登录成功');
            
        } else {
            // ===== 用户不存在：执行注册流程 =====
            
            // 检查机器码注册限制
            $limitSetting = $db->fetch("SELECT setting_value FROM system_settings WHERE setting_key = 'machine_code_limit'");
            $machineCodeLimit = $limitSetting ? (int)$limitSetting['setting_value'] : 1;
            
            $registeredCount = $db->fetch(
                "SELECT COUNT(*) as count FROM machine_registrations WHERE machine_code = ?",
                [$machineCode]
            );
            
            if ($registeredCount && (int)$registeredCount['count'] >= $machineCodeLimit) {
                Response::error("该设备已注册 {$machineCodeLimit} 个账号，无法继续注册", 2005);
            }
            
            // 查找邀请人
            $inviterId = null;
            if (!empty($inviteCode)) {
                $inviter = $db->fetch("SELECT id FROM users WHERE invite_code = ?", [$inviteCode]);
                if ($inviter) {
                    $inviterId = $inviter['id'];
                }
            }
            
            // 生成用户邀请码
            $userInviteCode = strtoupper(substr(md5($email . time()), 0, 8));
            
            // 检查免费试用设置
            $trialEnabled = $db->fetch("SELECT setting_value FROM system_settings WHERE setting_key = 'trial_enabled'");
            $trialDays = $db->fetch("SELECT setting_value FROM system_settings WHERE setting_key = 'trial_duration_days'");
            
            $userGroup = 'free';
            $expireTime = null;
            
            if ($trialEnabled && $trialEnabled['setting_value'] === '1') {
                $days = $trialDays ? (int)$trialDays['setting_value'] : 3;
                $userGroup = 'trial';
                $expireTime = date('Y-m-d H:i:s', time() + $days * 86400);
            }
            
            // 创建用户
            $passwordHash = password_hash($password, PASSWORD_BCRYPT);
            $sessionId = bin2hex(random_bytes(32));
            
            $userId = $db->insert('users', [
                'email' => $email,
                'password_hash' => $passwordHash,
                'user_group' => $userGroup,
                'expire_time' => $expireTime,
                'invite_code' => $userInviteCode,
                'invited_by' => $inviterId,
                'register_ip' => $ip,
                'register_machine_code' => $machineCode,
                'current_session_id' => $sessionId,
                'current_machine_code' => $machineCode,
                'last_login_time' => date('Y-m-d H:i:s'),
                'last_login_ip' => $ip
            ]);
            
            // 记录机器码注册
            $db->insert('machine_registrations', [
                'machine_code' => $machineCode,
                'user_id' => $userId,
                'register_ip' => $ip,
                'hardware_info' => json_encode($deviceInfo)
            ]);
            
            // 绑定机器码
            $db->insert('machine_bindings', [
                'user_id' => $userId,
                'machine_code' => $machineCode
            ]);
            
            // 标记验证码已使用
            $db->update('register_codes', ['used' => 1], 'id = ?', [$codeRecord['id']]);
            
            // 生成 Token
            $token = JWTAuth::generate([
                'user_id' => $userId,
                'email' => $email,
                'session_id' => $sessionId
            ]);
            
            // 计算 is_trial 和 is_vip
            $isTrial = ($userGroup === 'trial');
            $isVip = in_array($userGroup, ['trial', 'monthly', 'yearly', 'permanent']);
            
            // 生成 Refresh Token
            require_once __DIR__ . '/../lib/SecurityHelper.php';
            $refreshToken = SecurityHelper::generateRefreshToken($userId);
            
            Response::success([
                'user_id' => $userId,
                'email' => $email,
                'user_group' => $userGroup,
                'expire_time' => $expireTime,
                'token' => $token,
                'refresh_token' => $refreshToken,
                'is_new_user' => true,
                'is_trial' => $isTrial,
                'is_vip' => $isVip
            ], '注册成功，已自动登录');
        }
    }
    
    /**
     * 重置密码
     */
    public static function resetPassword($input) {
        $email = $input['email'] ?? '';
        $code = $input['code'] ?? '';
        $newPassword = $input['new_password'] ?? '';
        
        if (empty($email) || empty($code) || empty($newPassword)) {
            Response::error('参数不完整', 1001);
        }
        
        if (strlen($newPassword) < 6) {
            Response::error('密码长度至少6位', 1001);
        }
        
        $db = Database::getInstance();
        
        // 验证验证码
        $codeRecord = $db->fetch(
            "SELECT * FROM password_reset_codes WHERE email = ? AND code = ? AND used = 0 AND expires_at > NOW()",
            [$email, $code]
        );
        
        if (!$codeRecord) {
            Response::error('验证码错误或已过期', 1002);
        }
        
        // 更新密码
        $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT);
        $db->update('users', ['password_hash' => $passwordHash], 'email = ?', [$email]);
        
        // 标记验证码已使用
        $db->update('password_reset_codes', ['used' => 1], 'id = ?', [$codeRecord['id']]);
        
        Response::success(null, '密码重置成功');
    }
    
    /**
     * 刷新 Token
     * 使用 Refresh Token 获取新的 Access Token
     */
    public static function refreshToken($input) {
        $refreshToken = $input['refresh_token'] ?? '';
        
        if (empty($refreshToken)) {
            Response::error('Refresh Token 不能为空', 1001);
        }
        
        require_once __DIR__ . '/../lib/SecurityHelper.php';
        
        // 验证 Refresh Token
        $data = SecurityHelper::verifyRefreshToken($refreshToken);
        
        if (!$data) {
            Response::error('Refresh Token 无效或已过期', 4001);
        }
        
        $userId = $data['user_id'];
        $db = Database::getInstance();
        
        // 检查用户是否存在且未被封禁
        $user = $db->fetch(
            "SELECT id, email, status, user_group FROM users WHERE id = ?",
            [$userId]
        );
        
        if (!$user) {
            Response::error('用户不存在', 2001);
        }
        
        if ($user['status'] === 'banned') {
            Response::error('账号已被封禁', 2003);
        }
        
        // 生成新的 Access Token（2小时有效）
        $newToken = JWTAuth::generateToken([
            'user_id' => $user['id'],
            'email' => $user['email']
        ], 7200); // 2小时
        
        // 生成新的 Refresh Token
        $newRefreshToken = SecurityHelper::generateRefreshToken($user['id']);
        
        Response::success([
            'token' => $newToken,
            'refresh_token' => $newRefreshToken,
            'expires_in' => 7200
        ]);
    }
}
