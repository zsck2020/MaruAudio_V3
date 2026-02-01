<?php
/**
 * WebSocket 通知触发器
 * 用于从 API 触发 WebSocket 推送
 * 
 * 使用方法：
 * require_once 'websocket/notify.php';
 * WebSocketNotify::userUpdated($userId);
 */

class WebSocketNotify
{
    private static $wsHost = '127.0.0.1';
    private static $wsPort = 8080;
    
    /**
     * 通知用户信息已更新
     */
    public static function userUpdated($userId, $data = [])
    {
        return self::sendToUser($userId, [
            'type' => 'user_updated',
            'data' => $data,
            'timestamp' => time()
        ]);
    }
    
    /**
     * 通知系统配置已更新
     */
    public static function configUpdated($key = null)
    {
        return self::broadcast([
            'type' => 'config_updated',
            'key' => $key,
            'timestamp' => time()
        ]);
    }
    
    /**
     * 向指定用户发送消息
     */
    private static function sendToUser($userId, $data)
    {
        // 通过内部 HTTP 接口触发 WebSocket 推送
        // 这里使用文件作为消息队列（简单方案）
        $queueFile = __DIR__ . '/queue/' . $userId . '.json';
        $queueDir = __DIR__ . '/queue';
        
        if (!is_dir($queueDir)) {
            mkdir($queueDir, 0755, true);
        }
        
        file_put_contents($queueFile, json_encode($data));
        return true;
    }
    
    /**
     * 广播消息给所有用户
     */
    private static function broadcast($data)
    {
        $queueFile = __DIR__ . '/queue/broadcast.json';
        $queueDir = __DIR__ . '/queue';
        
        if (!is_dir($queueDir)) {
            mkdir($queueDir, 0755, true);
        }
        
        file_put_contents($queueFile, json_encode($data));
        return true;
    }
}
