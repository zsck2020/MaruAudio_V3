#[tauri::command]
pub fn sample_health() -> &'static str {
    "ok"
}

