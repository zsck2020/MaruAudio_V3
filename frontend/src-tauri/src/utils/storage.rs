use crate::utils::api::UserInfo;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri_plugin_store::{Store, StoreBuilder};

const STORAGE_KEY_TOKEN: &str = "auth_token";
const STORAGE_KEY_USER_INFO: &str = "user_info";
const STORE_PATH: &str = ".auth-store.json";

// XOR 混淆前缀（防止 token 以明文存储在本地 JSON 文件中）
const OBFUSCATION_SALT: &[u8] = b"MaruAudio_V3_LocalStore_Key";

/// 生成设备相关的混淆密钥：固定 salt + 设备 hostname 哈希，增加逆向难度
fn get_obfuscation_key() -> Vec<u8> {
    let hostname = hostname::get()
        .map(|h| h.to_string_lossy().into_owned())
        .unwrap_or_else(|_| "fallback_host".to_string());
    let mut key = OBFUSCATION_SALT.to_vec();
    // 简单哈希：将 hostname 各字节累积异或混入 salt
    for (i, b) in hostname.bytes().enumerate() {
        let idx = i % key.len();
        key[idx] ^= b;
    }
    key
}

/// 存储在文件中的编码后 token 结构
#[derive(Debug, Clone, Serialize, Deserialize)]
struct EncodedTokens {
    t: String,
    r: String,
}

fn obfuscate(data: &str) -> String {
    use base64::Engine;
    let key = get_obfuscation_key();
    let xored: Vec<u8> = data.bytes()
        .enumerate()
        .map(|(i, b)| b ^ key[i % key.len()])
        .collect();
    base64::engine::general_purpose::STANDARD.encode(&xored)
}

fn deobfuscate(encoded: &str) -> Result<String, String> {
    use base64::Engine;
    let key = get_obfuscation_key();
    let decoded = base64::engine::general_purpose::STANDARD
        .decode(encoded)
        .map_err(|e| format!("Failed to decode token: {}", e))?;
    let xored: Vec<u8> = decoded.iter()
        .enumerate()
        .map(|(i, b)| b ^ key[i % key.len()])
        .collect();
    String::from_utf8(xored)
        .map_err(|e| format!("Failed to decode token string: {}", e))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthTokens {
    pub token: String,
    pub refresh_token: String,
}

pub struct Storage;

// 注意: 以下方法标记为 async 是为了与 Tauri 异步命令层保持签名一致，
// 内部操作实际为同步（tauri-plugin-store 不提供异步 API）。
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
        let encoded = EncodedTokens {
            t: obfuscate(&tokens.token),
            r: obfuscate(&tokens.refresh_token),
        };
        Self::set_and_save(&store, STORAGE_KEY_TOKEN, &encoded)
    }

    pub async fn get_tokens(app: &tauri::AppHandle) -> Result<Option<AuthTokens>, String> {
        let store = Self::open_store(app)?;
        let encoded: Option<EncodedTokens> = Self::get_value(&store, STORAGE_KEY_TOKEN)?;
        match encoded {
            Some(e) => Ok(Some(AuthTokens {
                token: deobfuscate(&e.t)?,
                refresh_token: deobfuscate(&e.r)?,
            })),
            None => Ok(None),
        }
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

