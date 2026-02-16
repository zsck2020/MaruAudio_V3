<?php
/**
 * 邮件发送类 - 使用 SMTP
 */
class Mailer {
    private static $config = null;
    
    private static function getConfig() {
        if (self::$config === null) {
            // 先从文件加载默认配置
            self::$config = require __DIR__ . '/../config/mail.php';
            
            // 尝试从数据库加载配置覆盖
            try {
                $db = Database::getInstance();
                $dbConfig = $db->fetchAll(
                    "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'from_name')"
                );
                
                foreach ($dbConfig as $row) {
                    $key = $row['setting_key'];
                    $value = $row['setting_value'];
                    if (!empty($value)) {
                        self::$config[$key] = $value;
                        // from_email 使用 smtp_user
                        if ($key === 'smtp_user') {
                            self::$config['from_email'] = $value;
                        }
                    }
                }
            } catch (Exception $e) {
                // 数据库读取失败，使用文件配置
            }
        }
        return self::$config;
    }
    
    /**
     * 发送验证码邮件
     */
    public static function sendVerificationCode($to, $code, $type = 'register') {
        $config = self::getConfig();
        
        // 根据类型设置邮件标题
        switch ($type) {
            case 'register':
                $subject = '【丸子配音】注册验证码';
                break;
            case 'smart':
                $subject = '【丸子配音】登录验证码';
                break;
            case 'reset':
                $subject = '【丸子配音】密码重置验证码';
                break;
            default:
                $subject = '【丸子配音】验证码';
        }
        
        $body = self::getVerificationEmailTemplate($code, $type);
        
        return self::send($to, $subject, $body);
    }
    
    /**
     * 发送管理员登录提醒邮件
     */
    public static function sendAdminLoginNotify($to, $username, $ip, $userAgent) {
        $subject = '【丸子智能】管理后台登录提醒';
        
        $body = self::getAdminLoginNotifyTemplate($username, $ip, $userAgent);
        
        return self::send($to, $subject, $body);
    }
    
    /**
     * 发送邮件
     */
    public static function send($to, $subject, $body) {
        $config = self::getConfig();
        
        $host = $config['smtp_host'];
        $port = $config['smtp_port'];
        $user = $config['smtp_user'];
        $pass = $config['smtp_pass'];
        $fromName = $config['from_name'];
        $fromEmail = $config['from_email'];
        
        // 使用 fsockopen 发送 SMTP 邮件
        $errno = 0;
        $errstr = '';
        
        // SSL 连接
        $socket = @fsockopen("ssl://{$host}", $port, $errno, $errstr, 30);
        
        if (!$socket) {
            error_log("SMTP连接失败: {$errstr} ({$errno})");
            return false;
        }
        
        // 读取欢迎消息
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '220') {
            fclose($socket);
            return false;
        }
        
        // EHLO
        fputs($socket, "EHLO localhost\r\n");
        while ($line = fgets($socket, 515)) {
            if (substr($line, 3, 1) == ' ') break;
        }
        
        // AUTH LOGIN
        fputs($socket, "AUTH LOGIN\r\n");
        fgets($socket, 515);
        
        // 用户名
        fputs($socket, base64_encode($user) . "\r\n");
        fgets($socket, 515);
        
        // 密码
        fputs($socket, base64_encode($pass) . "\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '235') {
            error_log("SMTP认证失败: {$response}");
            fclose($socket);
            return false;
        }
        
        // MAIL FROM
        fputs($socket, "MAIL FROM:<{$fromEmail}>\r\n");
        fgets($socket, 515);
        
        // RCPT TO
        fputs($socket, "RCPT TO:<{$to}>\r\n");
        fgets($socket, 515);
        
        // DATA
        fputs($socket, "DATA\r\n");
        fgets($socket, 515);
        
        // 邮件头
        $headers = "From: {$fromName} <{$fromEmail}>\r\n";
        $headers .= "To: {$to}\r\n";
        $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "Date: " . date("r") . "\r\n";
        $headers .= "\r\n";
        
        // 邮件内容
        fputs($socket, $headers . $body . "\r\n.\r\n");
        $response = fgets($socket, 515);
        
        // QUIT
        fputs($socket, "QUIT\r\n");
        fclose($socket);
        
        return substr($response, 0, 3) == '250';
    }
    
    /**
     * 获取验证码邮件模板
     */
    private static function getVerificationEmailTemplate($code, $type) {
        // 根据类型设置标题和操作描述
        switch ($type) {
            case 'register':
                $title = '注册验证码';
                $action = '注册账号';
                break;
            case 'smart':
                $title = '登录验证码';
                $action = '登录账号';
                break;
            case 'reset':
                $title = '密码重置验证码';
                $action = '重置密码';
                break;
            default:
                $title = '验证码';
                $action = '验证身份';
        }
        
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .logo { text-align: center; margin-bottom: 20px; font-size: 24px; color: #3B82F6; font-weight: bold; }
        .title { text-align: center; font-size: 18px; color: #333; margin-bottom: 20px; }
        .code { text-align: center; font-size: 32px; font-weight: bold; color: #3B82F6; letter-spacing: 8px; padding: 20px; background: #f0f7ff; border-radius: 8px; margin: 20px 0; }
        .hint { color: #666; font-size: 14px; line-height: 1.8; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🎙️ 丸子配音</div>
        <div class="title">{$title}</div>
        <div class="code">{$code}</div>
        <div class="hint">
            <p>您正在{$action}，验证码有效期为 <strong>5 分钟</strong>。</p>
            <p>如果这不是您本人的操作，请忽略此邮件。</p>
        </div>
        <div class="footer">
            © 2025 丸子配音 - 智能 AI 配音工具
        </div>
    </div>
</body>
</html>
HTML;
    }
    
    /**
     * 获取管理员登录提醒邮件模板
     */
    private static function getAdminLoginNotifyTemplate($username, $ip, $userAgent) {
        $time = date('Y-m-d H:i:s');
        $browser = self::parseBrowser($userAgent);
        $location = self::getIpLocation($ip);
        // HTML 转义防止 XSS
        $username = htmlspecialchars($username, ENT_QUOTES, 'UTF-8');
        $ip = htmlspecialchars($ip, ENT_QUOTES, 'UTF-8');
        $browser = htmlspecialchars($browser, ENT_QUOTES, 'UTF-8');
        $location = htmlspecialchars($location, ENT_QUOTES, 'UTF-8');
        
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .logo { text-align: center; margin-bottom: 20px; font-size: 24px; color: #52c41a; font-weight: bold; }
        .title { text-align: center; font-size: 18px; color: #333; margin-bottom: 20px; }
        .info { background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { display: flex; margin-bottom: 10px; font-size: 14px; }
        .info-label { color: #666; width: 80px; }
        .info-value { color: #333; flex: 1; }
        .info-value a { color: #1890ff; text-decoration: none; }
        .warning { color: #ff4d4f; font-size: 13px; margin-top: 15px; padding: 10px; background: #fff2f0; border-radius: 4px; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">✅ 登录成功</div>
        <div class="title">管理后台登录提醒</div>
        <div class="info">
            <div class="info-row"><span class="info-label">账号：</span><span class="info-value">{$username}</span></div>
            <div class="info-row"><span class="info-label">时间：</span><span class="info-value">{$time}</span></div>
            <div class="info-row"><span class="info-label">IP：</span><span class="info-value">{$ip}</span></div>
            <div class="info-row"><span class="info-label">浏览器：</span><span class="info-value">{$browser}</span></div>
            <div class="info-row"><span class="info-label">登录地区：</span><span class="info-value">{$location}</span></div>
        </div>
        <div class="warning">
            ⚠️ 如果这不是您本人的操作，请立即修改密码并检查账号安全！
        </div>
        <div class="footer">
            © 2025 丸子智能 - 多产品管理平台
        </div>
    </div>
</body>
</html>
HTML;
    }
    
    /**
     * 解析浏览器信息
     */
    private static function parseBrowser($userAgent) {
        if (empty($userAgent)) return '未知';
        
        if (strpos($userAgent, 'Chrome') !== false) {
            preg_match('/Chrome\/([0-9.]+)/', $userAgent, $m);
            return 'Chrome ' . ($m[1] ?? '');
        }
        if (strpos($userAgent, 'Firefox') !== false) {
            preg_match('/Firefox\/([0-9.]+)/', $userAgent, $m);
            return 'Firefox ' . ($m[1] ?? '');
        }
        if (strpos($userAgent, 'Safari') !== false && strpos($userAgent, 'Chrome') === false) {
            return 'Safari';
        }
        if (strpos($userAgent, 'Edge') !== false) {
            return 'Edge';
        }
        
        return substr($userAgent, 0, 50);
    }
    
    /**
     * 获取 IP 地理位置
     */
    private static function getIpLocation($ip) {
        if (empty($ip) || $ip === '127.0.0.1' || $ip === '::1') {
            return '本地';
        }
        
        // 使用 ip-api.com 免费接口（中文）
        try {
            $url = "http://ip-api.com/json/{$ip}?lang=zh-CN&fields=status,country,regionName,city";
            $context = stream_context_create(['http' => ['timeout' => 3]]);
            $response = @file_get_contents($url, false, $context);
            
            if ($response) {
                $data = json_decode($response, true);
                if ($data && $data['status'] === 'success') {
                    $parts = array_filter([
                        $data['country'] ?? '',
                        $data['regionName'] ?? '',
                        $data['city'] ?? ''
                    ]);
                    if (!empty($parts)) {
                        return implode(' ', $parts);
                    }
                }
            }
        } catch (Exception $e) {}
        
        return '未知地区';
    }
    
}
