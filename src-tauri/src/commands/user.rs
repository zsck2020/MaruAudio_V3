use crate::utils::api::{ApiClient, UserInfo};
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

#[tauri::command]
pub async fn user_login(
    app: tauri::AppHandle,
    username: String,
    password: String,
) -> Result<LoginResult, String> {
    let client = ApiClient::new();
    
    match client.login(username, password).await {
        Ok(login_response) => {
            let tokens = AuthTokens {
                token: login_response.token.clone(),
                refresh_token: login_response.refresh_token.clone(),
            };
            
            Storage::save_tokens(&app, &tokens).await
                .map_err(|e| format!("Failed to save tokens: {}", e))?;
            
            Storage::save_user_info(&app, &login_response.user).await
                .map_err(|e| format!("Failed to save user info: {}", e))?;
            
            Ok(LoginResult {
                token: login_response.token,
                refresh_token: login_response.refresh_token,
                user: login_response.user,
            })
        }
        Err(e) => Err(format!("Login failed: {}", e)),
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub password: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub invite_code: Option<String>,
}

#[tauri::command]
pub async fn user_register(
    app: tauri::AppHandle,
    request: RegisterRequest,
) -> Result<LoginResult, String> {
    let client = ApiClient::new();
    
    match client
        .register(
            request.username,
            request.password,
            request.email,
            request.phone,
            request.invite_code,
        )
        .await
    {
        Ok(login_response) => {
            let tokens = AuthTokens {
                token: login_response.token.clone(),
                refresh_token: login_response.refresh_token.clone(),
            };
            
            Storage::save_tokens(&app, &tokens).await
                .map_err(|e| format!("Failed to save tokens: {}", e))?;
            
            Storage::save_user_info(&app, &login_response.user).await
                .map_err(|e| format!("Failed to save user info: {}", e))?;
            
            Ok(LoginResult {
                token: login_response.token,
                refresh_token: login_response.refresh_token,
                user: login_response.user,
            })
        }
        Err(e) => Err(format!("Registration failed: {}", e)),
    }
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
    
    match client.refresh_token(&tokens.refresh_token).await {
        Ok(login_response) => {
            let new_tokens = AuthTokens {
                token: login_response.token.clone(),
                refresh_token: login_response.refresh_token.clone(),
            };
            
            Storage::save_tokens(&app, &new_tokens).await
                .map_err(|e| format!("Failed to save tokens: {}", e))?;
            
            Storage::save_user_info(&app, &login_response.user).await
                .map_err(|e| format!("Failed to save user info: {}", e))?;
            
            Ok(LoginResult {
                token: login_response.token,
                refresh_token: login_response.refresh_token,
                user: login_response.user,
            })
        }
        Err(e) => Err(format!("Token refresh failed: {}", e)),
    }
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
        Err(e) => Err(format!("Sync failed: {}", e)),
    }
}

#[tauri::command]
pub async fn user_is_logged_in(app: tauri::AppHandle) -> Result<bool, String> {
    Ok(Storage::get_tokens(&app).await?.is_some())
}

