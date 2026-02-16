<?php
/**
 * 安全辅助类
 * 提供请求签名、授权码、Token刷新等安全功能
 */
class SecurityHelper {
    
    // 签名密钥（从环境变量读取）
    private static $signatureKey = null;
    
    private static function getSignatureKey() {
        if (self::$signatureKey === null) {
            self::$signatureKey = getenv('MARUAUDIO_SIGNATURE_KEY') ?: 'MaruAudio_Signature_Key_2024_Secure';
        }
        return self::$signatureKey;
    }
    
    // 授权码有效期（秒）
    private static $authCodeExpiry = 300; // 5分钟
    
    // 请求时间戳容差（秒）
    private static $timestampTolerance = 300; // 5分钟
    
    /**
     * 生成 TTS 授权码
     * @param int $userId 用户ID
     * @param int $characters 消耗字符数
     * @param int $logId 消耗日志ID
     * @return string 授权码
     */
    public static function generateAuthCode($userId, $characters, $logId) {
        $timestamp = time();
        $data = [
            'user_id' => $userId,
            'characters' => $characters,
            'log_id' => $logId,
            'timestamp' => $timestamp,
            'expires' => $timestamp + self::$authCodeExpiry
        ];
        
        // 生成签名
        $payload = json_encode($data);
        $signature = hash_hmac('sha256', $payload, self::getSignatureKey());
        
        // 返回 Base64 编码的授权码
        return base64_encode($payload . '.' . $signature);
    }
    
    /**
     * 验证 TTS 授权码
     * @param string $authCode 授权码
     * @return array|false 验证成功返回数据，失败返回 false
     */
    public static function verifyAuthCode($authCode) {
        try {
            $decoded = base64_decode($authCode);
            if (!$decoded) {
                return false;
            }
            
            $parts = explode('.', $decoded, 2);
            if (count($parts) !== 2) {
                return false;
            }
            
            list($payload, $signature) = $parts;
            
            // 验证签名
            $expectedSignature = hash_hmac('sha256', $payload, self::getSignatureKey());
            if (!hash_equals($expectedSignature, $signature)) {
                return false;
            }
            
            // 解析数据
            $data = json_decode($payload, true);
            if (!$data) {
                return false;
            }
            
            // 检查是否过期
            if (time() > $data['expires']) {
                return false;
            }
            
            return $data;
            
        } catch (Exception $e) {
            return false;
        }
    }
    
    /**
     * 生成请求签名
     * @param array $params 请求参数
     * @param int $timestamp 时间戳
     * @param string $token 用户Token
     * @return string 签名
     */
    public static function generateSignature($params, $timestamp, $token) {
        // 参数排序
        ksort($params);
        
        // 构建签名字符串
        $signStr = '';
        foreach ($params as $key => $value) {
            if ($key !== 'signature' && $key !== 'sign') {
                $signStr .= $key . '=' . $value . '&';
            }
        }
        $signStr .= 'timestamp=' . $timestamp . '&token=' . substr($token, 0, 32);
        
        return hash_hmac('sha256', $signStr, self::getSignatureKey());
    }
    
    /**
     * 验证请求签名
     * @param array $params 请求参数
     * @param string $signature 签名
     * @param int $timestamp 时间戳
     * @param string $token 用户Token
     * @return bool 是否有效
     */
    public static function verifySignature($params, $signature, $timestamp, $token) {
        // 检查时间戳
        if (abs(time() - $timestamp) > self::$timestampTolerance) {
            return false;
        }
        
        // 生成预期签名
        $expectedSignature = self::generateSignature($params, $timestamp, $token);
        
        return hash_equals($expectedSignature, $signature);
    }
    
    /**
     * 验证请求时间戳（防重放）
     * @param int $timestamp 请求时间戳
     * @return bool 是否有效
     */
    public static function verifyTimestamp($timestamp) {
        return abs(time() - $timestamp) <= self::$timestampTolerance;
    }
    
    /**
     * 检查授权码是否已使用（防重放）
     * @param string $authCode 授权码
     * @return bool 是否已使用
     */
    public static function isAuthCodeUsed($authCode) {
        $db = Database::getInstance();
        $hash = hash('sha256', $authCode);
        
        $result = $db->fetch(
            "SELECT id FROM used_auth_codes WHERE code_hash = ?",
            [$hash]
        );
        
        return $result !== false;
    }
    
    /**
     * 标记授权码已使用
     * @param string $authCode 授权码
     * @param int $userId 用户ID
     */
    public static function markAuthCodeUsed($authCode, $userId) {
        $db = Database::getInstance();
        $hash = hash('sha256', $authCode);
        
        try {
            $db->insert('used_auth_codes', [
                'code_hash' => $hash,
                'user_id' => $userId,
                'used_at' => date('Y-m-d H:i:s')
            ]);
        } catch (Exception $e) {
            // 忽略重复插入错误
        }
    }
    
    /**
     * 清理过期的已使用授权码
     */
    public static function cleanupExpiredAuthCodes() {
        $db = Database::getInstance();
        $expireTime = date('Y-m-d H:i:s', time() - 3600); // 1小时前
        
        $db->query(
            "DELETE FROM used_auth_codes WHERE used_at < ?",
            [$expireTime]
        );
    }
    
    /**
     * 生成 Refresh Token
     * @param int $userId 用户ID
     * @return string Refresh Token
     */
    public static function generateRefreshToken($userId) {
        $data = [
            'user_id' => $userId,
            'type' => 'refresh',
            'created' => time(),
            'expires' => time() + 7 * 24 * 3600, // 7天有效
            'random' => bin2hex(random_bytes(16))
        ];
        
        $payload = json_encode($data);
        $signature = hash_hmac('sha256', $payload, self::getSignatureKey());
        
        return base64_encode($payload . '.' . $signature);
    }
    
    /**
     * 验证 Refresh Token
     * @param string $refreshToken Refresh Token
     * @return array|false 验证成功返回数据，失败返回 false
     */
    public static function verifyRefreshToken($refreshToken) {
        try {
            $decoded = base64_decode($refreshToken);
            if (!$decoded) {
                return false;
            }
            
            $parts = explode('.', $decoded, 2);
            if (count($parts) !== 2) {
                return false;
            }
            
            list($payload, $signature) = $parts;
            
            // 验证签名
            $expectedSignature = hash_hmac('sha256', $payload, self::getSignatureKey());
            if (!hash_equals($expectedSignature, $signature)) {
                return false;
            }
            
            // 解析数据
            $data = json_decode($payload, true);
            if (!$data || $data['type'] !== 'refresh') {
                return false;
            }
            
            // 检查是否过期
            if (time() > $data['expires']) {
                return false;
            }
            
            return $data;
            
        } catch (Exception $e) {
            return false;
        }
    }
}
