use crate::utils::config::AppConfig;
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fmt;
use std::sync::LazyLock;
use std::time::Duration;

static SHARED_CLIENT: LazyLock<reqwest::Client> = LazyLock::new(|| {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .connect_timeout(Duration::from_secs(10))
        .pool_max_idle_per_host(5)
        .build()
        .unwrap_or_else(|_| reqwest::Client::new())
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

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ApiError {
    Unauthorized(String),
    Forbidden(String),
    HttpStatus { status: u16, message: String },
    Business { code: i32, message: String },
    Request(String),
    InvalidResponse(String),
    EmptyData,
}

impl ApiError {
    pub fn from_http_status(status: StatusCode, message: impl Into<String>) -> Self {
        let message = message.into();
        match status {
            StatusCode::UNAUTHORIZED => Self::Unauthorized(message),
            StatusCode::FORBIDDEN => Self::Forbidden(message),
            _ => Self::HttpStatus {
                status: status.as_u16(),
                message,
            },
        }
    }

    pub fn from_api_code(code: i32, message: impl Into<String>) -> Self {
        let message = message.into();
        match code {
            401 => Self::Unauthorized(message),
            403 => Self::Forbidden(message),
            _ => Self::Business { code, message },
        }
    }

    pub fn is_authentication_error(&self) -> bool {
        matches!(self, Self::Unauthorized(_) | Self::Forbidden(_))
    }
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Unauthorized(message) => write!(f, "Unauthorized: {}", message),
            Self::Forbidden(message) => write!(f, "Forbidden: {}", message),
            Self::HttpStatus { status, message } => write!(f, "HTTP {}: {}", status, message),
            Self::Business { code, message } => write!(f, "API error {}: {}", code, message),
            Self::Request(message) => write!(f, "Request failed: {}", message),
            Self::InvalidResponse(message) => write!(f, "Invalid response: {}", message),
            Self::EmptyData => write!(f, "API response missing data"),
        }
    }
}

impl std::error::Error for ApiError {}

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
    ) -> Result<ApiResponse<T>, ApiError>
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
            _ => {
                return Err(ApiError::Request(format!(
                    "Unsupported HTTP method: {}",
                    method
                )))
            }
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
            .map_err(|e| ApiError::Request(format!("Failed to send HTTP request: {}", e)))?;

        let status = response.status();
        let text = response
            .text()
            .await
            .map_err(|e| ApiError::Request(format!("Failed to read response body: {}", e)))?;

        if !status.is_success() {
            let message = extract_error_message(&text)
                .unwrap_or_else(|| fallback_status_message(status, &text));
            return Err(ApiError::from_http_status(status, message));
        }

        let api_response: ApiResponse<T> = serde_json::from_str(&text)
            .map_err(|e| ApiError::InvalidResponse(format!("{} | body: {}", e, text)))?;

        if api_response.code != 0 {
            return Err(ApiError::from_api_code(api_response.code, api_response.message));
        }

        Ok(api_response)
    }

    async fn request_data<T>(
        &self,
        method: &str,
        path: &str,
        body: Option<Value>,
        token: Option<&str>,
    ) -> Result<T, ApiError>
    where
        T: for<'de> Deserialize<'de>,
    {
        let response: ApiResponse<T> = self.request(method, path, body, token).await?;
        response.data.ok_or(ApiError::EmptyData)
    }

    pub async fn login(&self, username: String, password: String) -> Result<LoginResponse, ApiError> {
        let machine_code = Self::get_machine_code().await;
        let request = LoginRequest {
            username,
            password,
            machine_code: Some(machine_code),
        };

        self.request_data("POST", "auth/login", Some(serde_json::to_value(request).map_err(|e| ApiError::Request(e.to_string()))?), None).await
    }

    pub async fn register(
        &self,
        username: String,
        password: String,
        email: Option<String>,
        phone: Option<String>,
        invite_code: Option<String>,
    ) -> Result<LoginResponse, ApiError> {
        let machine_code = Self::get_machine_code().await;
        let request = RegisterRequest {
            username,
            password,
            email,
            phone,
            invite_code,
            machine_code: Some(machine_code),
        };

        self.request_data("POST", "auth/register", Some(serde_json::to_value(request).map_err(|e| ApiError::Request(e.to_string()))?), None).await
    }

    pub async fn refresh_token(&self, refresh_token: &str) -> Result<LoginResponse, ApiError> {
        let body = serde_json::json!({
            "refresh_token": refresh_token
        });

        self.request_data("POST", "auth/refresh-token", Some(body), None).await
    }

    #[allow(dead_code)]
    pub async fn get_user_info(&self, token: &str) -> Result<UserInfo, ApiError> {
        self.request_data("GET", "user/info", None, Some(token)).await
    }

    pub async fn sync_user(&self, token: &str) -> Result<UserInfo, ApiError> {
        self.request_data("POST", "user/sync", None, Some(token)).await
    }

    #[allow(dead_code)]
    pub async fn get_public_config(&self) -> Result<Value, ApiError> {
        self.request_data("GET", "config", None, None).await
    }

    #[allow(dead_code)]
    pub async fn get_announcements(&self) -> Result<Vec<Value>, ApiError> {
        self.request_data("GET", "announcements", None, None).await
    }

    pub async fn get_banners(&self) -> Result<Vec<Value>, ApiError> {
        self.request_data("GET", "banners?product_code=dubbing", None, None).await
    }

    async fn get_machine_code() -> String {
        #[cfg(target_os = "windows")]
        {
            let output = tokio::process::Command::new("powershell")
                .args(&["-NoProfile", "-Command", "(Get-CimInstance -ClassName Win32_ComputerSystemProduct).UUID"])
                .output()
                .await;

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
            let output = tokio::process::Command::new("system_profiler")
                .args(&["SPHardwareDataType"])
                .output()
                .await;

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
            if let Ok(machine_id) = tokio::fs::read_to_string("/etc/machine-id").await {
                return machine_id.trim().to_string();
            }
        }

        Self::get_or_create_fallback_id()
    }

    fn get_or_create_fallback_id() -> String {
        let fallback_path = dirs_next::data_local_dir()
            .unwrap_or_else(|| std::path::PathBuf::from("."))
            .join("MaruAudio")
            .join(".machine_id");

        if let Ok(id) = std::fs::read_to_string(&fallback_path) {
            let id = id.trim().to_string();
            if !id.is_empty() {
                return id;
            }
        }

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

fn extract_error_message(text: &str) -> Option<String> {
    serde_json::from_str::<ApiResponse<Value>>(text)
        .ok()
        .map(|response| response.message)
        .filter(|message| !message.trim().is_empty())
}

fn fallback_status_message(status: StatusCode, text: &str) -> String {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        format!("HTTP {}", status.as_u16())
    } else {
        trimmed.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::ApiError;
    use reqwest::StatusCode;

    #[test]
    fn unauthorized_http_status_is_marked_as_auth_failure() {
        let err = ApiError::from_http_status(StatusCode::UNAUTHORIZED, "expired");
        assert!(err.is_authentication_error());
    }

    #[test]
    fn business_code_401_is_marked_as_auth_failure() {
        let err = ApiError::from_api_code(401, "expired");
        assert!(err.is_authentication_error());
    }

    #[test]
    fn non_auth_failures_do_not_trigger_refresh_logic() {
        let err = ApiError::from_http_status(StatusCode::BAD_GATEWAY, "gateway down");
        assert!(!err.is_authentication_error());
    }

    #[test]
    fn business_code_403_is_marked_as_auth_failure() {
        let err = ApiError::from_api_code(403, "forbidden");
        assert!(err.is_authentication_error());
    }

    #[test]
    fn http_status_forbidden_is_marked_as_auth_failure() {
        let err = ApiError::from_http_status(StatusCode::FORBIDDEN, "access denied");
        assert!(err.is_authentication_error());
    }

    #[test]
    fn business_error_codes_are_preserved() {
        let err = ApiError::from_api_code(500, "internal error");
        match err {
            ApiError::Business { code, message } => {
                assert_eq!(code, 500);
                assert_eq!(message, "internal error");
            }
            _ => panic!("Expected Business error variant"),
        }
    }

    #[test]
    fn http_status_errors_preserve_status_code() {
        let err = ApiError::from_http_status(StatusCode::BAD_REQUEST, "bad request");
        match err {
            ApiError::HttpStatus { status, message } => {
                assert_eq!(status, 400);
                assert_eq!(message, "bad request");
            }
            _ => panic!("Expected HttpStatus error variant"),
        }
    }

    #[test]
    fn api_error_display_formats_correctly() {
        let err = ApiError::Unauthorized("token expired".into());
        assert_eq!(err.to_string(), "Unauthorized: token expired");

        let err = ApiError::Business {
            code: 1001,
            message: "custom error".into(),
        };
        assert_eq!(err.to_string(), "API error 1001: custom error");

        let err = ApiError::Request("network timeout".into());
        assert_eq!(err.to_string(), "Request failed: network timeout");

        let err = ApiError::EmptyData;
        assert_eq!(err.to_string(), "API response missing data");
    }

    #[test]
    fn empty_data_error_is_not_auth_failure() {
        let err = ApiError::EmptyData;
        assert!(!err.is_authentication_error());
    }

    #[test]
    fn request_error_is_not_auth_failure() {
        let err = ApiError::Request("timeout".into());
        assert!(!err.is_authentication_error());
    }
}