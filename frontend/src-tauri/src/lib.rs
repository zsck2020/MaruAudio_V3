use tauri::Manager;

mod commands;
mod services;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 系统托盘与托盘菜单
        .setup(|app| {
            // 托盘菜单项：打开窗口
            let show_item =
                tauri::menu::MenuItemBuilder::with_id("show_main", "打开窗口").build(app)?;
            // 托盘菜单项：退出应用
            let exit_item =
                tauri::menu::MenuItemBuilder::with_id("exit_app", "退出").build(app)?;

            // 托盘菜单
            let tray_menu = tauri::menu::MenuBuilder::new(app)
                .items(&[&show_item, &exit_item])
                .build()?;

            // 创建托盘图标，使用应用默认图标（项目通用 logo）
            tauri::tray::TrayIconBuilder::with_id("main_tray")
                .icon(
                    app.default_window_icon()
                        .expect("missing default window icon for tray")
                        .clone(),
                )
                .tooltip("丸子配音")
                .menu(&tray_menu)
                // 托盘菜单事件处理
                .on_menu_event(|app, event| {
                    if event.id() == "show_main" {
                        if let Some(window) = app.get_webview_window("main") {
                            if let Err(_e) = window.show() {
                                // 忽略显示失败
                            }
                            if let Err(_e) = window.set_focus() {
                                // 忽略聚焦失败
                            }
                        }
                    } else if event.id() == "exit_app" {
                        app.exit(0);
                    }
                })
                // 托盘图标事件：左键双击打开主窗口
                .on_tray_icon_event(|tray, event| {
                    // 鼠标左键单击托盘图标：一键打开/激活主窗口
                    if let tauri::tray::TrayIconEvent::Click { button, .. } = event {
                        // 仅处理左键点击，右键仍由系统托盘菜单接管
                        if button == tauri::tray::MouseButton::Left {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                // 尝试显示窗口（如果被隐藏/最小化）
                                let _ = window.show();
                                // 尝试将窗口置于前台并聚焦
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        // 拦截窗口关闭事件：点击右上角关闭，只隐藏窗口，保留托盘常驻
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // 阻止默认关闭行为
                api.prevent_close();
                // 隐藏主窗口
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
        .expect("error while running tauri application");
}
