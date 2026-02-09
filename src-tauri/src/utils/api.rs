use crate::utils::config::AppConfig;
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;

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
        
        let client = reqwest::Client::new();
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

    pub async fn login(&self, username: String, password: String) -> Result<LoginResponse> {
        let machine_code = Self::get_machine_code();
        let request = LoginRequest {
            username,
            password,
            machine_code: Some(machine_code),
        };

        let response: ApiResponse<LoginResponse> = self
            .request("POST", "auth/login", Some(serde_json::to_value(request)?), None)
            .await?;

        response.data.ok_or_else(|| anyhow::anyhow!("No data in response"))
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

        let response: ApiResponse<LoginResponse> = self
            .request("POST", "auth/register", Some(serde_json::to_value(request)?), None)
            .await?;

        response.data.ok_or_else(|| anyhow::anyhow!("No data in response"))
    }

    pub async fn refresh_token(&self, refresh_token: &str) -> Result<LoginResponse> {
        let body = serde_json::json!({
            "refresh_token": refresh_token
        });

        let response: ApiResponse<LoginResponse> = self
            .request("POST", "auth/refresh-token", Some(body), None)
            .await?;

        response.data.ok_or_else(|| anyhow::anyhow!("No data in response"))
    }

    #[allow(dead_code)]
    pub async fn get_user_info(&self, token: &str) -> Result<UserInfo> {
        let response: ApiResponse<UserInfo> = self
            .request("GET", "user/info", None, Some(token))
            .await?;

        response.data.ok_or_else(|| anyhow::anyhow!("No data in response"))
    }

    pub async fn sync_user(&self, token: &str) -> Result<UserInfo> {
        let response: ApiResponse<UserInfo> = self
            .request("POST", "user/sync", None, Some(token))
            .await?;

        response.data.ok_or_else(|| anyhow::anyhow!("No data in response"))
    }

    #[allow(dead_code)]
    pub async fn get_public_config(&self) -> Result<Value> {
        let response: ApiResponse<Value> = self
            .request("GET", "config", None, None)
            .await?;

        response.data.ok_or_else(|| anyhow::anyhow!("No data in response"))
    }

    #[allow(dead_code)]
    pub async fn get_announcements(&self) -> Result<Vec<Value>> {
        let response: ApiResponse<Vec<Value>> = self
            .request("GET", "announcements", None, None)
            .await?;

        response.data.ok_or_else(|| anyhow::anyhow!("No data in response"))
    }

    fn get_machine_code() -> String {
        use std::process::Command;
        
        #[cfg(target_os = "windows")]
        {
            let output = Command::new("wmic")
                .args(&["csproduct", "get", "uuid"])
                .output();
            
            if let Ok(output) = output {
                let uuid = String::from_utf8_lossy(&output.stdout);
                let uuid = uuid.lines()
                    .skip(1)
                    .next()
                    .unwrap_or("")
                    .trim();
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
        
        "unknown".to_string()
    }
}

