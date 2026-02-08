<?php
/**
 * Cache 类单元测试
 */
use PHPUnit\Framework\TestCase;

class CacheTest extends TestCase {
    private $cache;
    
    protected function setUp(): void {
        $this->cache = Cache::getInstance();
    }
    
    public function testGetInstance() {
        $instance1 = Cache::getInstance();
        $instance2 = Cache::getInstance();
        
        $this->assertSame($instance1, $instance2, 'Cache should be singleton');
    }
    
    public function testSetAndGet() {
        $key = 'test_key_' . time();
        $value = ['test' => 'data', 'number' => 123];
        
        $result = $this->cache->set($key, $value, 60);
        $this->assertTrue($result);
        
        $retrieved = $this->cache->get($key);
        $this->assertEquals($value, $retrieved);
        
        // 清理
        $this->cache->delete($key);
    }
    
    public function testGetDefault() {
        $value = $this->cache->get('non_existent_key', 'default');
        $this->assertEquals('default', $value);
    }
    
    public function testDelete() {
        $key = 'test_delete_' . time();
        $value = 'test_value';
        
        $this->cache->set($key, $value, 60);
        $this->assertTrue($this->cache->has($key));
        
        $this->cache->delete($key);
        $this->assertFalse($this->cache->has($key));
    }
    
    public function testHas() {
        $key = 'test_has_' . time();
        $value = 'test_value';
        
        $this->assertFalse($this->cache->has($key));
        
        $this->cache->set($key, $value, 60);
        $this->assertTrue($this->cache->has($key));
        
        $this->cache->delete($key);
    }
    
    public function testExpiration() {
        $key = 'test_expire_' . time();
        $value = 'test_value';
        
        $this->cache->set($key, $value, 1);
        $this->assertTrue($this->cache->has($key));
        
        sleep(2);
        $this->assertFalse($this->cache->has($key));
    }
    
    public function testIsRedisAvailable() {
        $isAvailable = $this->cache->isRedisAvailable();
        $this->assertIsBool($isAvailable);
    }
}


