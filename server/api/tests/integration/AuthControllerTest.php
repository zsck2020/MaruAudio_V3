<?php
/**
 * AuthController 集成测试
 */
use PHPUnit\Framework\TestCase;

class AuthControllerTest extends TestCase {
    private $db;
    
    protected function setUp(): void {
        $this->db = Database::getInstance();
        // 清理测试数据
        $this->db->query('DELETE FROM users WHERE email LIKE ?', ['test_%']);
    }
    
    protected function tearDown(): void {
        // 清理测试数据
        $this->db->query('DELETE FROM users WHERE email LIKE ?', ['test_%']);
    }
    
    public function testRegister() {
        $email = 'test_' . time() . '@example.com';
        $password = 'Test123456';
        
        // 模拟请求
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $input = [
            'email' => $email,
            'password' => $password,
            'machine_code' => 'test_machine_' . time()
        ];
        
        // 由于 Response::success 会 exit，我们需要捕获输出
        ob_start();
        try {
            require_once __DIR__ . '/../../controllers/AuthController.php';
            AuthController::register($input);
        } catch (Exception $e) {
            // 如果抛出异常，检查是否是预期的 exit
            if (strpos($e->getMessage(), 'exit') === false) {
                throw $e;
            }
        }
        $output = ob_get_clean();
        
        // 验证用户是否创建
        $user = $this->db->fetch('SELECT * FROM users WHERE email = ?', [$email]);
        $this->assertNotFalse($user);
        $this->assertEquals($email, $user['email']);
    }
    
    public function testLogin() {
        // 先创建一个测试用户
        $email = 'test_login_' . time() . '@example.com';
        $password = 'Test123456';
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        $this->db->insert('users', [
            'email' => $email,
            'password' => $hashedPassword,
            'user_group' => 'trial',
            'register_time' => date('Y-m-d H:i:s'),
            'register_ip' => '127.0.0.1'
        ]);
        
        // 模拟登录请求
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $input = [
            'email' => $email,
            'password' => $password
        ];
        
        ob_start();
        try {
            require_once __DIR__ . '/../../controllers/AuthController.php';
            AuthController::login($input);
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'exit') === false) {
                throw $e;
            }
        }
        $output = ob_get_clean();
        
        // 验证返回了 token
        $this->assertNotEmpty($output);
        $response = json_decode($output, true);
        $this->assertNotNull($response);
        $this->assertEquals(0, $response['code']);
        $this->assertArrayHasKey('data', $response);
        $this->assertArrayHasKey('token', $response['data']);
    }
}


















