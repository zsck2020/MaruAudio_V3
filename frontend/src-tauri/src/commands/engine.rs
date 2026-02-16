#[tauri::command]
pub fn engine_health() -> &'static str {
    "ok"
}
