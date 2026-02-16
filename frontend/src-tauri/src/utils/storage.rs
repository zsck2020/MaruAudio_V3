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
    /// 获取并重新加载 Store 实例（消除 6 处重复的初始化代码）
    fn open_store(app: &tauri::AppHandle) -> Result<Arc<Store<tauri::Wry>>, String> {
        let store = StoreBuilder::new(app, STORE_PATH)
            .build()
            .map_err(|e| format!("Failed to create store: {}", e))?;
        store.reload().map_err(|e| format!("Failed to reload store: {}", e))?;
        Ok(store)
    }

    /// 通用：向 Store 写入一个序列化值并保存
    fn set_and_save<T: Serialize>(store: &Store<tauri::Wry>, key: &str, value: &T) -> Result<(), String> {
        store.set(
            key.to_string(),
            serde_json::to_value(value)
                .map_err(|e| format!("Failed to serialize {}: {}", key, e))?,
        );
        store.save().map_err(|e| format!("Failed to save store: {}", e))
    }

    /// 通用：从 Store 读取并反序列化一个值
    fn get_value<T: for<'de> Deserialize<'de>>(store: &Store<tauri::Wry>, key: &str) -> Result<Option<T>, String> {
        match store.get(key) {
            Some(value) => serde_json::from_value(value.clone())
                .map_err(|e| format!("Failed to deserialize {}: {}", key, e))
                .map(Some),
            None => Ok(None),
        }
    }

    /// 通用：从 Store 删除一个键并保存
    fn delete_and_save(store: &Store<tauri::Wry>, key: &str) -> Result<(), String> {
        store.delete(key);
        store.save().map_err(|e| format!("Failed to save store: {}", e))
    }

    pub async fn save_tokens(app: &tauri::AppHandle, tokens: &AuthTokens) -> Result<(), String> {
        let store = Self::open_store(app)?;
        Self::set_and_save(&store, STORAGE_KEY_TOKEN, tokens)
    }

    pub async fn get_tokens(app: &tauri::AppHandle) -> Result<Option<AuthTokens>, String> {
        let store = Self::open_store(app)?;
        Self::get_value(&store, STORAGE_KEY_TOKEN)
    }

    pub async fn clear_tokens(app: &tauri::AppHandle) -> Result<(), String> {
        let store = Self::open_store(app)?;
        Self::delete_and_save(&store, STORAGE_KEY_TOKEN)
    }

    pub async fn save_user_info(app: &tauri::AppHandle, user_info: &UserInfo) -> Result<(), String> {
        let store = Self::open_store(app)?;
        Self::set_and_save(&store, STORAGE_KEY_USER_INFO, user_info)
    }

    pub async fn get_user_info(app: &tauri::AppHandle) -> Result<Option<UserInfo>, String> {
        let store = Self::open_store(app)?;
        Self::get_value(&store, STORAGE_KEY_USER_INFO)
    }

    pub async fn clear_user_info(app: &tauri::AppHandle) -> Result<(), String> {
        let store = Self::open_store(app)?;
        Self::delete_and_save(&store, STORAGE_KEY_USER_INFO)
    }
}

