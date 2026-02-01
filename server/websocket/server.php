<?php
/**
 * MaruAudio WebSocket 服务器入口
 * 
 * 启动命令: php server.php
 * 默认端口: 8080 (WebSocket), 8081 (内部 API)
 */

require __DIR__ . '/vendor/autoload.php';

use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use MaruAudio\WebSocket\WebSocketServer;
use React\EventLoop\Factory;
use React\Socket\Server as ReactServer;
use React\Http\Server as HttpServerReact;
use Psr\Http\Message\ServerRequestInterface;

// 配置
$wsPort = getenv('WS_PORT') ?: 8080;
$internalPort = getenv('INTERNAL_PORT') ?: 8081;

echo "===========================================\n";
echo "MaruAudio WebSocket Server\n";
echo "===========================================\n";
echo "WebSocket Port: {$wsPort}\n";
echo "Internal API Port: {$internalPort}\n";
echo "===========================================\n\n";

// 创建事件循环
$loop = Factory::create();

// 创建 WebSocket 服务器
$wsServer = new WebSocketServer();

// WebSocket 服务
$webSocket = new ReactServer("0.0.0.0:{$wsPort}", $loop);
$wsServerInstance = new IoServer(
    new HttpServer(
        new WsServer($wsServer)
    ),
    $webSocket,
    $loop
);

echo "WebSocket server started on ws://0.0.0.0:{$wsPort}\n";

// 内部 HTTP API（用于 PHP API 触发推送）
$internalServer = new ReactServer("127.0.0.1:{$internalPort}", $loop);
$httpServer = new HttpServerReact(function (ServerRequestInterface $request) use ($wsServer) {
    $path = $request->getUri()->getPath();
    
    if ($path !== '/internal') {
        return new \React\Http\Message\Response(404, [], 'Not Found');
    }
    
    $body = (string) $request->getBody();
    $data = json_decode($body, true);
    
    if (!$data || !isset($data['action'])) {
        return new \React\Http\Message\Response(400, [], 'Invalid request');
    }
    
    $result = ['success' => false];
    
    switch ($data['action']) {
        case 'push_to_user':
            $userId = $data['user_id'] ?? 0;
            $event = $data['event'] ?? '';
            $eventData = $data['data'] ?? [];
            
            $result['success'] = $wsServer->sendToUser($userId, [
                'type' => $event,
                'data' => $eventData,
                'timestamp' => time()
            ]);
            break;
            
        case 'broadcast':
            $event = $data['event'] ?? '';
            $eventData = $data['data'] ?? [];
            
            $wsServer->broadcastToUsers([
                'type' => $event,
                'data' => $eventData,
                'timestamp' => time()
            ]);
            $result['success'] = true;
            break;
            
        case 'notify_admin':
            $event = $data['event'] ?? '';
            $eventData = $data['data'] ?? [];
            
            $wsServer->notifyAdmins([
                'type' => $event,
                'data' => $eventData,
                'timestamp' => time()
            ]);
            $result['success'] = true;
            break;
            
        case 'status':
            $result = [
                'success' => true,
                'online_users' => $wsServer->getOnlineUserCount(),
                'online_admins' => $wsServer->getOnlineAdminCount()
            ];
            break;
            
        default:
            return new \React\Http\Message\Response(400, [], 'Unknown action');
    }
    
    return new \React\Http\Message\Response(
        200,
        ['Content-Type' => 'application/json'],
        json_encode($result)
    );
});

$httpServer->listen($internalServer);
echo "Internal API server started on http://127.0.0.1:{$internalPort}\n";

echo "\nServer is running. Press Ctrl+C to stop.\n\n";

// 运行事件循环
$loop->run();
