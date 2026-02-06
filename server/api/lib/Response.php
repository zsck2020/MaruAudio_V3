<?php
/**
 * API 响应类
 * 统一错误处理和日志记录
 */
class Response {
    /**
     * 记录错误日志
     */
    private static function logError($code, $message, $data = null) {
        $env = getenv('MARUAUDIO_ENV') ?: (getenv('APP_ENV') ?: 'production');
        $isDev = $env === 'development';
        
        // 生产环境只记录严重错误，开发环境记录所有错误
        if ($isDev || $code >= 5000) {
            $logDir = sys_get_temp_dir() . '/maruaudio_logs';
            if (!is_dir($logDir)) {
                @mkdir($logDir, 0755, true);
            }
            
            $logFile = $logDir . '/api_errors_' . date('Y-m-d') . '.log';
            $logData = [
                'time' => date('Y-m-d H:i:s'),
                'code' => $code,
                'message' => $message,
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
                'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
                'data' => $data
            ];
            
            @file_put_contents($logFile, json_encode($logData, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND);
        }
    }
    
    public static function json($data, $code = 0, $message = 'success') {
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        
        // 记录错误日志
        if ($code !== 0) {
            self::logError($code, $message, $data);
        }
        
        echo json_encode([
            'code' => $code,
            'message' => $message,
            'data' => $data
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    public static function success($data = null, $message = 'success') {
        self::json($data, 0, $message);
    }
    
    public static function error($message, $code = 1001, $data = null) {
        // 生产环境隐藏敏感错误信息
        $env = getenv('MARUAUDIO_ENV') ?: (getenv('APP_ENV') ?: 'production');
        if ($env === 'production' && $code >= 5000) {
            $message = '服务器内部错误，请联系管理员';
        }
        
        self::json($data, $code, $message);
    }
}
