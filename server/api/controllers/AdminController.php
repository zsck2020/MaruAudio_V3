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
            Response::error('账号已被禁用', 2003);
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
        
        // 异步发送登录提醒邮件（不阻塞登录流程）
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
     * 管理员登录验证码校验（已弃用，保留兼容）
     */
    public static function verify($input) {
        Response::error('此接口已弃用，请使用新的登录接口', 4001);
    }
}
