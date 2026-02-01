use tauri::command;

#[command]
pub async fn switch_engine(_version: String) -> Result<(), String> {
    // TODO: 实现引擎切换逻辑
    Ok(())
}

