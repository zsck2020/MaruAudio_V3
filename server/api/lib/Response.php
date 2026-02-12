<?php
/**
 * API 响应类
 */
class Response {
    public static function json($data, $code = 0, $message = 'success') {
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        
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
        self::json($data, $code, $message);
    }
}
