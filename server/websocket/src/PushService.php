<?php
/**
 * 推送服务 - 用于 PHP API 触发 WebSocket 推送
 */
namespace MaruAudio\WebSocket;

class PushService
{
    protected $wsHost;
    protected $wsPort;
    
    public function __construct(string $host = '127.0.0.1', int $port = 8081)
    {
        $this->wsHost = $host;
        $this->wsPort = $port;
    }
    
    /**
     * 向指定用户推送消息
     */
    public function pushToUser(int $userId, string $event, array $data = []): bool
    {
        return $this->sendToInternalApi([
            'action' => 'push_to_user',
            'user_id' => $userId,
            'event' => $event,
            'data' => $data
        ]);
    }
    
    /**
     * 向所有用户广播消息
     */
    public function broadcast(string $event, array $data = []): bool
    {
        return $this->sendToInternalApi([
            'action' => 'broadcast',
            'event' => $event,
            'data' => $data
        ]);
    }
    
    /**
     * 通知管理后台
     */
    public function notifyAdmin(string $event, array $data = []): bool
    {
        return $this->sendToInternalApi([
            'action' => 'notify_admin',
            'event' => $event,
            'data' => $data
        ]);
    }
    
    /**
     * 用户状态变更通知
     */
    public function userStatusChanged(int $userId, array $newStatus): bool
    {
        // 通知用户
        $this->pushToUser($userId, 'status_changed', $newStatus);
        
        // 通知管理后台
        $this->notifyAdmin('user_status_changed', [
            'user_id' => $userId,
            'status' => $newStatus
        ]);
        
        return true;
    }
    
    /**
     * 会员到期通知
     */
    public function membershipExpired(int $userId): bool
    {
        return $this->pushToUser($userId, 'membership_expired', [
            'message' => '您的会员已到期，已自动降级为免费用户',
            'timestamp' => time()
        ]);
    }
    
    /**
     * 系统公告推送
     */
    public function systemAnnouncement(string $title, string $content, string $type = 'info'): bool
    {
        return $this->broadcast('system_announcement', [
            'title' => $title,
            'content' => $content,
            'type' => $type,
            'timestamp' => time()
        ]);
    }
    
    /**
     * 发送到内部 API
     */
    protected function sendToInternalApi(array $data): bool
    {
        try {
            $url = "http://{$this->wsHost}:{$this->wsPort}/internal";
            
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            return $httpCode === 200;
        } catch (\Exception $e) {
            error_log("PushService error: " . $e->getMessage());
            return false;
        }
    }
}
