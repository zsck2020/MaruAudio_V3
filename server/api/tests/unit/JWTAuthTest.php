<?php
/**
 * JWTAuth 类单元测试
 */
use PHPUnit\Framework\TestCase;

class JWTAuthTest extends TestCase {
    private $testPayload = [
        'user_id' => 1,
        'email' => 'test@example.com',
        'type' => 'user'
    ];
    
    public function testGenerateToken() {
        $token = JWTAuth::generate($this->testPayload);
        
        $this->assertNotEmpty($token);
        $this->assertStringContainsString('.', $token);
        
        $parts = explode('.', $token);
        $this->assertCount(3, $parts, 'JWT should have 3 parts');
    }
    
    public function testVerifyToken() {
        $token = JWTAuth::generate($this->testPayload);
        $payload = JWTAuth::verify($token);
        
        $this->assertNotFalse($payload);
        $this->assertEquals($this->testPayload['user_id'], $payload['user_id']);
        $this->assertEquals($this->testPayload['email'], $payload['email']);
    }
    
    public function testVerifyInvalidToken() {
        $invalidToken = 'invalid.token.here';
        $result = JWTAuth::verify($invalidToken);
        
        $this->assertFalse($result);
    }
    
    public function testTokenExpiration() {
        // 生成一个 1 秒后过期的 token
        $token = JWTAuth::generateToken($this->testPayload, 1);
        
        // 立即验证应该成功
        $payload = JWTAuth::verify($token);
        $this->assertNotFalse($payload);
        
        // 等待 2 秒后验证应该失败
        sleep(2);
        $payload = JWTAuth::verify($token);
        $this->assertFalse($payload);
    }
    
    public function testGenerateTokenWithCustomExpire() {
        $token1 = JWTAuth::generateToken($this->testPayload, 100);
        $token2 = JWTAuth::generateToken($this->testPayload, 200);
        
        $this->assertNotEquals($token1, $token2);
        
        $payload1 = JWTAuth::verify($token1);
        $payload2 = JWTAuth::verify($token2);
        
        $this->assertNotFalse($payload1);
        $this->assertNotFalse($payload2);
        
        // 验证过期时间不同
        $this->assertNotEquals($payload1['exp'], $payload2['exp']);
    }
}


