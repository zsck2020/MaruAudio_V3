<?php
/**
 * 增强日志系统
 * 支持结构化日志、日志级别、日志轮转
 */
class Logger {
    const LEVEL_DEBUG = 'debug';
    const LEVEL_INFO = 'info';
    const LEVEL_WARNING = 'warning';
    const LEVEL_ERROR = 'error';
    const LEVEL_CRITICAL = 'critical';
    
    private static $logDir = null;
    private static $logLevel = self::LEVEL_INFO;
    private static $maxFileSize = 10 * 1024 * 1024; // 10MB
    private static $maxFiles = 10;
    
    /**
     * 初始化日志系统
     */
    private static function init() {
        if (self::$logDir === null) {
            $env = getenv('MARUAUDIO_ENV') ?: (getenv('APP_ENV') ?: 'production');
            self::$logDir = sys_get_temp_dir() . '/maruaudio_logs';
            if (!is_dir(self::$logDir)) {
                @mkdir(self::$logDir, 0755, true);
            }
            
            // 从环境变量读取日志级别
            $logLevel = getenv('MARUAUDIO_LOG_LEVEL') ?: ($env === 'development' ? self::LEVEL_DEBUG : self::LEVEL_INFO);
            self::$logLevel = $logLevel;
        }
    }
    
    /**
     * 获取日志级别优先级
     */
    private static function getLevelPriority($level) {
        $priorities = [
            self::LEVEL_DEBUG => 0,
            self::LEVEL_INFO => 1,
            self::LEVEL_WARNING => 2,
            self::LEVEL_ERROR => 3,
            self::LEVEL_CRITICAL => 4,
        ];
        return $priorities[$level] ?? 0;
    }
    
    /**
     * 检查是否应该记录该级别的日志
     */
    private static function shouldLog($level) {
        self::init();
        return self::getLevelPriority($level) >= self::getLevelPriority(self::$logLevel);
    }
    
    /**
     * 记录日志
     */
    public static function log($level, $message, $context = []) {
        if (!self::shouldLog($level)) {
            return;
        }
        
        self::init();
        
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'level' => strtoupper($level),
            'message' => $message,
            'context' => $context,
            'request_id' => APM::getRequestId(),
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
        ];
        
        $logLine = json_encode($logData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
        
        // 根据级别选择日志文件
        $logFile = self::$logDir . '/' . $level . '_' . date('Y-m-d') . '.log';
        
        // 检查文件大小，如果超过限制则轮转
        if (file_exists($logFile) && filesize($logFile) > self::$maxFileSize) {
            self::rotateLog($logFile);
        }
        
        @file_put_contents($logFile, $logLine, FILE_APPEND);
        
        // 错误和严重错误同时输出到 error_log
        if (in_array($level, [self::LEVEL_ERROR, self::LEVEL_CRITICAL])) {
            error_log("[{$level}] {$message} " . json_encode($context, JSON_UNESCAPED_UNICODE));
        }
    }
    
    /**
     * 日志轮转
     */
    private static function rotateLog($logFile) {
        $baseName = basename($logFile, '.log');
        $dir = dirname($logFile);
        
        // 将当前日志文件重命名为带时间戳的文件
        $timestamp = date('YmdHis');
        $rotatedFile = $dir . '/' . $baseName . '_' . $timestamp . '.log';
        @rename($logFile, $rotatedFile);
        
        // 清理旧日志文件
        $files = glob($dir . '/' . $baseName . '_*.log');
        if (count($files) > self::$maxFiles) {
            usort($files, function($a, $b) {
                return filemtime($a) - filemtime($b);
            });
            
            $filesToDelete = array_slice($files, 0, count($files) - self::$maxFiles);
            foreach ($filesToDelete as $file) {
                @unlink($file);
            }
        }
    }
    
    /**
     * 调试日志
     */
    public static function debug($message, $context = []) {
        self::log(self::LEVEL_DEBUG, $message, $context);
    }
    
    /**
     * 信息日志
     */
    public static function info($message, $context = []) {
        self::log(self::LEVEL_INFO, $message, $context);
    }
    
    /**
     * 警告日志
     */
    public static function warning($message, $context = []) {
        self::log(self::LEVEL_WARNING, $message, $context);
    }
    
    /**
     * 错误日志
     */
    public static function error($message, $context = []) {
        self::log(self::LEVEL_ERROR, $message, $context);
    }
    
    /**
     * 严重错误日志
     */
    public static function critical($message, $context = []) {
        self::log(self::LEVEL_CRITICAL, $message, $context);
    }
}





