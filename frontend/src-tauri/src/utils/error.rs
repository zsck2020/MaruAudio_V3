use serde::Serialize;
use thiserror::Error;

/// 应用错误类型（部分变体预留用于未来功能）
#[derive(Debug, Error)]
#[allow(dead_code)]
pub enum AppError {
    #[error("认证失败: {0}")]
    Auth(String),

    #[error("Token 已过期")]
    TokenExpired,

    #[error("用户未登录")]
    NotLoggedIn,

    #[error("网络请求失败: {0}")]
    Network(String),

    #[error("存储操作失败: {0}")]
    Storage(String),

    #[error("TTS 引擎错误: {0}")]
    Tts(String),

    #[error("文件操作失败: {0}")]
    File(String),

    #[error("无效的参数: {0}")]
    InvalidInput(String),

    #[error("未知错误: {0}")]
    Unknown(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl From<reqwest::Error> for AppError {
    fn from(err: reqwest::Error) -> Self {
        AppError::Network(err.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Storage(err.to_string())
    }
}

impl From<String> for AppError {
    fn from(err: String) -> Self {
        AppError::Unknown(err)
    }
}

impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::Tts(err.to_string())
    }
}

/// 命令结果类型别名
pub type AppResult<T> = std::result::Result<T, AppError>;
