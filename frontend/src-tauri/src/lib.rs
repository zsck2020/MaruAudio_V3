use tauri::Manager;

mod commands;
mod services;
mod utils;

use crate::utils::session::SessionState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(SessionState::default())
        .setup(|app| {
            let show_item =
                tauri::menu::MenuItemBuilder::with_id("show_main", "显示主窗口").build(app)?;
            let exit_item =
                tauri::menu::MenuItemBuilder::with_id("exit_app", "退出应用").build(app)?;

            let tray_menu = tauri::menu::MenuBuilder::new(app)
                .items(&[&show_item, &exit_item])
                .build()?;

            let tray_icon = app.default_window_icon()
                .ok_or_else(|| "missing default window icon for tray")?
                .clone();

            tauri::tray::TrayIconBuilder::with_id("main_tray")
                .icon(tray_icon)
                .tooltip("丸子配音")
                .menu(&tray_menu)
                .on_menu_event(|app, event| {
                    if event.id() == "show_main" {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    } else if event.id() == "exit_app" {
                        app.exit(0);
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { button, .. } = event {
                        if button == tauri::tray::MouseButton::Left {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::app::ping,
            commands::app::get_banners,
            commands::get_app_version,
            commands::audio::audio_health,
            commands::engine::engine_health,
            commands::file::file_health,
            commands::sample::sample_health,
            commands::tts::tts_health,
            commands::user::user_health,
            commands::user::user_login,
            commands::user::user_register,
            commands::user::user_logout,
            commands::user::user_get_info,
            commands::user::user_refresh_token,
            commands::user::user_sync,
            commands::user::user_is_logged_in
        ])
        .run(tauri::generate_context!())
        .map_err(|e| eprintln!("Error running tauri application: {}", e))
        .ok();
}
