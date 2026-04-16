use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use base64::Engine;
use rand::RngCore;

const NONCE_SIZE: usize = 12;

pub struct TokenCrypto {
    cipher: Aes256Gcm,
}

impl TokenCrypto {
    pub fn new(key: &[u8; 32]) -> Self {
        let cipher = Aes256Gcm::new(key.into());
        Self { cipher }
    }

    pub fn from_keyring(service: &str, username: &str) -> Result<Self, String> {
        let entry = keyring::Entry::new(service, username)
            .map_err(|e| format!("Failed to access keyring: {}", e))?;

        let key_base64 = match entry.get_password() {
            Ok(k) => k,
            Err(keyring::Error::NoEntry) => {
                let mut key = [0u8; 32];
                OsRng.fill_bytes(&mut key);
                let key_base64 = base64::engine::general_purpose::STANDARD.encode(key);
                entry
                    .set_password(&key_base64)
                    .map_err(|e| format!("Failed to store key: {}", e))?;
                key_base64
            }
            Err(e) => return Err(format!("Failed to retrieve key: {}", e)),
        };

        let key_bytes = base64::engine::general_purpose::STANDARD
            .decode(&key_base64)
            .map_err(|e| format!("Invalid key format: {}", e))?;

        if key_bytes.len() != 32 {
            return Err("Invalid key length".to_string());
        }

        let mut key = [0u8; 32];
        key.copy_from_slice(&key_bytes);

        Ok(Self::new(&key))
    }

    pub fn encrypt(&self, plaintext: &str) -> Result<String, String> {
        let mut nonce_bytes = [0u8; NONCE_SIZE];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        let ciphertext = self
            .cipher
            .encrypt(nonce, plaintext.as_bytes())
            .map_err(|e| format!("Encryption failed: {}", e))?;

        let mut result = nonce_bytes.to_vec();
        result.extend_from_slice(&ciphertext);

        Ok(base64::engine::general_purpose::STANDARD.encode(result))
    }

    pub fn decrypt(&self, encrypted: &str) -> Result<String, String> {
        let data = base64::engine::general_purpose::STANDARD
            .decode(encrypted)
            .map_err(|e| format!("Invalid base64: {}", e))?;

        if data.len() < NONCE_SIZE {
            return Err("Invalid encrypted data".to_string());
        }

        let (nonce_bytes, ciphertext) = data.split_at(NONCE_SIZE);
        let nonce = Nonce::from_slice(nonce_bytes);

        let plaintext = self
            .cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| format!("Decryption failed: {}", e))?;

        String::from_utf8(plaintext).map_err(|e| format!("Invalid UTF-8: {}", e))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt() {
        let key = [0u8; 32];
        let crypto = TokenCrypto::new(&key);

        let plaintext = "test-token-12345";
        let encrypted = crypto.encrypt(plaintext).unwrap();
        let decrypted = crypto.decrypt(&encrypted).unwrap();

        assert_eq!(plaintext, decrypted);
        assert_ne!(plaintext, encrypted);
    }

    #[test]
    fn test_different_nonces() {
        let key = [0u8; 32];
        let crypto = TokenCrypto::new(&key);

        let plaintext = "same-plaintext";
        let encrypted1 = crypto.encrypt(plaintext).unwrap();
        let encrypted2 = crypto.encrypt(plaintext).unwrap();

        assert_ne!(encrypted1, encrypted2);
        assert_eq!(crypto.decrypt(&encrypted1).unwrap(), plaintext);
        assert_eq!(crypto.decrypt(&encrypted2).unwrap(), plaintext);
    }

    #[test]
    fn test_empty_string() {
        let key = [1u8; 32];
        let crypto = TokenCrypto::new(&key);

        let plaintext = "";
        let encrypted = crypto.encrypt(plaintext).unwrap();
        let decrypted = crypto.decrypt(&encrypted).unwrap();

        assert_eq!(plaintext, decrypted);
    }

    #[test]
    fn test_long_string() {
        let key = [2u8; 32];
        let crypto = TokenCrypto::new(&key);

        let plaintext = "a".repeat(10000);
        let encrypted = crypto.encrypt(&plaintext).unwrap();
        let decrypted = crypto.decrypt(&encrypted).unwrap();

        assert_eq!(plaintext, decrypted);
    }

    #[test]
    fn test_unicode_string() {
        let key = [3u8; 32];
        let crypto = TokenCrypto::new(&key);

        let plaintext = "测试中文🔐密钥";
        let encrypted = crypto.encrypt(plaintext).unwrap();
        let decrypted = crypto.decrypt(&encrypted).unwrap();

        assert_eq!(plaintext, decrypted);
    }

    #[test]
    fn test_invalid_base64() {
        let key = [4u8; 32];
        let crypto = TokenCrypto::new(&key);

        let result = crypto.decrypt("not-valid-base64!!!");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid base64"));
    }

    #[test]
    fn test_too_short_data() {
        let key = [5u8; 32];
        let crypto = TokenCrypto::new(&key);

        // Base64 编码的短数据（少于 12 字节）
        let short_data = base64::engine::general_purpose::STANDARD.encode(b"short");
        let result = crypto.decrypt(&short_data);

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid encrypted data"));
    }

    #[test]
    fn test_wrong_key() {
        let key1 = [6u8; 32];
        let key2 = [7u8; 32];
        let crypto1 = TokenCrypto::new(&key1);
        let crypto2 = TokenCrypto::new(&key2);

        let plaintext = "secret-data";
        let encrypted = crypto1.encrypt(plaintext).unwrap();
        let result = crypto2.decrypt(&encrypted);

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Decryption failed"));
    }

    #[test]
    fn test_tampered_ciphertext() {
        let key = [8u8; 32];
        let crypto = TokenCrypto::new(&key);

        let plaintext = "original-data";
        let encrypted = crypto.encrypt(plaintext).unwrap();

        // 篡改密文
        let mut tampered = encrypted.clone();
        tampered.push('X');

        let result = crypto.decrypt(&tampered);
        assert!(result.is_err());
    }

    #[test]
    fn test_multiple_encryptions() {
        let key = [9u8; 32];
        let crypto = TokenCrypto::new(&key);

        for i in 0..100 {
            let plaintext = format!("test-{}", i);
            let encrypted = crypto.encrypt(&plaintext).unwrap();
            let decrypted = crypto.decrypt(&encrypted).unwrap();
            assert_eq!(plaintext, decrypted);
        }
    }

    #[test]
    fn test_special_characters() {
        let key = [10u8; 32];
        let crypto = TokenCrypto::new(&key);

        let plaintext = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~";
        let encrypted = crypto.encrypt(plaintext).unwrap();
        let decrypted = crypto.decrypt(&encrypted).unwrap();

        assert_eq!(plaintext, decrypted);
    }
}
