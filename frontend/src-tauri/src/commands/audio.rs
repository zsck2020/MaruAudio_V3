use crate::utils::error::AppResult;

#[tauri::command]
pub fn audio_health() -> AppResult<&'static str> {
    // TODO: 实际检查音频输出目录可写性
    Ok("ok")
}
