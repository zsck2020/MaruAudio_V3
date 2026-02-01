<?php
/**
 * JWT 认证类
 */
class JWTAuth {
    private static $secret;
    private static $expire;
    
    public static function init() {
        $config = require __DIR__ . '/../config/app.php';
        self::$secret = $config['jwt_secret'];
        self::$expire = $config['jwt_expire'];
    }
    
    public static function generate($payload) {
        self::init();
        
        $header = self::base64UrlEncode(json_encode([
            'typ' => 'JWT',
            'alg' => 'HS256'
        ]));
        
        $payload['iat'] = time();
        $payload['exp'] = time() + self::$expire;
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));
        
        $signature = self::base64UrlEncode(
            hash_hmac('sha256', "{$header}.{$payloadEncoded}", self::$secret, true)
        );
        
        return "{$header}.{$payloadEncoded}.{$signature}";
    }
    
    public static function verify($token) {
        self::init();
        
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }
        
        list($header, $payload, $signature) = $parts;
        
        $expectedSignature = self::base64UrlEncode(
            hash_hmac('sha256', "{$header}.{$payload}", self::$secret, true)
        );
        
        if (!hash_equals($expectedSignature, $signature)) {
            return false;
        }
        
        $payloadData = json_decode(self::base64UrlDecode($payload), true);
        
        if (isset($payloadData['exp']) && $payloadData['exp'] < time()) {
            return false;
        }
        
        return $payloadData;
    }
    
    public static function getPayloadFromRequest() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        
        if (preg_match('/Bearer\s+(.+)/', $authHeader, $matches)) {
            return self::verify($matches[1]);
        }
        
        return false;
    }
    
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    private static function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
