<?php
/**
 * Response 类单元测试
 */
use PHPUnit\Framework\TestCase;

class ResponseTest extends TestCase {
    public function testSuccess() {
        ob_start();
        try {
            Response::success(['test' => 'data'], 'Test message');
        } catch (Exception $e) {
            // Response::success 会 exit，这里捕获异常
        }
        $output = ob_get_clean();
        
        $this->assertNotEmpty($output);
        $response = json_decode($output, true);
        $this->assertNotNull($response);
        $this->assertEquals(0, $response['code']);
        $this->assertEquals('Test message', $response['message']);
        $this->assertEquals(['test' => 'data'], $response['data']);
    }
    
    public function testError() {
        ob_start();
        try {
            Response::error('Test error', 1001);
        } catch (Exception $e) {
            // Response::error 会 exit
        }
        $output = ob_get_clean();
        
        $this->assertNotEmpty($output);
        $response = json_decode($output, true);
        $this->assertNotNull($response);
        $this->assertEquals(1001, $response['code']);
        $this->assertEquals('Test error', $response['message']);
    }
    
    public function testJson() {
        ob_start();
        try {
            Response::json(['test' => 'data'], 0, 'success');
        } catch (Exception $e) {
            // Response::json 会 exit
        }
        $output = ob_get_clean();
        
        $this->assertNotEmpty($output);
        $response = json_decode($output, true);
        $this->assertNotNull($response);
        $this->assertArrayHasKey('code', $response);
        $this->assertArrayHasKey('message', $response);
        $this->assertArrayHasKey('data', $response);
    }
}





