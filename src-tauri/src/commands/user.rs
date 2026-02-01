use tauri::command;

#[command]
pub async fn login(_email: String, _password: String) -> Result<serde_json::Value, String> {
    // TODO: 实现登录逻辑
    Err("未实现".to_string())
}

