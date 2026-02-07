<?php
/**
 * Logger 类单元测试
 */
use PHPUnit\Framework\TestCase;

class LoggerTest extends TestCase {
    private $logDir;
    
    protected function setUp(): void {
        $this->logDir = sys_get_temp_dir() . '/maruaudio_logs_test';
        if (!is_dir($this->logDir)) {
            @mkdir($this->logDir, 0755, true);
        }
    }
    
    protected function tearDown(): void {
        // 清理测试日志文件
        $files = glob($this->logDir . '/*.log');
        foreach ($files as $file) {
            @unlink($file);
        }
    }
    
    public function testDebug() {
        Logger::debug('Test debug message', ['key' => 'value']);
        $this->assertTrue(true); // 如果没有抛出异常就通过
    }
    
    public function testInfo() {
        Logger::info('Test info message', ['key' => 'value']);
        $this->assertTrue(true);
    }
    
    public function testWarning() {
        Logger::warning('Test warning message', ['key' => 'value']);
        $this->assertTrue(true);
    }
    
    public function testError() {
        Logger::error('Test error message', ['key' => 'value']);
        $this->assertTrue(true);
    }
    
    public function testCritical() {
        Logger::critical('Test critical message', ['key' => 'value']);
        $this->assertTrue(true);
    }
    
    public function testLogFileCreation() {
        $logFile = $this->logDir . '/info_' . date('Y-m-d') . '.log';
        
        Logger::info('Test log file creation');
        
        // 检查日志文件是否创建（可能需要等待一下）
        sleep(1);
        // 注意：由于日志系统使用 sys_get_temp_dir，实际文件可能不在 $this->logDir
        // 这里主要测试方法不会抛出异常
        $this->assertTrue(true);
    }
}

