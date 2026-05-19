use tauri::Manager;

mod commands;
mod services;
mod utils;

use crate::utils::session::SessionState;
use crate::services::tts::TtsState;
use crate::services::subtitle::SubtitleState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(SessionState::default())
        .manage(TtsState::new())
        .manage(SubtitleState::new())
        .setup(|app| {
            // 按主屏幕分辨率智能调整初始窗口大小
            //
            // 策略：取主屏幕逻辑尺寸的 75% × 80%，并在 minWidth/minHeight ~ 1920x1200 之间夹紧
            // 这样 1366x768 笔记本/1440p/4K 大屏都能拿到舒适的初始尺寸，启动后再次居中
            //
            // 配合 tauri.conf.json 里 resizable: false 锁住边缘拖动 resize，
            // 用户只能通过最大化/还原按钮切换窗口尺寸
            if let Some(main_window) = app.get_webview_window("main") {
                if let Ok(Some(monitor)) = main_window.primary_monitor() {
                    let monitor_size = monitor.size();
                    let scale = monitor.scale_factor();
                    let logical_w = (monitor_size.width as f64) / scale;
                    let logical_h = (monitor_size.height as f64) / scale;

                    // 取主屏可视区域的 75%×80%，夹紧到 [min, 1920×1200]
                    let target_w = (logical_w * 0.75).clamp(1024.0, 1920.0);
                    let target_h = (logical_h * 0.80).clamp(700.0, 1200.0);

                    let _ = main_window.set_size(tauri::LogicalSize::new(target_w, target_h));
                    let _ = main_window.center();
                }
            }

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
            commands::tts::tts_check_health,
            commands::tts::tts_synthesize,
            commands::tts::tts_synthesize_stream,
            commands::tts::tts_preload_engine,
            commands::tts::tts_cancel,
            commands::subtitle::subtitle_transcribe_stream,
            commands::subtitle::subtitle_cancel,
            commands::subtitle::subtitle_read_output,
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
