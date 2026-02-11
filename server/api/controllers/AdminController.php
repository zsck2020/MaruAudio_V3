<?php
/**
 * 管理员控制器
 */
class AdminController {
    
    /**
     * 管理员登录（无需验证码，登录成功后邮件提醒）
     */
    public static function login($input) {
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';
        
        if (empty($username) || empty($password)) {
            Response::error('用户名和密码不能为空', 1001);
        }
        
        $db = Database::getInstance();
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';

        // 获取登录失败锁定设置（复用用户登录逻辑的配置）
        $failLimitSetting = $db->fetch("SELECT setting_value FROM system_settings WHERE setting_key = 'login_fail_limit'");
        $lockDurationSetting = $db->fetch("SELECT setting_value FROM system_settings WHERE setting_key = 'login_lock_duration'");
        $loginFailLimit = $failLimitSetting ? (int)$failLimitSetting['setting_value'] : 5;
        $loginLockDuration = $lockDurationSetting ? (int)$lockDurationSetting['setting_value'] : 30;

        // 检查是否被锁定（基于 IP 或用户名）
        $lockCheckTime = date('Y-m-d H:i:s', time() - $loginLockDuration * 60);
        $recentFailures = $db->fetch(
            "SELECT COUNT(*) AS count FROM admin_login_logs
             WHERE (username = ? OR login_ip = ?)
             AND login_result = 'failed'
             AND login_time > ?",
            [$username, $ip, $lockCheckTime]
        );

        if ($recentFailures && (int)$recentFailures['count'] >= $loginFailLimit) {
            Response::error("登录失败次数过多，请 {$loginLockDuration} 分钟后再试", 4002);
        }
        
        // 查找管理员
        $admin = $db->fetch("SELECT * FROM admins WHERE username = ?", [$username]);
        
        // 记录登录日志
        $logData = [
            'username' => $username,
            'login_ip' => $ip,
            'user_agent' => substr($userAgent, 0, 255)
        ];
        
        if (!$admin) {
            $logData['login_result'] = 'failed';
            $logData['fail_reason'] = '用户不存在';
            $db->insert('admin_login_logs', $logData);
            Response::error('用户名或密码错误', 2002);
        }
        
        if ($admin['status'] === 'disabled') {
            $logData['admin_id'] = $admin['id'];
            $logData['login_result'] = 'failed';
            $logData['fail_reason'] = '账号已禁用';
            $db->insert('admin_login_logs', $logData);
            Response::error('账号已禁用', 2003);
        }
        
        if (!password_verify($password, $admin['password_hash'])) {
            $logData['admin_id'] = $admin['id'];
            $logData['login_result'] = 'failed';
            $logData['fail_reason'] = '密码错误';
            $db->insert('admin_login_logs', $logData);
            Response::error('用户名或密码错误', 2002);
        }
        
        // 记录登录成功日志
        $logData['admin_id'] = $admin['id'];
        $logData['login_result'] = 'success';
        $db->insert('admin_login_logs', $logData);
        
        // 更新最后登录信息
        $db->update('admins', [
            'last_login_time' => date('Y-m-d H:i:s'),
            'last_login_ip' => $ip
        ], 'id = ?', [$admin['id']]);
        
        // 生成 Token（有效期 2 小时）
        $token = JWTAuth::generate([
            'admin_id' => $admin['id'],
            'username' => $admin['username'],
            'role' => $admin['role'],
            'type' => 'admin'
        ]);
        
        // 异发登录提醒邮件（不阻塞登录流程）
        require_once __DIR__ . '/../lib/Mailer.php';
        Mailer::sendAdminLoginNotify($admin['email'], $admin['username'], $ip, $userAgent);
        
        Response::success([
            'admin_id' => $admin['id'],
            'username' => $admin['username'],
            'email' => $admin['email'],
            'role' => $admin['role'],
            'token' => $token
        ], '登录成功');
    }
    
    /**
     * 管理员验证接口（已弃用）
     */
    public static function verify($input) {
        Response::error('此接口已弃用，使用新的登录接口', 4001);
    }
}
