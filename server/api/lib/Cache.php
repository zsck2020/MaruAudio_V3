<?php
/**
 * Redis 缓存类
 * 支持 Redis 和文件缓存降级
 */
class Cache {
    private static $instance = null;
    private $redis = null;
    private $useRedis = false;
    private $fallbackDir = null;
    
    private function __construct() {
        $this->fallbackDir = sys_get_temp_dir() . '/maruaudio_cache';
        if (!is_dir($this->fallbackDir)) {
            @mkdir($this->fallbackDir, 0755, true);
        }
        
        // 尝试连接 Redis
        $redisHost = getenv('REDIS_HOST') ?: '127.0.0.1';
        $redisPort = (int)(getenv('REDIS_PORT') ?: 6379);
        $redisPassword = getenv('REDIS_PASSWORD') ?: null;
        $redisDatabase = (int)(getenv('REDIS_DATABASE') ?: 0);
        
        if (class_exists('Redis')) {
            try {
                $this->redis = new Redis();
                $connected = $this->redis->connect($redisHost, $redisPort, 1);
                if ($connected) {
                    if ($redisPassword) {
                        $this->redis->auth($redisPassword);
                    }
                    $this->redis->select($redisDatabase);
                    $this->useRedis = true;
                }
            } catch (Exception $e) {
                error_log('Redis connection failed: ' . $e->getMessage());
                $this->redis = null;
            }
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * 获取缓存
     */
    public function get($key, $default = null) {
        if ($this->useRedis && $this->redis) {
            try {
                $value = $this->redis->get($key);
                if ($value !== false) {
                    $this->recordHit();
                    return json_decode($value, true);
                }
            } catch (Exception $e) {
                error_log('Redis get error: ' . $e->getMessage());
            }
        }
        
        // 降级到文件缓存
        $file = $this->fallbackDir . '/' . md5($key) . '.json';
        if (file_exists($file)) {
            $data = json_decode(file_get_contents($file), true);
            if ($data && isset($data['expire']) && $data['expire'] > time()) {
                $this->recordHit();
                return $data['value'];
            } else {
                @unlink($file);
            }
        }
        
        $this->recordMiss();
        return $default;
    }
    
    /**
     * 设置缓存
     */
    public function set($key, $value, $ttl = 3600) {
        if ($this->useRedis && $this->redis) {
            try {
                $serialized = json_encode($value, JSON_UNESCAPED_UNICODE);
                return $this->redis->setex($key, $ttl, $serialized);
            } catch (Exception $e) {
                error_log('Redis set error: ' . $e->getMessage());
            }
        }
        
        // 降级到文件缓存
        $file = $this->fallbackDir . '/' . md5($key) . '.json';
        $data = [
            'value' => $value,
            'expire' => time() + $ttl
        ];
        @file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE));
        
        return true;
    }
    
    /**
     * 删除缓存
     */
    public function delete($key) {
        if ($this->useRedis && $this->redis) {
            try {
                return $this->redis->del($key);
            } catch (Exception $e) {
                error_log('Redis delete error: ' . $e->getMessage());
            }
        }
        
        // 降级到文件缓存
        $file = $this->fallbackDir . '/' . md5($key) . '.json';
        if (file_exists($file)) {
            @unlink($file);
        }
        
        return true;
    }
    
    /**
     * 清空所有缓存
     */
    public function clear() {
        if ($this->useRedis && $this->redis) {
            try {
                return $this->redis->flushDB();
            } catch (Exception $e) {
                error_log('Redis flush error: ' . $e->getMessage());
            }
        }
        
        // 降级到文件缓存
        $files = glob($this->fallbackDir . '/*.json');
        foreach ($files as $file) {
            @unlink($file);
        }
        
        return true;
    }
    
    /**
     * 检查键是否存在
     */
    public function has($key) {
        if ($this->useRedis && $this->redis) {
            try {
                return $this->redis->exists($key);
            } catch (Exception $e) {
                error_log('Redis exists error: ' . $e->getMessage());
            }
        }
        
        // 降级到文件缓存
        $file = $this->fallbackDir . '/' . md5($key) . '.json';
        if (file_exists($file)) {
            $data = json_decode(file_get_contents($file), true);
            if ($data && isset($data['expire']) && $data['expire'] > time()) {
                return true;
            } else {
                @unlink($file);
            }
        }
        
        return false;
    }
    
    /**
     * 获取 Redis 连接状态
     */
    public function isRedisAvailable() {
        return $this->useRedis && $this->redis !== null;
    }
    
    private static $stats = ['hits' => 0, 'misses' => 0];
    
    /**
     * 获取缓存统计信息
     */
    public function getStats() {
        return self::$stats;
    }
    
    /**
     * 记录缓存命中
     */
    private function recordHit() {
        self::$stats['hits']++;
    }
    
    /**
     * 记录缓存未命中
     */
    private function recordMiss() {
        self::$stats['misses']++;
    }
    
    /**
     * 重置统计信息
     */
    public function resetStats() {
        self::$stats = ['hits' => 0, 'misses' => 0];
    }
}

