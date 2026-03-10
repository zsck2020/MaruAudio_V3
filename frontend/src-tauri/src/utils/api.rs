use crate::utils::config::AppConfig;
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::LazyLock;
use std::time::Duration;

/// 全局共享的 HTTP 客户端（连接池复用，避免每次请求都创建新连接）
static SHARED_CLIENT: LazyLock<reqwest::Client> = LazyLock::new(|| {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .connect_timeout(Duration::from_secs(10))
        .pool_max_idle_per_host(5)
        .build()
        .expect("Failed to create HTTP client")
});

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub code: i32,
    pub message: String,
    pub data: Option<T>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
    pub machine_code: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub password: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub invite_code: Option<String>,
    pub machine_code: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub token: String,
    pub refresh_token: String,
    pub user: UserInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserInfo {
    pub id: i64,
    pub username: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub status: String,
    pub characters: i64,
    pub invite_code: Option<String>,
}

pub struct ApiClient {
    config: AppConfig,
}

impl ApiClient {
    pub fn new() -> Self {
        Self {
            config: AppConfig::from_env(),
        }
    }

    fn client(&self) -> &'static reqwest::Client {
        &SHARED_CLIENT
    }

    fn get_base_url(&self) -> &str {
        &self.config.api_base_url
    }

    async fn request<T>(
        &self,
        method: &str,
        path: &str,
        body: Option<Value>,
        token: Option<&str>,
    ) -> Result<ApiResponse<T>>
    where
        T: for<'de> Deserialize<'de>,
    {
        let url = format!("{}/{}", self.get_base_url(), path.trim_start_matches('/'));
        
        let client = self.client();
        let mut request = match method {
            "GET" => client.get(&url),
            "POST" => client.post(&url),
            "PUT" => client.put(&url),
            "DELETE" => client.delete(&url),
            _ => return Err(anyhow::anyhow!("Unsupported HTTP method: {}", method)),
        };

        if let Some(token) = token {
            request = request.header("Authorization", format!("Bearer {}", token));
        }

        if let Some(body) = body {
            request = request.json(&body);
        }

        let response = request
            .send()
            .await
            .context("Failed to send HTTP request")?;

        let status = response.status();
        let text = response.text().await.context("Failed to read response body")?;

        let api_response: ApiResponse<T> = serde_json::from_str(&text)
            .context(format!("Failed to parse response: {}", text))?;

        if !status.is_success() || api_response.code != 0 {
            return Err(anyhow::anyhow!(
                "API error: {} (code: {})",
                api_response.message,
                api_response.code
            ));
        }

        Ok(api_response)
    }

    /// 发送请求并解包 data 字段（消除 7 处重复的 ok_or_else 调用）
    async fn request_data<T>(
        &self,
        method: &str,
        path: &str,
        body: Option<Value>,
        token: Option<&str>,
    ) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
    {
        let response: ApiResponse<T> = self.request(method, path, body, token).await?;
        response.data.ok_or_else(|| anyhow::anyhow!("No data in response"))
    }

    pub async fn login(&self, username: String, password: String) -> Result<LoginResponse> {
        let machine_code = Self::get_machine_code();
        let request = LoginRequest {
            username,
            password,
            machine_code: Some(machine_code),
        };

        self.request_data("POST", "auth/login", Some(serde_json::to_value(request)?), None).await
    }

    pub async fn register(
        &self,
        username: String,
        password: String,
        email: Option<String>,
        phone: Option<String>,
        invite_code: Option<String>,
    ) -> Result<LoginResponse> {
        let machine_code = Self::get_machine_code();
        let request = RegisterRequest {
            username,
            password,
            email,
            phone,
            invite_code,
            machine_code: Some(machine_code),
        };

        self.request_data("POST", "auth/register", Some(serde_json::to_value(request)?), None).await
    }

    pub async fn refresh_token(&self, refresh_token: &str) -> Result<LoginResponse> {
        let body = serde_json::json!({
            "refresh_token": refresh_token
        });

        self.request_data("POST", "auth/refresh-token", Some(body), None).await
    }

    #[allow(dead_code)]
    pub async fn get_user_info(&self, token: &str) -> Result<UserInfo> {
        self.request_data("GET", "user/info", None, Some(token)).await
    }

    pub async fn sync_user(&self, token: &str) -> Result<UserInfo> {
        self.request_data("POST", "user/sync", None, Some(token)).await
    }

    #[allow(dead_code)]
    pub async fn get_public_config(&self) -> Result<Value> {
        self.request_data("GET", "config", None, None).await
    }

    #[allow(dead_code)]
    pub async fn get_announcements(&self) -> Result<Vec<Value>> {
        self.request_data("GET", "announcements", None, None).await
    }

    pub async fn get_banners(&self) -> Result<Vec<Value>> {
        self.request_data("GET", "banners?product_code=dubbing", None, None).await
    }

    fn get_machine_code() -> String {
        use std::process::Command;
        
        #[cfg(target_os = "windows")]
        {
            let output = Command::new("powershell")
                .args(&["-NoProfile", "-Command", "(Get-CimInstance -ClassName Win32_ComputerSystemProduct).UUID"])
                .output();
            
            if let Ok(output) = output {
                let uuid = String::from_utf8_lossy(&output.stdout);
                let uuid = uuid.trim();
                if !uuid.is_empty() {
                    return uuid.to_string();
                }
            }
        }
        
        #[cfg(target_os = "macos")]
        {
            let output = Command::new("system_profiler")
                .args(&["SPHardwareDataType"])
                .output();
            
            if let Ok(output) = output {
                let text = String::from_utf8_lossy(&output.stdout);
                if let Some(line) = text.lines().find(|l| l.contains("Hardware UUID")) {
                    if let Some(uuid) = line.split(':').nth(1) {
                        return uuid.trim().to_string();
                    }
                }
            }
        }
        
        #[cfg(target_os = "linux")]
        {
            if let Ok(machine_id) = std::fs::read_to_string("/etc/machine-id") {
                return machine_id.trim().to_string();
            }
        }
        
        // 所有平台方法均失败时，生成并持久化一个随机 UUID，确保每台设备唯一
        Self::get_or_create_fallback_id()
    }

    fn get_or_create_fallback_id() -> String {
        let fallback_path = dirs_next::data_local_dir()
            .unwrap_or_else(|| std::path::PathBuf::from("."))
            .join("MaruAudio")
            .join(".machine_id");

        // 尝试读取已持久化的 ID
        if let Ok(id) = std::fs::read_to_string(&fallback_path) {
            let id = id.trim().to_string();
            if !id.is_empty() {
                return id;
            }
        }

        // 生成新的随机 UUID 并持久化
        let id = format!(
            "{:08x}-{:04x}-{:04x}-{:04x}-{:012x}",
            rand::random::<u32>(),
            rand::random::<u16>(),
            rand::random::<u16>(),
            rand::random::<u16>(),
            rand::random::<u64>() & 0xFFFF_FFFF_FFFF
        );

        if let Some(parent) = fallback_path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        let _ = std::fs::write(&fallback_path, &id);

        id
    }
}

