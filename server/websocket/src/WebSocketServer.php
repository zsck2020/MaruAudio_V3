<?php

namespace MaruAudio\WebSocket;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

/**
 * WebSocket 服务器核心类
 *
 * 职责：
 * - 管理所有 WebSocket 连接
 * - 维护用户/管理员与连接的映射关系
 * - 提供内部 API 可调用的推送方法（sendToUser / broadcastToUsers / notifyAdmins）
 */
class WebSocketServer implements MessageComponentInterface
{
    /**
     * 所有连接
     *
     * @var \SplObjectStorage<ConnectionInterface, array>
     */
    protected $clients;

    /**
     * 用户 ID => 连接列表
     *
     * @var array<int, ConnectionInterface[]>
     */
    protected $userConnections = [];

    /**
     * 管理员 ID => 连接列表
     *
     * @var array<int, ConnectionInterface[]>
     */
    protected $adminConnections = [];

    public function __construct()
    {
        $this->clients = new \SplObjectStorage();
    }

    /**
     * 有新的连接建立
     */
    public function onOpen(ConnectionInterface $conn)
    {
        $this->clients->attach($conn, [
            'user_id' => null,
            'admin_id' => null,
            'authorized' => false,
            'last_activity' => time(), // 记录最后活动时间
            'last_ping' => time(), // 记录最后ping时间
        ]);
    }

    /**
     * 收到客户端消息
     */
    public function onMessage(ConnectionInterface $from, $msg)
    {
        $meta = $this->clients[$from] ?? [
            'user_id' => null,
            'admin_id' => null,
            'authorized' => false,
        ];

        // 消息大小限制（防止DoS攻击）
        if (strlen($msg) > 65536) { // 64KB
            $from->send(json_encode([
                'type' => 'error',
                'message' => '消息过大',
            ], JSON_UNESCAPED_UNICODE));
            return;
        }

        $data = json_decode($msg, true);
        if (!is_array($data)) {
            // 非 JSON 消息直接忽略
            return;
        }

        $type = $data['type'] ?? '';
        
        // 验证消息类型
        if (!is_string($type) || strlen($type) > 50) {
            $from->send(json_encode([
                'type' => 'error',
                'message' => '无效的消息类型',
            ], JSON_UNESCAPED_UNICODE));
            return;
        }

        // 认证消息：{"type":"auth","token":"..."}
        if ($type === 'auth') {
            // 验证token格式
            if (empty($data['token']) || !is_string($data['token']) || strlen($data['token']) > 2048) {
                $from->send(json_encode([
                    'type' => 'error',
                    'message' => '无效的Token格式',
                ], JSON_UNESCAPED_UNICODE));
                return;
            }
            
            $payload = $this->verifyJwt($data['token']);
            if (!$payload) {
                $from->send(json_encode([
                    'type' => 'error',
                    'message' => '认证失败，Token 无效或已过期',
                ], JSON_UNESCAPED_UNICODE));
                return;
            }

            // 清理旧绑定
            $this->unbindConnection($from, $meta);

            if (!empty($payload['admin_id'])) {
                $adminId = (int)$payload['admin_id'];
                $meta['admin_id'] = $adminId;
                $meta['authorized'] = true;
                $this->adminConnections[$adminId][] = $from;
            } elseif (!empty($payload['user_id'])) {
                $userId = (int)$payload['user_id'];
                $meta['user_id'] = $userId;
                $meta['authorized'] = true;
                $this->userConnections[$userId][] = $from;
            } else {
                $from->send(json_encode([
                    'type' => 'error',
                    'message' => 'Token 中缺少用户信息',
                ], JSON_UNESCAPED_UNICODE));
                return;
            }

            // 更新最后活动时间
            $meta['last_activity'] = time();
            $meta['last_ping'] = time();
            $this->clients[$from] = $meta;

            $from->send(json_encode([
                'type' => 'auth_success',
                'role' => $meta['admin_id'] ? 'admin' : 'user',
            ], JSON_UNESCAPED_UNICODE));

            return;
        }

        // 心跳：{"type":"ping"}
        if ($type === 'ping') {
            // 更新最后活动时间和ping时间
            $meta['last_activity'] = time();
            $meta['last_ping'] = time();
            $this->clients[$from] = $meta;
            
            $from->send(json_encode(['type' => 'pong', 'timestamp' => time()]));
            return;
        }
        
        // 心跳响应：{"type":"pong"}
        if ($type === 'pong') {
            // 更新最后活动时间
            $meta['last_activity'] = time();
            $this->clients[$from] = $meta;
            return;
        }

        // 未认证连接只能发送auth和ping消息
        if (empty($meta['authorized'])) {
            $from->send(json_encode([
                'type' => 'error',
                'message' => '请先进行身份认证',
            ], JSON_UNESCAPED_UNICODE));
            return;
        }

        // 更新最后活动时间（对于所有已认证的消息）
        $meta['last_activity'] = time();
        $this->clients[$from] = $meta;
        
        // 管理员请求在线用户状态
        if ($type === 'user_status_request' && !empty($meta['admin_id'])) {
            $onlineUsers = [];
            foreach ($this->userConnections as $userId => $conns) {
                // 只统计仍有活跃连接的用户
                $activeConns = 0;
                foreach ($conns as $c) {
                    if ($this->isConnectionTracked($c)) {
                        $activeConns++;
                    }
                }
                if ($activeConns > 0) {
                    $onlineUsers[] = [
                        'user_id' => $userId,
                        'connections' => $activeConns,
                    ];
                }
            }
            $from->send(json_encode([
                'type' => 'user_status',
                'online_count' => count($onlineUsers),
                'users' => $onlineUsers,
            ], JSON_UNESCAPED_UNICODE));
            return;
        }

        // 其他业务消息目前只记录，不做处理，避免对现有客户端造成影响
        // 可以按需扩展，如聊天、在线状态上报等
    }
    
    /**
     * 清理超时连接（应在定时器中调用）
     * 连接超时时间：5分钟无活动则断开
     */
    public function cleanupTimeoutConnections(): void
    {
        $now = time();
        $timeout = 300; // 5分钟超时
        
        $toRemove = [];
        foreach ($this->clients as $conn) {
            $meta = $this->clients[$conn];
            $lastActivity = $meta['last_activity'] ?? 0;
            
            // 未认证连接：2分钟无活动则断开
            if (empty($meta['authorized'])) {
                if ($now - $lastActivity > 120) {
                    $toRemove[] = $conn;
                }
            } else {
                // 已认证连接：5分钟无活动则断开
                if ($now - $lastActivity > $timeout) {
                    $toRemove[] = $conn;
                }
            }
        }
        
        foreach ($toRemove as $conn) {
            try {
                $meta = $this->clients[$conn] ?? [];
                $this->unbindConnection($conn, $meta);
                $this->clients->detach($conn);
                $conn->close();
            } catch (\Throwable $e) {
                error_log('cleanupTimeoutConnections error: ' . $e->getMessage());
            }
        }
    }
    
    /**
     * 发送ping到所有连接（应在定时器中调用）
     * 用于检测死连接
     */
    public function pingAllConnections(): void
    {
        $now = time();
        $pingInterval = 60; // 每60秒ping一次
        
        foreach ($this->clients as $conn) {
            $meta = $this->clients[$conn];
            $lastPing = $meta['last_ping'] ?? 0;
            
            // 如果距离上次ping超过间隔时间，发送新的ping
            if ($now - $lastPing >= $pingInterval) {
                try {
                    $conn->send(json_encode(['type' => 'ping', 'timestamp' => $now]));
                    $meta['last_ping'] = $now;
                    $this->clients[$conn] = $meta;
                } catch (\Throwable $e) {
                    // 连接已断开，将在下次清理时移除
                    error_log('pingAllConnections error: ' . $e->getMessage());
                }
            }
        }
    }

    /**
     * 连接关闭
     */
    public function onClose(ConnectionInterface $conn)
    {
        if ($this->clients->contains($conn)) {
            $meta = $this->clients[$conn];
            $this->unbindConnection($conn, $meta);
            $this->clients->detach($conn);
        }
    }

    /**
     * 发生错误
     */
    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        error_log('WebSocket error: ' . $e->getMessage());

        if ($this->clients->contains($conn)) {
            $meta = $this->clients[$conn];
            $this->unbindConnection($conn, $meta);
            $this->clients->detach($conn);
        }

        $conn->close();
    }

    /**
     * 向指定用户推送消息（供内部 HTTP API 调用）
     */
    public function sendToUser(int $userId, array $payload): bool
    {
        if ($userId <= 0) {
            return false;
        }

        if (!isset($this->userConnections[$userId])) {
            return false;
        }

        $message = json_encode($payload, JSON_UNESCAPED_UNICODE);
        $success = false;

        foreach ($this->userConnections[$userId] as $conn) {
            if (!$this->isConnectionTracked($conn)) {
                continue;
            }
            try {
                $conn->send($message);
                $success = true;
            } catch (\Throwable $e) {
                error_log('sendToUser error: ' . $e->getMessage());
            }
        }

        return $success;
    }

    /**
     * 向所有已认证用户广播消息
     */
    public function broadcastToUsers(array $payload): void
    {
        $message = json_encode($payload, JSON_UNESCAPED_UNICODE);

        foreach ($this->clients as $conn) {
            $meta = $this->clients[$conn];
            if (!empty($meta['user_id']) && !empty($meta['authorized'])) {
                try {
                    $conn->send($message);
                } catch (\Throwable $e) {
                    error_log('broadcastToUsers error: ' . $e->getMessage());
                }
            }
        }
    }

    /**
     * 向所有已认证管理员推送消息
     */
    public function notifyAdmins(array $payload): void
    {
        $message = json_encode($payload, JSON_UNESCAPED_UNICODE);

        foreach ($this->clients as $conn) {
            $meta = $this->clients[$conn];
            if (!empty($meta['admin_id']) && !empty($meta['authorized'])) {
                try {
                    $conn->send($message);
                } catch (\Throwable $e) {
                    error_log('notifyAdmins error: ' . $e->getMessage());
                }
            }
        }
    }

    /**
     * 在线普通用户连接数
     */
    public function getOnlineUserCount(): int
    {
        $count = 0;
        foreach ($this->clients as $conn) {
            $meta = $this->clients[$conn];
            if (!empty($meta['user_id']) && !empty($meta['authorized'])) {
                $count++;
            }
        }
        return $count;
    }

    /**
     * 在线管理员连接数
     */
    public function getOnlineAdminCount(): int
    {
        $count = 0;
        foreach ($this->clients as $conn) {
            $meta = $this->clients[$conn];
            if (!empty($meta['admin_id']) && !empty($meta['authorized'])) {
                $count++;
            }
        }
        return $count;
    }

    /**
     * 从用户/管理员映射中解绑一个连接
     *
     * @param array<string,mixed> $meta
     */
    protected function unbindConnection(ConnectionInterface $conn, array $meta): void
    {
        if (!empty($meta['user_id'])) {
            $userId = (int)$meta['user_id'];
            if (isset($this->userConnections[$userId])) {
                $this->userConnections[$userId] = array_values(
                    array_filter(
                        $this->userConnections[$userId],
                        static function ($c) use ($conn) {
                            return $c !== $conn;
                        }
                    )
                );
                if (!$this->userConnections[$userId]) {
                    unset($this->userConnections[$userId]);
                }
            }
        }

        if (!empty($meta['admin_id'])) {
            $adminId = (int)$meta['admin_id'];
            if (isset($this->adminConnections[$adminId])) {
                $this->adminConnections[$adminId] = array_values(
                    array_filter(
                        $this->adminConnections[$adminId],
                        static function ($c) use ($conn) {
                            return $c !== $conn;
                        }
                    )
                );
                if (!$this->adminConnections[$adminId]) {
                    unset($this->adminConnections[$adminId]);
                }
            }
        }
    }

    /**
     * 检查一个连接是否仍然在 SplObjectStorage 中被追踪
     */
    protected function isConnectionTracked(ConnectionInterface $conn): bool
    {
        return $this->clients->contains($conn);
    }

    /**
     * 校验 JWT，并返回 payload
     *
     * 为了避免循环依赖，直接引入 API 中的 JWTAuth 类
     *
     * @return array<string,mixed>|false
     */
    protected function verifyJwt(string $token)
    {
        static $jwtLoaded = false;

        if (!$jwtLoaded) {
            $jwtPath = __DIR__ . '/../../api/lib/JWTAuth.php';
            if (is_file($jwtPath)) {
                require_once $jwtPath;
                $jwtLoaded = true;
            } else {
                error_log('JWTAuth.php not found: ' . $jwtPath);
                return false;
            }
        }

        if (!class_exists(\JWTAuth::class)) {
            error_log('JWTAuth class not found after include');
            return false;
        }

        try {
            /** @var array<string,mixed>|false $payload */
            $payload = \JWTAuth::verify($token);
            return $payload;
        } catch (\Throwable $e) {
            error_log('verifyJwt error: ' . $e->getMessage());
            return false;
        }
    }
}
