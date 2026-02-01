<?php
/**
 * 数据库连接类
 */
class Database {
    private static $instance = null;
    private $pdo;
    private static $queryCache = [];
    private static $cacheEnabled = true;
    
    private function __construct() {
        $config = require __DIR__ . '/../config/database.php';
        
        $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset={$config['charset']}";
        
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        $this->pdo = new PDO($dsn, $config['username'], $config['password'], $options);
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->pdo;
    }
    
    public function query($sql, $params = []) {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
    
    public function fetch($sql, $params = [], $useCache = false) {
        if ($useCache && self::$cacheEnabled) {
            $cacheKey = md5($sql . serialize($params));
            if (isset(self::$queryCache[$cacheKey])) {
                return self::$queryCache[$cacheKey];
            }
            $result = $this->query($sql, $params)->fetch();
            self::$queryCache[$cacheKey] = $result;
            return $result;
        }
        return $this->query($sql, $params)->fetch();
    }
    
    public function fetchAll($sql, $params = [], $useCache = false) {
        if ($useCache && self::$cacheEnabled) {
            $cacheKey = md5($sql . serialize($params));
            if (isset(self::$queryCache[$cacheKey])) {
                return self::$queryCache[$cacheKey];
            }
            $result = $this->query($sql, $params)->fetchAll();
            self::$queryCache[$cacheKey] = $result;
            return $result;
        }
        return $this->query($sql, $params)->fetchAll();
    }
    
    public static function clearCache() {
        self::$queryCache = [];
    }
    
    public function insert($table, $data) {
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));
        
        $sql = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";
        $this->query($sql, array_values($data));
        
        return $this->pdo->lastInsertId();
    }
    
    public function update($table, $data, $where, $whereParams = []) {
        $set = implode(' = ?, ', array_keys($data)) . ' = ?';
        $sql = "UPDATE {$table} SET {$set} WHERE {$where}";
        
        return $this->query($sql, array_merge(array_values($data), $whereParams))->rowCount();
    }
    
    public function beginTransaction() {
        return $this->pdo->beginTransaction();
    }
    
    public function commit() {
        return $this->pdo->commit();
    }
    
    public function rollback() {
        return $this->pdo->rollBack();
    }
}
