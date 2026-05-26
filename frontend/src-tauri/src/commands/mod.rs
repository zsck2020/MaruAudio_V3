pub mod app;
pub mod audio;
pub mod engine;
pub mod export;
pub mod file;
pub mod llm;
pub mod sample;
pub mod subtitle;
pub mod tts;
pub mod user;

#[tauri::command]
pub fn get_app_version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}
