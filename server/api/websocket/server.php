<?php
/**
 * WebSocket 服务器
 * 用于实时推送用户信息变更
 * 
 * 启动命令: php server.php
 */

require __DIR__ . '/../vendor/autoload.php';

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use React\EventLoop\Loop;

class UserNotificationServer implements MessageComponentInterface
{
    protected $clients;
    protected $userConnections; // user_id => [connection, ...]
    
    public function __construct()
    {
        $this->clients = new \SplObjectStorage;
        $this->userConnections = [];
        echo "WebSocket 服务器已启动...\n";
    }
    
    public function onOpen(ConnectionInterface $conn)
    {
        $this->clients->attach($conn);
        echo "新连接: {$conn->resourceId}\n";
    }
    
    public function onMessage(ConnectionInterface $from, $msg)
    {
        $data = json_decode($msg, true);
        
        if (!$data) {
            return;
        }
        
        // 处理认证消息
        if (isset($data['type']) && $data['type'] === 'auth') {
            $userId = $data['user_id'] ?? null;
            $token = $data['token'] ?? null;
            
            if ($userId && $this->validateToken($userId, $token)) {
                // 绑定用户ID到连接
                $from->userId = $userId;
                
                if (!isset($this->userConnections[$userId])) {
                    $this->userConnections[$userId] = [];
                }
                $this->userConnections[$userId][] = $from;
                
                $from->send(json_encode([
                    'type' => 'auth_success',
                    'message' => '认证成功'
                ]));
                
                echo "用户 {$userId} 已认证\n";
            } else {
                $from->send(json_encode([
                    'type' => 'auth_failed',
                    'message' => '认证失败'
                ]));
            }
        }
        
        // 处理心跳
        if (isset($data['type']) && $data['type'] === 'ping') {
            $from->send(json_encode(['type' => 'pong']));
        }
    }
    
    public function onClose(ConnectionInterface $conn)
    {
        $this->clients->detach($conn);
        
        // 移除用户连接映射
        if (isset($conn->userId)) {
            $userId = $conn->userId;
            if (isset($this->userConnections[$userId])) {
                $this->userConnections[$userId] = array_filter(
                    $this->userConnections[$userId],
                    function($c) use ($conn) {
                        return $c !== $conn;
                    }
                );
                if (empty($this->userConnections[$userId])) {
                    unset($this->userConnections[$userId]);
                }
            }
        }
        
        echo "连接关闭: {$conn->resourceId}\n";
    }
    
    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        echo "错误: {$e->getMessage()}\n";
        $conn->close();
    }
    
    /**
     * 向指定用户推送消息
     */
    public function notifyUser($userId, $data)
    {
        if (isset($this->userConnections[$userId])) {
            $message = json_encode($data);
            foreach ($this->userConnections[$userId] as $conn) {
                $conn->send($message);
            }
            return true;
        }
        return false;
    }
    
    /**
     * 向所有用户广播消息
     */
    public function broadcast($data)
    {
        $message = json_encode($data);
        foreach ($this->clients as $client) {
            $client->send($message);
        }
    }
    
    /**
     * 验证 Token
     */
    protected function validateToken($userId, $token)
    {
        // 简单验证：检查 token 是否存在
        // 实际应该验证 JWT
        return !empty($token);
    }
}

// 创建服务器实例
$server = new UserNotificationServer();

// 使用 React 事件循环
$loop = Loop::get();

// 定时检查消息队列（每秒检查一次）
$queueDir = __DIR__ . '/queue';
if (!is_dir($queueDir)) {
    mkdir($queueDir, 0755, true);
}

$loop->addPeriodicTimer(1, function() use ($server, $queueDir) {
    // 检查用户通知队列
    $files = glob($queueDir . '/*.json');
    foreach ($files as $file) {
        $content = @file_get_contents($file);
        if ($content) {
            $data = json_decode($content, true);
            if ($data) {
                $filename = basename($file, '.json');
                if ($filename === 'broadcast') {
                    // 㲥Ϣ
                    $server->broadcast($data);
                    echo "㲥Ϣ: " . json_encode($data) . "\n";
                } else {
                    // 用户消息
                    $userId = (int)$filename;
                    if ($userId > 0) {
                        $server->notifyUser($userId, $data);
                        echo "推送给用户 {$userId}: " . json_encode($data) . "\n";
                    }
                }
            }
            @unlink($file);
        }
    }
});

// 启动 WebSocket 服务器
$wsServer = new Ratchet\Server\IoServer(
    new HttpServer(
        new WsServer($server)
    ),
    new React\Socket\SocketServer('0.0.0.0:8080', [], $loop),
    $loop
);

echo "WebSocket 服务器运行在 ws://0.0.0.0:8080\n";
echo "消息队列目录: {$queueDir}\n";
$loop->run();
