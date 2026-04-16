use crate::utils::api::{ApiClient, ApiError, LoginResponse, UserInfo};
use crate::utils::error::{AppError, AppResult};
use crate::utils::session::SessionState;
use crate::utils::storage::{AuthTokens, Storage};
use serde::{Deserialize, Serialize};

#[tauri::command]
pub fn user_health() -> &'static str {
    "ok"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResult {
    pub user: UserInfo,
}

fn has_persistent_auth_tokens(tokens: &AuthTokens) -> bool {
    !tokens.token.trim().is_empty() && !tokens.refresh_token.trim().is_empty()
}

async fn get_refresh_token(app: &tauri::AppHandle, session: &SessionState) -> AppResult<String> {
    if let Some(refresh_token) = session.get_refresh_token() {
        if !refresh_token.trim().is_empty() {
            return Ok(refresh_token);
        }
    }

    let tokens = Storage::get_tokens(app)
        .await?
        .ok_or(AppError::NotLoggedIn)?;

    if tokens.refresh_token.trim().is_empty() {
        return Err(AppError::TokenExpired);
    }

    session.set_refresh_token(tokens.refresh_token.clone());
    Ok(tokens.refresh_token)
}

async fn persist_login(
    app: &tauri::AppHandle,
    session: &SessionState,
    resp: LoginResponse,
) -> AppResult<LoginResult> {
    let tokens = AuthTokens {
        token: resp.token.clone(),
        refresh_token: resp.refresh_token.clone(),
    };

    Storage::save_tokens(app, &tokens)
        .await
        .map_err(|e| AppError::Storage(format!("Failed to save tokens: {}", e)))?;

    session.set_refresh_token(resp.refresh_token);

    Storage::save_user_info(app, &resp.user)
        .await
        .map_err(|e| AppError::Storage(format!("Failed to save user info: {}", e)))?;

    Ok(LoginResult { user: resp.user })
}

fn map_auth_api_error(context: &str, err: ApiError) -> AppError {
    match err {
        ApiError::Request(message) => AppError::Network(format!("{}: {}", context, message)),
        other => AppError::Auth(format!("{}: {}", context, other)),
    }
}

fn map_sync_api_error(err: ApiError) -> AppError {
    match err {
        ApiError::Request(message) => AppError::Network(format!("User sync failed: {}", message)),
        other => AppError::Auth(format!("User sync failed: {}", other)),
    }
}

#[tauri::command]
pub async fn user_login(
    app: tauri::AppHandle,
    session: tauri::State<'_, SessionState>,
    username: String,
    password: String,
) -> AppResult<LoginResult> {
    let client = ApiClient::new();
    let resp = client
        .login(username, password)
        .await
        .map_err(|e| map_auth_api_error("Login failed", e))?;
    persist_login(&app, session.inner(), resp).await
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
    session: tauri::State<'_, SessionState>,
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
        .map_err(|e| map_auth_api_error("Registration failed", e))?;
    persist_login(&app, session.inner(), resp).await
}

#[tauri::command]
pub async fn user_logout(
    app: tauri::AppHandle,
    session: tauri::State<'_, SessionState>,
) -> AppResult<()> {
    Storage::clear_tokens(&app).await?;
    Storage::clear_user_info(&app).await?;
    session.clear_refresh_token();
    Ok(())
}

#[tauri::command]
pub async fn user_get_info(app: tauri::AppHandle) -> AppResult<Option<UserInfo>> {
    Storage::get_user_info(&app).await.map_err(|e| e.into())
}

#[tauri::command]
pub async fn user_refresh_token(
    app: tauri::AppHandle,
    session: tauri::State<'_, SessionState>,
) -> AppResult<LoginResult> {
    let tokens = Storage::get_tokens(&app)
        .await?
        .ok_or(AppError::NotLoggedIn)?;
    if !has_persistent_auth_tokens(&tokens) {
        return Err(AppError::TokenExpired);
    }

    let refresh_token = get_refresh_token(&app, session.inner()).await?;

    let client = ApiClient::new();
    let resp = client
        .refresh_token(&refresh_token)
        .await
        .map_err(|e| map_auth_api_error("Token refresh failed", e))?;
    persist_login(&app, session.inner(), resp).await
}

#[tauri::command]
pub async fn user_sync(
    app: tauri::AppHandle,
    session: tauri::State<'_, SessionState>,
) -> AppResult<UserInfo> {
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
        Err(err) if err.is_authentication_error() => {
            let refresh_token = get_refresh_token(&app, session.inner()).await?;
            let resp = client
                .refresh_token(&refresh_token)
                .await
                .map_err(|e| map_auth_api_error("Token refresh failed after session expiry", e))?;
            let refreshed_access_token = resp.token.clone();
            persist_login(&app, session.inner(), resp).await?;

            let user_info = client
                .sync_user(&refreshed_access_token)
                .await
                .map_err(map_sync_api_error)?;
            Storage::save_user_info(&app, &user_info)
                .await
                .map_err(|e| AppError::Storage(format!("Failed to save user info: {}", e)))?;
            Ok(user_info)
        }
        Err(err) => Err(map_sync_api_error(err)),
    }
}

#[tauri::command]
pub async fn user_is_logged_in(app: tauri::AppHandle) -> AppResult<bool> {
    Ok(Storage::get_tokens(&app)
        .await?
        .map(|tokens| has_persistent_auth_tokens(&tokens))
        .unwrap_or(false))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_user() -> UserInfo {
        UserInfo {
            id: 7,
            username: "tester".into(),
            email: Some("tester@example.com".into()),
            phone: None,
            status: "active".into(),
            characters: 99,
            invite_code: Some("INVITE".into()),
        }
    }

    #[test]
    fn login_result_serialization_does_not_expose_tokens() {
        let value = serde_json::to_value(LoginResult {
            user: sample_user(),
        })
        .expect("login result should serialize");

        assert!(
            value.get("token").is_none(),
            "access token leaked to frontend payload"
        );
        assert!(
            value.get("refresh_token").is_none(),
            "refresh token leaked to frontend payload"
        );
    }

    #[test]
    fn persistent_login_requires_both_tokens() {
        assert!(!has_persistent_auth_tokens(&AuthTokens {
            token: "access-token".into(),
            refresh_token: String::new(),
        }));
        assert!(has_persistent_auth_tokens(&AuthTokens {
            token: "access-token".into(),
            refresh_token: "refresh-token".into(),
        }));
    }
}
