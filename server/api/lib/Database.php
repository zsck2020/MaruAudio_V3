<?php
/**
 * 数据库连接类
 * 支持 Redis 缓存和性能监控
 */
class Database {
    private static $instance = null;
    private $pdo;
    private $cache = null;
    private static $queryCache = [];
    private static $cacheEnabled = true;
    private static $queryTimes = [];
    
    private function __construct() {
        $config = require __DIR__ . '/../config/database.php';
        
        $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset={$config['charset']}";
        
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        $this->pdo = new PDO($dsn, $config['username'], $config['password'], $options);
        
        // 初始化缓存
        require_once __DIR__ . '/Cache.php';
        $this->cache = Cache::getInstance();
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
        $startTime = microtime(true);
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $queryTime = microtime(true) - $startTime;
        
        // 记录查询时间（用于性能监控）
        self::$queryTimes[] = [
            'sql' => $sql,
            'time' => $queryTime,
            'params' => $params
        ];
        
        // 记录慢查询（超过 1 秒）
        if ($queryTime > 1.0) {
            require_once __DIR__ . '/Logger.php';
            Logger::warning('Slow query detected', [
                'sql' => $sql,
                'time' => $queryTime,
                'params' => $params
            ]);
        }
        
        return $stmt;
    }
    
    public function fetch($sql, $params = [], $useCache = false, $cacheTtl = 3600) {
        if ($useCache && self::$cacheEnabled) {
            $cacheKey = 'db_query:' . md5($sql . serialize($params));
            
            // 尝试从 Redis/文件缓存获取
            $cached = $this->cache->get($cacheKey);
            if ($cached !== null) {
                return $cached;
            }
            
            // 尝试从内存缓存获取
            $memoryKey = md5($sql . serialize($params));
            if (isset(self::$queryCache[$memoryKey])) {
                return self::$queryCache[$memoryKey];
            }
            
            // 执行查询
            $result = $this->query($sql, $params)->fetch();
            
            // 存储到缓存
            $this->cache->set($cacheKey, $result, $cacheTtl);
            self::$queryCache[$memoryKey] = $result;
            
            return $result;
        }
        return $this->query($sql, $params)->fetch();
    }
    
    public function fetchAll($sql, $params = [], $useCache = false, $cacheTtl = 3600) {
        if ($useCache && self::$cacheEnabled) {
            $cacheKey = 'db_query:' . md5($sql . serialize($params));
            
            // 尝试从 Redis/文件缓存获取
            $cached = $this->cache->get($cacheKey);
            if ($cached !== null) {
                return $cached;
            }
            
            // 尝试从内存缓存获取
            $memoryKey = md5($sql . serialize($params));
            if (isset(self::$queryCache[$memoryKey])) {
                return self::$queryCache[$memoryKey];
            }
            
            // 执行查询
            $result = $this->query($sql, $params)->fetchAll();
            
            // 存储到缓存
            $this->cache->set($cacheKey, $result, $cacheTtl);
            self::$queryCache[$memoryKey] = $result;
            
            return $result;
        }
        return $this->query($sql, $params)->fetchAll();
    }
    
    public static function clearCache() {
        self::$queryCache = [];
        if (self::$instance && self::$instance->cache) {
            self::$instance->cache->clear();
        }
    }
    
    /**
     * 获取查询性能统计
     */
    public static function getQueryStats() {
        $totalQueries = count(self::$queryTimes);
        $totalTime = array_sum(array_column(self::$queryTimes, 'time'));
        $avgTime = $totalQueries > 0 ? $totalTime / $totalQueries : 0;
        $slowQueries = array_filter(self::$queryTimes, function($q) {
            return $q['time'] > 1.0;
        });
        
        return [
            'total_queries' => $totalQueries,
            'total_time' => $totalTime,
            'avg_time' => $avgTime,
            'slow_queries' => count($slowQueries),
            'queries' => self::$queryTimes
        ];
    }
    
    /**
     * 重置查询统计
     */
    public static function resetQueryStats() {
        self::$queryTimes = [];
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
