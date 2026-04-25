use crate::utils::api::ApiClient;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Banner {
    pub id: i64,
    pub title: String,
    pub image_url: String,
    pub link_url: String,
    pub link_type: String,
}

#[tauri::command]
pub fn ping() -> &'static str {
    "pong"
}

#[tauri::command]
pub async fn get_banners() -> Result<Vec<Banner>, String> {
    let client = ApiClient::new();
    let values = client.get_banners().await
        .map_err(|e| format!("Failed to fetch banners: {}", e))?;

    let banners: Vec<Banner> = values
        .into_iter()
        .filter_map(|v| serde_json::from_value(v).ok())
        .collect();

    Ok(banners)
}
