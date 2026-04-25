use serde::{Deserialize, Serialize};
use std::sync::LazyLock;

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

static APP_CONFIG: LazyLock<AppConfig> = LazyLock::new(|| {
    let default = AppConfig::default();
    let api_base_url = std::env::var("MARUAUDIO_API_URL")
        .unwrap_or(default.api_base_url);
    AppConfig { api_base_url }
});

impl AppConfig {
    pub fn from_env() -> Self {
        APP_CONFIG.clone()
    }
}

