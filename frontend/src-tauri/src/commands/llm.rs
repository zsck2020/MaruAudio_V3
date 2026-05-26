//! LLM 凭据管理命令
//!
//! 安全：API Key 通过 AES-256-GCM 加密存到 .auth-store.json（与 auth_token 同款加密链）。
//! settings.json 仅保留 base URL 和模型名等非敏感字段。

use crate::utils::error::{AppError, AppResult};
use crate::utils::storage::Storage;

/// 保存 LLM API Key（加密落盘）
#[tauri::command]
pub async fn llm_save_api_key(app: tauri::AppHandle, api_key: String) -> AppResult<()> {
    if api_key.is_empty() {
        // 空值视为清除
        return Storage::clear_llm_api_key(&app)
            .await
            .map_err(|e| AppError::Storage(format!("Failed to clear LLM key: {}", e)));
    }
    Storage::save_llm_api_key(&app, &api_key)
        .await
        .map_err(|e| AppError::Storage(format!("Failed to save LLM key: {}", e)))
}

/// 获取 LLM API Key（解密返回）
#[tauri::command]
pub async fn llm_get_api_key(app: tauri::AppHandle) -> AppResult<Option<String>> {
    Storage::get_llm_api_key(&app)
        .await
        .map_err(|e| AppError::Storage(format!("Failed to load LLM key: {}", e)))
}

/// 显式清除 LLM API Key
#[tauri::command]
pub async fn llm_clear_api_key(app: tauri::AppHandle) -> AppResult<()> {
    Storage::clear_llm_api_key(&app)
        .await
        .map_err(|e| AppError::Storage(format!("Failed to clear LLM key: {}", e)))
}
