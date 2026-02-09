<?php
/**
 * Database 类单元测试
 */
use PHPUnit\Framework\TestCase;

class DatabaseTest extends TestCase {
    private $db;
    
    protected function setUp(): void {
        $this->db = Database::getInstance();
    }
    
    public function testGetInstance() {
        $instance1 = Database::getInstance();
        $instance2 = Database::getInstance();
        
        $this->assertSame($instance1, $instance2, 'Database should be singleton');
    }
    
    public function testGetConnection() {
        $pdo = $this->db->getConnection();
        $this->assertInstanceOf(PDO::class, $pdo);
    }
    
    public function testQuery() {
        $stmt = $this->db->query('SELECT 1 as test');
        $result = $stmt->fetch();
        
        $this->assertEquals(1, $result['test']);
    }
    
    public function testFetch() {
        $result = $this->db->fetch('SELECT 1 as test');
        $this->assertEquals(1, $result['test']);
    }
    
    public function testFetchAll() {
        $results = $this->db->fetchAll('SELECT 1 as test UNION SELECT 2 as test');
        $this->assertCount(2, $results);
    }
    
    public function testQueryStats() {
        Database::resetQueryStats();
        
        $this->db->query('SELECT 1');
        $this->db->query('SELECT 2');
        
        $stats = Database::getQueryStats();
        $this->assertEquals(2, $stats['total_queries']);
        $this->assertGreaterThan(0, $stats['total_time']);
    }
    
    public function testClearCache() {
        Database::clearCache();
        $this->assertTrue(true); // 如果没抛出异常就通过
    }
}






