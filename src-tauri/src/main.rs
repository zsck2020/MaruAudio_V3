// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod services;
mod utils;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::audio::generate_audio,
            commands::audio::process_reference_audio,
            commands::engine::switch_engine,
            commands::file::list_files,
            commands::file::delete_file,
            commands::user::login,
        ])
        .setup(|_app| {
            // 初始化应用设置
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

