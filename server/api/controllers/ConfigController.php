<?php
/**
 * 公共配置控制器
 * 提供无需登录即可访问的公共配置
 */
class ConfigController {
    
    /**
     * 获取公共配置
     */
    public static function getPublicConfig() {
        $db = Database::getInstance();
        
        // 获取所有公共配置
        $publicKeys = [
            'user_agreement',
            'privacy_policy',
            'support_qrcode_url',
            'group_join_url',
            'tutorial_url',
            'donate_url',
            'registration_enabled',
            'machine_code_limit',
            'machine_change_cooldown',
            'login_fail_limit',
            'login_lock_duration',
            'trial_enabled',
            'trial_duration_days',
            'current_version',
            'dubbing_current_version',
            'comic_current_version',
            'force_update',
            'update_changelog',
            'update_download_url',
            'backup_download_url',
            'purchase_url',
            'purchase_qrcode_url',
            'card_price_monthly',
            'card_price_yearly',
            'card_price_permanent',
            'dashscope_api_key'
        ];
        
        $placeholders = implode(',', array_fill(0, count($publicKeys), '?'));
        $settings = $db->fetchAll(
            "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ({$placeholders})",
            $publicKeys
        );
        
        $result = [];
        foreach ($settings as $setting) {
            $result[$setting['setting_key']] = $setting['setting_value'];
        }
        
        // 设置默认值
        $defaults = [
            'registration_enabled' => '1',
            'machine_code_limit' => '1',
            'machine_change_cooldown' => '30',
            'login_fail_limit' => '5',
            'login_lock_duration' => '30',
            'trial_enabled' => '0',
            'trial_duration_days' => '3',
            'current_version' => '1.0.0',
            'force_update' => '0'
        ];
        
        foreach ($defaults as $key => $value) {
            if (!isset($result[$key])) {
                $result[$key] = $value;
            }
        }
        
        Response::success($result);
    }
    
    /**
     * 获取 CNB.cool 发布版本
     */
    public static function getReleaseVersion($input) {
        $productCode = $input['product_code'] ?? 'dubbing';
        
        $cnbUrl = $productCode === 'comic' 
            ? 'https://cnb.cool/MiaoJiangTD/MaruComic-Release/-/git/raw/main/version.json'
            : 'https://cnb.cool/MiaoJiangTD/MaruAudio-Release/-/git/raw/main/version.json';
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $cnbUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_MAXREDIRS, 3);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        if ($curlError) {
            error_log("CURL错误: " . $curlError);
            Response::error('获取版本信息失败: 网络错误', 5001);
        }
        
        if ($httpCode === 200 && $response) {
            $data = json_decode($response, true);
            if ($data && isset($data['version'])) {
                Response::success([
                    'version' => $data['version'],
                    'release_date' => $data['release_date'] ?? '',
                    'changelog' => $data['changelog'] ?? ''
                ]);
                return;
            }
        }
        
        Response::error('获取版本信息失败', 5001);
    }
    
    /**
     * 获取活动公告（客户端用）
     */
    public static function getActiveAnnouncements() {
        $db = Database::getInstance();
        
        $now = date('Y-m-d H:i:s');
        $announcements = $db->fetchAll(
            "SELECT id, title, content, type, priority FROM announcements 
             WHERE is_active = 1 
             AND (start_time IS NULL OR start_time <= ?) 
             AND (end_time IS NULL OR end_time >= ?)
             ORDER BY priority DESC, created_at DESC LIMIT 10",
            [$now, $now]
        );
        
        Response::success(['list' => $announcements]);
    }
}
