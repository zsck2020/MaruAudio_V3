<?php
/**
 * UserController 集成测试
 */
use PHPUnit\Framework\TestCase;

class UserControllerTest extends TestCase {
    private $db;
    private $testUserId;
    private $testToken;
    
    protected function setUp(): void {
        $this->db = Database::getInstance();
        
        // 创建测试用户
        $email = 'test_user_' . time() . '@example.com';
        $password = password_hash('Test123456', PASSWORD_DEFAULT);
        
        $this->testUserId = $this->db->insert('users', [
            'email' => $email,
            'password' => $password,
            'user_group' => 'trial',
            'register_time' => date('Y-m-d H:i:s'),
            'register_ip' => '127.0.0.1'
        ]);
        
        // 生成测试 token
        $payload = [
            'user_id' => $this->testUserId,
            'email' => $email,
            'type' => 'user'
        ];
        $this->testToken = JWTAuth::generate($payload);
    }
    
    protected function tearDown(): void {
        if ($this->testUserId) {
            $this->db->query('DELETE FROM users WHERE id = ?', [$this->testUserId]);
        }
    }
    
    public function testInfo() {
        // 模拟请求头
        $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . $this->testToken;
        
        ob_start();
        try {
            require_once __DIR__ . '/../../controllers/UserController.php';
            UserController::info();
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'exit') === false) {
                throw $e;
            }
        }
        $output = ob_get_clean();
        
        $this->assertNotEmpty($output);
        $response = json_decode($output, true);
        $this->assertNotNull($response);
        $this->assertEquals(0, $response['code']);
        $this->assertArrayHasKey('data', $response);
        $this->assertArrayHasKey('email', $response['data']);
    }
}


