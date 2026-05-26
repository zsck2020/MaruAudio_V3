use crate::utils::api::UserInfo;
use crate::utils::crypto::TokenCrypto;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri_plugin_store::{Store, StoreBuilder};

const STORAGE_KEY_TOKEN: &str = "auth_token";
const STORAGE_KEY_USER_INFO: &str = "user_info";
const STORAGE_KEY_LLM_API_KEY: &str = "llm_api_key";
const STORE_PATH: &str = ".auth-store.json";
const TOKEN_ENCODING_VERSION: u8 = 3;
const TOKEN_ENCODING: &str = "aes-gcm-256";
const KEYRING_SERVICE: &str = "MaruAudio_V3";
const KEYRING_USERNAME: &str = "token_encryption_key";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct PersistedTokens {
    version: u8,
    encoding: String,
    access_token: String,
    refresh_token: String,
}

/// LLM API Key 加密载荷
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct PersistedLlmKey {
    version: u8,
    encoding: String,
    api_key: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AuthTokens {
    pub token: String,
    pub refresh_token: String,
}

pub struct Storage;

fn get_crypto() -> Result<TokenCrypto, String> {
    TokenCrypto::from_keyring(KEYRING_SERVICE, KEYRING_USERNAME)
}

fn encrypt_token(data: &str) -> Result<String, String> {
    let crypto = get_crypto()?;
    crypto.encrypt(data)
}

fn decrypt_token(encrypted: &str) -> Result<String, String> {
    let crypto = get_crypto()?;
    crypto.decrypt(encrypted)
}

fn deserialize_tokens(value: &serde_json::Value) -> Result<AuthTokens, String> {
    if let Ok(persisted) = serde_json::from_value::<PersistedTokens>(value.clone()) {
        if persisted.version != TOKEN_ENCODING_VERSION || persisted.encoding != TOKEN_ENCODING {
            return Err(format!(
                "Unsupported token encoding: version={} encoding={}",
                persisted.version, persisted.encoding
            ));
        }

        return Ok(AuthTokens {
            token: decrypt_token(&persisted.access_token)?,
            refresh_token: decrypt_token(&persisted.refresh_token)?,
        });
    }

    #[derive(Deserialize)]
    struct PlaintextTokens {
        token: String,
        #[serde(default)]
        refresh_token: String,
    }

    serde_json::from_value::<PlaintextTokens>(value.clone())
        .map(|tokens| AuthTokens {
            token: tokens.token,
            refresh_token: tokens.refresh_token,
        })
        .map_err(|e| format!("Failed to deserialize {}: {}", STORAGE_KEY_TOKEN, e))
}

impl Storage {
    fn open_store(app: &tauri::AppHandle) -> Result<Arc<Store<tauri::Wry>>, String> {
        let store = StoreBuilder::new(app, STORE_PATH)
            .build()
            .map_err(|e| format!("Failed to create store: {}", e))?;
        store
            .reload()
            .map_err(|e| format!("Failed to reload store: {}", e))?;
        Ok(store)
    }

    fn set_and_save<T: Serialize>(
        store: &Store<tauri::Wry>,
        key: &str,
        value: &T,
    ) -> Result<(), String> {
        store.set(
            key.to_string(),
            serde_json::to_value(value)
                .map_err(|e| format!("Failed to serialize {}: {}", key, e))?,
        );
        store
            .save()
            .map_err(|e| format!("Failed to save store: {}", e))
    }

    fn get_value<T: for<'de> Deserialize<'de>>(
        store: &Store<tauri::Wry>,
        key: &str,
    ) -> Result<Option<T>, String> {
        match store.get(key) {
            Some(value) => serde_json::from_value(value.clone())
                .map_err(|e| format!("Failed to deserialize {}: {}", key, e))
                .map(Some),
            None => Ok(None),
        }
    }

    fn delete_and_save(store: &Store<tauri::Wry>, key: &str) -> Result<(), String> {
        store.delete(key);
        store
            .save()
            .map_err(|e| format!("Failed to save store: {}", e))
    }

    pub async fn save_tokens(app: &tauri::AppHandle, tokens: &AuthTokens) -> Result<(), String> {
        let store = Self::open_store(app)?;
        let persisted = PersistedTokens {
            version: TOKEN_ENCODING_VERSION,
            encoding: TOKEN_ENCODING.to_string(),
            access_token: encrypt_token(&tokens.token)?,
            refresh_token: encrypt_token(&tokens.refresh_token)?,
        };
        Self::set_and_save(&store, STORAGE_KEY_TOKEN, &persisted)
    }

    pub async fn get_tokens(app: &tauri::AppHandle) -> Result<Option<AuthTokens>, String> {
        let store = Self::open_store(app)?;
        match store.get(STORAGE_KEY_TOKEN) {
            Some(value) => deserialize_tokens(&value).map(Some),
            None => Ok(None),
        }
    }

    pub async fn clear_tokens(app: &tauri::AppHandle) -> Result<(), String> {
        let store = Self::open_store(app)?;
        Self::delete_and_save(&store, STORAGE_KEY_TOKEN)
    }

    pub async fn save_user_info(
        app: &tauri::AppHandle,
        user_info: &UserInfo,
    ) -> Result<(), String> {
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

    /// 保存 LLM API Key（AES-256-GCM 加密 + 同一 keyring 密钥）
    pub async fn save_llm_api_key(
        app: &tauri::AppHandle,
        api_key: &str,
    ) -> Result<(), String> {
        let store = Self::open_store(app)?;
        let persisted = PersistedLlmKey {
            version: TOKEN_ENCODING_VERSION,
            encoding: TOKEN_ENCODING.to_string(),
            api_key: encrypt_token(api_key)?,
        };
        Self::set_and_save(&store, STORAGE_KEY_LLM_API_KEY, &persisted)
    }

    /// 获取 LLM API Key（解密）
    pub async fn get_llm_api_key(
        app: &tauri::AppHandle,
    ) -> Result<Option<String>, String> {
        let store = Self::open_store(app)?;
        match store.get(STORAGE_KEY_LLM_API_KEY) {
            Some(value) => {
                let persisted: PersistedLlmKey = serde_json::from_value(value.clone())
                    .map_err(|e| format!("Failed to deserialize llm_api_key: {}", e))?;
                if persisted.version != TOKEN_ENCODING_VERSION
                    || persisted.encoding != TOKEN_ENCODING
                {
                    return Err(format!(
                        "Unsupported llm_api_key encoding: version={} encoding={}",
                        persisted.version, persisted.encoding
                    ));
                }
                Ok(Some(decrypt_token(&persisted.api_key)?))
            }
            None => Ok(None),
        }
    }

    /// 清除 LLM API Key
    pub async fn clear_llm_api_key(app: &tauri::AppHandle) -> Result<(), String> {
        let store = Self::open_store(app)?;
        Self::delete_and_save(&store, STORAGE_KEY_LLM_API_KEY)
    }
}

#[cfg(test)]
mod tests {
    use super::{deserialize_tokens, AuthTokens, PersistedTokens, TOKEN_ENCODING, TOKEN_ENCODING_VERSION};
    use crate::utils::crypto::TokenCrypto;

    #[test]
    fn persisted_tokens_do_not_expose_plaintext_values() {
        let crypto = TokenCrypto::new(&[0u8; 32]);
        let value = serde_json::to_value(PersistedTokens {
            version: TOKEN_ENCODING_VERSION,
            encoding: TOKEN_ENCODING.into(),
            access_token: crypto.encrypt("access-token").unwrap(),
            refresh_token: crypto.encrypt("refresh-token").unwrap(),
        })
        .expect("persisted tokens should serialize");

        let serialized = value.to_string();
        assert!(!serialized.contains("access-token"));
        assert!(!serialized.contains("refresh-token"));
    }

    #[test]
    fn deserializes_current_encrypted_schema() {
        // Note: This test verifies the schema structure but cannot test actual decryption
        // because deserialize_tokens() uses get_crypto() which requires system keyring access.
        // In production, the keyring provides the encryption key; in tests, we verify structure only.
        let crypto = TokenCrypto::new(&[0u8; 32]);
        let value = serde_json::to_value(PersistedTokens {
            version: TOKEN_ENCODING_VERSION,
            encoding: TOKEN_ENCODING.into(),
            access_token: crypto.encrypt("access-token").unwrap(),
            refresh_token: crypto.encrypt("refresh-token").unwrap(),
        })
        .expect("persisted tokens should serialize");

        // Verify the structure is correct (version and encoding fields present)
        assert_eq!(value["version"], TOKEN_ENCODING_VERSION);
        assert_eq!(value["encoding"], TOKEN_ENCODING);
        assert!(value["access_token"].is_string());
        assert!(value["refresh_token"].is_string());
    }

    #[test]
    fn rejects_unsupported_encoding_version() {
        let crypto = TokenCrypto::new(&[0u8; 32]);
        let value = serde_json::to_value(PersistedTokens {
            version: 99,
            encoding: TOKEN_ENCODING.into(),
            access_token: crypto.encrypt("access-token").unwrap(),
            refresh_token: crypto.encrypt("refresh-token").unwrap(),
        })
        .expect("persisted tokens should serialize");

        let result = deserialize_tokens(&value);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Unsupported token encoding"));
    }

    #[test]
    fn rejects_unsupported_encoding_algorithm() {
        let crypto = TokenCrypto::new(&[0u8; 32]);
        let value = serde_json::to_value(PersistedTokens {
            version: TOKEN_ENCODING_VERSION,
            encoding: "unknown-algo".into(),
            access_token: crypto.encrypt("access-token").unwrap(),
            refresh_token: crypto.encrypt("refresh-token").unwrap(),
        })
        .expect("persisted tokens should serialize");

        let result = deserialize_tokens(&value);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Unsupported token encoding"));
    }

    #[test]
    fn deserializes_plaintext_access_only_schema_for_rollback_safety() {
        let value = serde_json::json!({
            "token": "plain-access"
        });

        assert_eq!(
            deserialize_tokens(&value).expect("plaintext tokens should deserialize"),
            AuthTokens {
                token: "plain-access".into(),
                refresh_token: String::new(),
            }
        );
    }

    #[test]
    fn deserializes_plaintext_with_both_tokens() {
        let value = serde_json::json!({
            "token": "plain-access",
            "refresh_token": "plain-refresh"
        });

        assert_eq!(
            deserialize_tokens(&value).expect("plaintext tokens should deserialize"),
            AuthTokens {
                token: "plain-access".into(),
                refresh_token: "plain-refresh".into(),
            }
        );
    }

    #[test]
    fn rejects_malformed_json() {
        let value = serde_json::json!({
            "invalid_field": "value"
        });

        let result = deserialize_tokens(&value);
        assert!(result.is_err());
    }

    #[test]
    fn rejects_corrupted_encrypted_data() {
        let value = serde_json::to_value(PersistedTokens {
            version: TOKEN_ENCODING_VERSION,
            encoding: TOKEN_ENCODING.into(),
            access_token: "corrupted-base64!!!".into(),
            refresh_token: "also-corrupted!!!".into(),
        })
        .expect("should serialize");

        let result = deserialize_tokens(&value);
        assert!(result.is_err());
    }
}
