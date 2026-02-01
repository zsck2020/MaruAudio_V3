use tauri::command;

#[command]
pub async fn list_files(category: Option<String>) -> Result<Vec<serde_json::Value>, String> {
    // TODO: 实现文件列表逻辑
    Ok(vec![])
}

#[command]
pub async fn delete_file(path: String) -> Result<(), String> {
    // TODO: 实现文件删除逻辑
    Ok(())
}

