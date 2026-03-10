use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub api_base_url: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            api_base_url: "https://auth.wzagent.cn/api".to_string(),
        }
    }
}

impl AppConfig {
    pub fn from_env() -> Self {
        let default = Self::default();
        let api_base_url = std::env::var("MARUAUDIO_API_URL")
            .unwrap_or(default.api_base_url);
        
        Self { api_base_url }
    }
}

