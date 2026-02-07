<?php
/**
 * 应用性能监控（APM）类
 * 记录请求耗时、数据库查询时间、内存使用等指标
 */
class APM {
    private static $startTime = null;
    private static $requestId = null;
    private static $metrics = [];
    
    /**
     * 开始监控请求
     */
    public static function start() {
        self::$startTime = microtime(true);
        self::$requestId = uniqid('req_', true);
        self::$metrics = [
            'request_id' => self::$requestId,
            'start_time' => self::$startTime,
            'memory_start' => memory_get_usage(true),
            'peak_memory_start' => memory_get_peak_usage(true),
            'database_queries' => 0,
            'database_time' => 0,
            'cache_hits' => 0,
            'cache_misses' => 0,
        ];
    }
    
    /**
     * 结束监控并记录指标
     */
    public static function end() {
        if (self::$startTime === null) {
            return null;
        }
        
        $endTime = microtime(true);
        $requestTime = $endTime - self::$startTime;
        
        // 获取数据库查询统计
        $dbStats = [];
        if (class_exists('Database')) {
            $dbStats = Database::getQueryStats();
        }
        
        // 获取缓存统计
        $cacheStats = ['hits' => 0, 'misses' => 0];
        if (class_exists('Cache')) {
            $cache = Cache::getInstance();
            $cacheStats = $cache->getStats();
        }
        
        self::$metrics['end_time'] = $endTime;
        self::$metrics['request_time'] = $requestTime;
        self::$metrics['memory_end'] = memory_get_usage(true);
        self::$metrics['peak_memory_end'] = memory_get_peak_usage(true);
        self::$metrics['memory_used'] = self::$metrics['memory_end'] - self::$metrics['memory_start'];
        self::$metrics['peak_memory_used'] = self::$metrics['peak_memory_end'] - self::$metrics['peak_memory_start'];
        self::$metrics['database_queries'] = $dbStats['total_queries'];
        self::$metrics['database_time'] = $dbStats['total_time'];
        self::$metrics['cache_hits'] = $cacheStats['hits'] ?? 0;
        self::$metrics['cache_misses'] = $cacheStats['misses'] ?? 0;
        self::$metrics['uri'] = $_SERVER['REQUEST_URI'] ?? 'unknown';
        self::$metrics['method'] = $_SERVER['REQUEST_METHOD'] ?? 'unknown';
        self::$metrics['ip'] = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        
        // 记录性能日志
        self::logMetrics();
        
        // 重置数据库查询统计
        if (class_exists('Database')) {
            Database::resetQueryStats();
        }
        
        return self::$metrics;
    }
    
    /**
     * 记录性能指标到日志
     */
    private static function logMetrics() {
        if (!class_exists('Logger')) {
            return;
        }
        
        $level = 'info';
        if (self::$metrics['request_time'] > 2.0) {
            $level = 'warning';
        } elseif (self::$metrics['request_time'] > 5.0) {
            $level = 'error';
        }
        
        Logger::log($level, 'Request performance', self::$metrics);
    }
    
    /**
     * 获取当前请求指标
     */
    public static function getMetrics() {
        return self::$metrics;
    }
    
    /**
     * 记录自定义指标
     */
    public static function recordMetric($name, $value) {
        self::$metrics['custom'][$name] = $value;
    }
    
    /**
     * 获取请求 ID
     */
    public static function getRequestId() {
        return self::$requestId;
    }
}

