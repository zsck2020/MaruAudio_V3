use crate::utils::api::{ApiClient, LoginResponse, UserInfo};
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
async fn persist_login(app: &tauri::AppHandle, resp: LoginResponse) -> Result<LoginResult, String> {
    let tokens = AuthTokens {
        token: resp.token.clone(),
        refresh_token: resp.refresh_token.clone(),
    };

    Storage::save_tokens(app, &tokens).await
        .map_err(|e| format!("Failed to save tokens: {}", e))?;

    Storage::save_user_info(app, &resp.user).await
        .map_err(|e| format!("Failed to save user info: {}", e))?;

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
) -> Result<LoginResult, String> {
    let client = ApiClient::new();
    let resp = client.login(username, password).await
        .map_err(|e| format!("Login failed: {}", e))?;
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
) -> Result<LoginResult, String> {
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
        .map_err(|e| format!("Registration failed: {}", e))?;
    persist_login(&app, resp).await
}

#[tauri::command]
pub async fn user_logout(app: tauri::AppHandle) -> Result<(), String> {
    Storage::clear_tokens(&app).await?;
    Storage::clear_user_info(&app).await?;
    Ok(())
}

#[tauri::command]
pub async fn user_get_info(app: tauri::AppHandle) -> Result<Option<UserInfo>, String> {
    Storage::get_user_info(&app).await
}

#[tauri::command]
pub async fn user_refresh_token(app: tauri::AppHandle) -> Result<LoginResult, String> {
    let tokens = Storage::get_tokens(&app).await?
        .ok_or_else(|| "No refresh token found".to_string())?;
    
    let client = ApiClient::new();
    let resp = client.refresh_token(&tokens.refresh_token).await
        .map_err(|e| format!("Token refresh failed: {}", e))?;
    persist_login(&app, resp).await
}

#[tauri::command]
pub async fn user_sync(app: tauri::AppHandle) -> Result<UserInfo, String> {
    let tokens = Storage::get_tokens(&app).await?
        .ok_or_else(|| "Not logged in".to_string())?;
    
    let client = ApiClient::new();
    
    match client.sync_user(&tokens.token).await {
        Ok(user_info) => {
            Storage::save_user_info(&app, &user_info).await
                .map_err(|e| format!("Failed to save user info: {}", e))?;
            Ok(user_info)
        }
        Err(_) => {
            // Token 可能已过期，尝试使用 refresh_token 刷新后重试
            let resp = client.refresh_token(&tokens.refresh_token).await
                .map_err(|e| format!("Sync failed and token refresh also failed: {}", e))?;
            let new_result = persist_login(&app, resp).await?;
            
            // 用新 token 重试 sync
            let user_info = client.sync_user(&new_result.token).await
                .map_err(|e| format!("Sync failed after token refresh: {}", e))?;
            Storage::save_user_info(&app, &user_info).await
                .map_err(|e| format!("Failed to save user info: {}", e))?;
            Ok(user_info)
        }
    }
}

#[tauri::command]
pub async fn user_is_logged_in(app: tauri::AppHandle) -> Result<bool, String> {
    Ok(Storage::get_tokens(&app).await?.is_some())
}
