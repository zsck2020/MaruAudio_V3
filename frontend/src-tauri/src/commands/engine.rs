use crate::services::tts::{self, TtsState, HealthResponse};
use crate::utils::error::AppResult;
use tauri::State;

/// 检查引擎健康状态
#[tauri::command]
pub async fn engine_health(state: State<'_, TtsState>) -> AppResult<HealthResponse> {
    let health = tts::check_health(&state).await?;
    Ok(health)
}
