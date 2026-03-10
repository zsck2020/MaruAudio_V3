use crate::utils::api::ApiClient;
use serde_json::Value;

#[tauri::command]
pub fn ping() -> &'static str {
    "pong"
}

#[tauri::command]
pub async fn get_banners() -> Result<Vec<Value>, String> {
    let client = ApiClient::new();
    client.get_banners().await
        .map_err(|e| format!("Failed to fetch banners: {}", e))
}
