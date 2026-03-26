use crate::utils::api::{ApiClient, LoginResponse, UserInfo};
use crate::utils::error::{AppError, AppResult};
use crate::utils::storage::{AuthTokens, Storage};
use serde::{Deserialize, Serialize};

#[tauri::command]
pub fn user_health() -> &'static str {
    "ok"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResult {
    pub token: String,
    pub refresh_token: String,
    pub user: UserInfo,
}

/// 将 API 登录响应持久化并转换为前端结果
async fn persist_login(app: &tauri::AppHandle, resp: LoginResponse) -> AppResult<LoginResult> {
    let tokens = AuthTokens {
        token: resp.token.clone(),
        refresh_token: resp.refresh_token.clone(),
    };

    Storage::save_tokens(app, &tokens)
        .await
        .map_err(|e| AppError::Storage(format!("Failed to save tokens: {}", e)))?;

    Storage::save_user_info(app, &resp.user)
        .await
        .map_err(|e| AppError::Storage(format!("Failed to save user info: {}", e)))?;

    Ok(LoginResult {
        token: resp.token,
        refresh_token: resp.refresh_token,
        user: resp.user,
    })
}

#[tauri::command]
pub async fn user_login(
    app: tauri::AppHandle,
    username: String,
    password: String,
) -> AppResult<LoginResult> {
    let client = ApiClient::new();
    let resp = client
        .login(username, password)
        .await
        .map_err(|e| AppError::Auth(format!("Login failed: {}", e)))?;
    persist_login(&app, resp).await
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterInput {
    pub username: String,
    pub password: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub invite_code: Option<String>,
}

#[tauri::command]
pub async fn user_register(
    app: tauri::AppHandle,
    request: RegisterInput,
) -> AppResult<LoginResult> {
    let client = ApiClient::new();
    let resp = client
        .register(
            request.username,
            request.password,
            request.email,
            request.phone,
            request.invite_code,
        )
        .await
        .map_err(|e| AppError::Auth(format!("Registration failed: {}", e)))?;
    persist_login(&app, resp).await
}

#[tauri::command]
pub async fn user_logout(app: tauri::AppHandle) -> AppResult<()> {
    Storage::clear_tokens(&app).await?;
    Storage::clear_user_info(&app).await?;
    Ok(())
}

#[tauri::command]
pub async fn user_get_info(app: tauri::AppHandle) -> AppResult<Option<UserInfo>> {
    Storage::get_user_info(&app).await.map_err(|e| e.into())
}

#[tauri::command]
pub async fn user_refresh_token(app: tauri::AppHandle) -> AppResult<LoginResult> {
    let tokens = Storage::get_tokens(&app)
        .await?
        .ok_or(AppError::NotLoggedIn)?;

    let client = ApiClient::new();
    let resp = client
        .refresh_token(&tokens.refresh_token)
        .await
        .map_err(|e| AppError::Auth(format!("Token refresh failed: {}", e)))?;
    persist_login(&app, resp).await
}

#[tauri::command]
pub async fn user_sync(app: tauri::AppHandle) -> AppResult<UserInfo> {
    let tokens = Storage::get_tokens(&app)
        .await?
        .ok_or(AppError::NotLoggedIn)?;

    let client = ApiClient::new();

    match client.sync_user(&tokens.token).await {
        Ok(user_info) => {
            Storage::save_user_info(&app, &user_info)
                .await
                .map_err(|e| AppError::Storage(format!("Failed to save user info: {}", e)))?;
            Ok(user_info)
        }
        Err(_) => {
            // Token 可能已过期，尝试使用 refresh_token 刷新后重试
            let resp = client
                .refresh_token(&tokens.refresh_token)
                .await
                .map_err(|e| {
                    AppError::Auth(format!("Sync failed and token refresh also failed: {}", e))
                })?;
            let new_result = persist_login(&app, resp).await?;

            // 用新 token 重试 sync
            let user_info = client
                .sync_user(&new_result.token)
                .await
                .map_err(|e| AppError::Auth(format!("Sync failed after token refresh: {}", e)))?;
            Storage::save_user_info(&app, &user_info)
                .await
                .map_err(|e| AppError::Storage(format!("Failed to save user info: {}", e)))?;
            Ok(user_info)
        }
    }
}

#[tauri::command]
pub async fn user_is_logged_in(app: tauri::AppHandle) -> AppResult<bool> {
    Ok(Storage::get_tokens(&app).await?.is_some())
}
