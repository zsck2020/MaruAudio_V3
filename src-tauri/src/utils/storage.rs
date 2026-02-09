use crate::utils::api::UserInfo;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri_plugin_store::{Store, StoreBuilder};

const STORAGE_KEY_TOKEN: &str = "auth_token";
const STORAGE_KEY_USER_INFO: &str = "user_info";
const STORE_PATH: &str = ".auth-store.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthTokens {
    pub token: String,
    pub refresh_token: String,
}

pub struct Storage;

impl Storage {
    pub async fn save_tokens(app: &tauri::AppHandle, tokens: &AuthTokens) -> Result<(), String> {
        let store: Arc<Store<_>> = StoreBuilder::new(app, STORE_PATH)
            .build()
            .map_err(|e| format!("Failed to create store: {}", e))?;
        
        store.reload().map_err(|e| format!("Failed to reload store: {}", e))?;
        store.set(
            STORAGE_KEY_TOKEN.to_string(),
            serde_json::to_value(tokens)
                .map_err(|e| format!("Failed to serialize tokens: {}", e))?,
        );
        store.save().map_err(|e| format!("Failed to save store: {}", e))?;
        Ok(())
    }

    pub async fn get_tokens(app: &tauri::AppHandle) -> Result<Option<AuthTokens>, String> {
        let store: Arc<Store<_>> = StoreBuilder::new(app, STORE_PATH)
            .build()
            .map_err(|e| format!("Failed to create store: {}", e))?;
        
        store.reload().map_err(|e| format!("Failed to reload store: {}", e))?;
        
        if let Some(value) = store.get(STORAGE_KEY_TOKEN) {
            serde_json::from_value(value.clone())
                .map_err(|e| format!("Failed to deserialize tokens: {}", e))
                .map(Some)
        } else {
            Ok(None)
        }
    }

    pub async fn clear_tokens(app: &tauri::AppHandle) -> Result<(), String> {
        let store: Arc<Store<_>> = StoreBuilder::new(app, STORE_PATH)
            .build()
            .map_err(|e| format!("Failed to create store: {}", e))?;
        
        store.reload().map_err(|e| format!("Failed to reload store: {}", e))?;
        store.delete(STORAGE_KEY_TOKEN);
        store.save().map_err(|e| format!("Failed to save store: {}", e))?;
        Ok(())
    }

    pub async fn save_user_info(app: &tauri::AppHandle, user_info: &UserInfo) -> Result<(), String> {
        let store: Arc<Store<_>> = StoreBuilder::new(app, STORE_PATH)
            .build()
            .map_err(|e| format!("Failed to create store: {}", e))?;
        
        store.reload().map_err(|e| format!("Failed to reload store: {}", e))?;
        store.set(
            STORAGE_KEY_USER_INFO.to_string(),
            serde_json::to_value(user_info)
                .map_err(|e| format!("Failed to serialize user info: {}", e))?,
        );
        store.save().map_err(|e| format!("Failed to save store: {}", e))?;
        Ok(())
    }

    pub async fn get_user_info(app: &tauri::AppHandle) -> Result<Option<UserInfo>, String> {
        let store: Arc<Store<_>> = StoreBuilder::new(app, STORE_PATH)
            .build()
            .map_err(|e| format!("Failed to create store: {}", e))?;
        
        store.reload().map_err(|e| format!("Failed to reload store: {}", e))?;
        
        if let Some(value) = store.get(STORAGE_KEY_USER_INFO) {
            serde_json::from_value(value.clone())
                .map_err(|e| format!("Failed to deserialize user info: {}", e))
                .map(Some)
        } else {
            Ok(None)
        }
    }

    pub async fn clear_user_info(app: &tauri::AppHandle) -> Result<(), String> {
        let store: Arc<Store<_>> = StoreBuilder::new(app, STORE_PATH)
            .build()
            .map_err(|e| format!("Failed to create store: {}", e))?;
        
        store.reload().map_err(|e| format!("Failed to reload store: {}", e))?;
        store.delete(STORAGE_KEY_USER_INFO);
        store.save().map_err(|e| format!("Failed to save store: {}", e))?;
        Ok(())
    }
}

