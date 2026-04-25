use crate::utils::error::AppResult;

#[tauri::command]
pub fn sample_health() -> AppResult<&'static str> {
    // TODO: 实际检查样音库目录与索引
    Ok("ok")
}
