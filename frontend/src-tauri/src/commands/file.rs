use crate::utils::error::AppResult;

#[tauri::command]
pub fn file_health() -> AppResult<&'static str> {
    // TODO: 实际检查文件存储目录可访问性
    Ok("ok")
}
