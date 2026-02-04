mod commands;
mod services;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::app::ping,
            commands::get_app_version,
            commands::audio::audio_health,
            commands::engine::engine_health,
            commands::file::file_health,
            commands::sample::sample_health,
            commands::tts::tts_health,
            commands::user::user_health
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
