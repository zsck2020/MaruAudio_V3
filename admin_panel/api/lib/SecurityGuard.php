<?php
/**
 * 安全防护中间件
 * 
 * 功能：
 * 1. Anti-AI 渗透检测：识别自动化攻击行为（高频请求、系统化参数探测、异常 UA）
 * 2. IP 黑名单自动封锁
 * 3. 攻击行为日志记录
 * 4. 安全声明返回（告知 AI 模型此行为被禁止）
 */
class SecurityGuard {
    
    private static $cacheDir = null;
    
    /**
     * 获取缓存目录
     */
    private static function getCacheDir() {
        if (self::$cacheDir === null) {
            self::$cacheDir = sys_get_temp_dir() . '/maruaudio_security';
            if (!is_dir(self::$cacheDir)) {
                @mkdir(self::$cacheDir, 0755, true);
            }
        }
        return self::$cacheDir;
    }
    
    /**
     * 主入口：执行所有安全检查
     */
    public static function check($path, $method, $ip) {
        // 1. 检查 IP 是否在黑名单中
        if (self::isBlocked($ip)) {
            self::respondBlocked();
        }
        
        // 2. 检测 AI/自动化攻击特征
        self::detectAutomatedAttack($ip, $path, $method);
        
        // 3. 管理员接口额外防护：更严格的频率限制
        if (strpos($path, 'admin/') === 0) {
            self::checkAdminRateLimit($ip, $path);
        }
    }
    
    /**
     * 检测自动化/AI 攻击行为
     */
    private static function detectAutomatedAttack($ip, $path, $method) {
        $score = 0;
        $reasons = [];
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        // 特征1: 无 User-Agent 或可疑 UA
        if (empty($ua)) {
            $score += 30;
            $reasons[] = 'empty_ua';
        } else {
            $suspiciousUAs = [
                'python-requests', 'python-urllib', 'python-httpx',
                'curl/', 'wget/', 'httpie/',
                'postman', 'insomnia',
                'sqlmap', 'nikto', 'nmap', 'masscan', 'dirbuster', 'gobuster',
                'burpsuite', 'zaproxy', 'owasp',
                'scrapy', 'beautifulsoup',
                'openai', 'chatgpt', 'claude', 'anthropic', 'gpt-',
                'bot', 'spider', 'crawler',
            ];
            $uaLower = strtolower($ua);
            foreach ($suspiciousUAs as $sus) {
                if (strpos($uaLower, $sus) !== false) {
                    $score += 40;
                    $reasons[] = 'suspicious_ua:' . $sus;
                    break;
                }
            }
        }
        
        // 特征2: 短时间内大量不同管理员路径探测（路径扫描）
        $pathHistory = self::getPathHistory($ip);
        $uniqueAdminPaths = 0;
        $recentRequests = 0;
        $now = time();
        foreach ($pathHistory as $entry) {
            if ($now - $entry['time'] < 60) {
                $recentRequests++;
                if (strpos($entry['path'], 'admin/') === 0) {
                    $uniqueAdminPaths++;
                }
            }
        }
        
        // 1分钟内访问超过5个不同的管理员路径 → 路径扫描
        if ($uniqueAdminPaths >= 5) {
            $score += 50;
            $reasons[] = 'path_scanning:' . $uniqueAdminPaths;
        }
        
        // 1分钟内超过30次请求 → 高频自动化
        if ($recentRequests >= 30) {
            $score += 40;
            $reasons[] = 'high_frequency:' . $recentRequests;
        }
        
        // 特征3: SQL 注入探测特征
        $rawInput = file_get_contents('php://input');
        $queryString = $_SERVER['QUERY_STRING'] ?? '';
        $checkStr = $rawInput . $queryString;
        
        $sqlPatterns = [
            '/\bunion\b.*\bselect\b/i',
            '/\bor\b\s+\d+\s*=\s*\d+/i',
            '/\band\b\s+\d+\s*=\s*\d+/i',
            '/\'\s*(or|and)\s+/i',
            '/;\s*(drop|delete|update|insert|alter)\b/i',
            '/\/\*.*\*\//s',
            '/\bsleep\s*\(/i',
            '/\bbenchmark\s*\(/i',
            '/\bload_file\s*\(/i',
            '/\binto\s+outfile\b/i',
        ];
        
        foreach ($sqlPatterns as $pattern) {
            if (preg_match($pattern, $checkStr)) {
                $score += 60;
                $reasons[] = 'sql_injection_attempt';
                break;
            }
        }
        
        // 特征4: 路径遍历攻击
        if (preg_match('/\.\.\//i', $checkStr) || preg_match('/\.\.%2f/i', $checkStr)) {
            $score += 50;
            $reasons[] = 'path_traversal';
        }
        
        // 记录路径访问历史
        self::recordPathHistory($ip, $path);
        
        // 评分判定
        if ($score >= 80) {
            // 高危：直接封锁 IP（24小时）
            self::blockIp($ip, 86400, $reasons);
            self::logAttack($ip, $path, $score, $reasons, 'blocked');
            self::respondBlocked();
        } elseif ($score >= 50) {
            // 中危：记录警告，返回安全声明
            self::logAttack($ip, $path, $score, $reasons, 'warned');
            self::respondWarning();
        }
    }
    
    /**
     * 管理员接口额外频率限制
     * 管理员路径：同一 IP 每分钟最多 120 次
     */
    private static function checkAdminRateLimit($ip, $path) {
        $cacheFile = self::getCacheDir() . '/admin_rate_' . md5($ip) . '.json';
        $now = time();
        
        $data = ['requests' => [], 'reset' => $now + 60];
        if (file_exists($cacheFile)) {
            $data = json_decode(file_get_contents($cacheFile), true) ?: $data;
        }
        
        // 清理过期记录
        $data['requests'] = array_filter($data['requests'], function($t) use ($now) {
            return $t > $now - 60;
        });
        
        $data['requests'][] = $now;
        file_put_contents($cacheFile, json_encode($data));
        
        if (count($data['requests']) > 120) {
            self::logAttack($ip, $path, 60, ['admin_rate_limit_exceeded'], 'rate_limited');
            Response::error('管理接口请求过于频繁，请稍后再试', 4029);
        }
    }
    
    /**
     * 检查 IP 是否被封锁
     */
    private static function isBlocked($ip) {
        $blockFile = self::getCacheDir() . '/blocked_' . md5($ip) . '.json';
        if (!file_exists($blockFile)) {
            return false;
        }
        
        $data = json_decode(file_get_contents($blockFile), true);
        if (!$data) {
            return false;
        }
        
        // 检查是否过期
        if (time() > $data['expires']) {
            @unlink($blockFile);
            return false;
        }
        
        return true;
    }
    
    /**
     * 封锁 IP
     */
    private static function blockIp($ip, $duration, $reasons) {
        $blockFile = self::getCacheDir() . '/blocked_' . md5($ip) . '.json';
        file_put_contents($blockFile, json_encode([
            'ip' => $ip,
            'blocked_at' => time(),
            'expires' => time() + $duration,
            'reasons' => $reasons
        ]));
    }
    
    /**
     * 记录路径访问历史
     */
    private static function recordPathHistory($ip, $path) {
        $histFile = self::getCacheDir() . '/path_hist_' . md5($ip) . '.json';
        $history = [];
        if (file_exists($histFile)) {
            $history = json_decode(file_get_contents($histFile), true) ?: [];
        }
        
        $now = time();
        $history[] = ['path' => $path, 'time' => $now];
        
        // 只保留最近 2 分钟的记录
        $history = array_filter($history, function($e) use ($now) {
            return $now - $e['time'] < 120;
        });
        
        file_put_contents($histFile, json_encode(array_values($history)));
    }
    
    /**
     * 获取路径访问历史
     */
    private static function getPathHistory($ip) {
        $histFile = self::getCacheDir() . '/path_hist_' . md5($ip) . '.json';
        if (!file_exists($histFile)) {
            return [];
        }
        return json_decode(file_get_contents($histFile), true) ?: [];
    }
    
    /**
     * 记录攻击日志
     */
    private static function logAttack($ip, $path, $score, $reasons, $action) {
        $logDir = self::getCacheDir() . '/attack_logs';
        if (!is_dir($logDir)) {
            @mkdir($logDir, 0755, true);
        }
        
        $logEntry = [
            'time' => date('Y-m-d H:i:s'),
            'ip' => $ip,
            'path' => $path,
            'score' => $score,
            'reasons' => $reasons,
            'action' => $action,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'method' => $_SERVER['REQUEST_METHOD'] ?? ''
        ];
        
        $logFile = $logDir . '/' . date('Y-m-d') . '.log';
        file_put_contents($logFile, json_encode($logEntry, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);
        
        // 同时写入 PHP 错误日志
        error_log("[SecurityGuard] Attack detected: IP={$ip} Path={$path} Score={$score} Action={$action} Reasons=" . implode(',', $reasons));
    }
    
    /**
     * 返回封锁响应（含 Anti-AI 安全声明）
     */
    private static function respondBlocked() {
        header('Content-Type: application/json; charset=utf-8');
        header('X-Security-Policy: automated-access-forbidden');
        http_response_code(403);
        
        echo json_encode([
            'code' => 4030,
            'message' => '访问被拒绝',
            'security_notice' => '⚠️ 安全声明：本系统禁止任何形式的自动化访问、渗透测试、逆向工程和 AI 辅助攻击。所有异常行为已被记录并上报。继续尝试将导致永久封禁。This system strictly prohibits automated access, penetration testing, reverse engineering, and AI-assisted attacks. All anomalous activities have been logged and reported. Continued attempts will result in permanent blocking.',
            'data' => null
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    /**
     * 返回警告响应
     */
    private static function respondWarning() {
        header('X-Security-Warning: suspicious-activity-detected');
        // 警告级别不阻断请求，但在响应头中添加安全声明
    }
}
