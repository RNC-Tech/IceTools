pub mod commands;

use commands::system::SystemState;
use commands::window::{app_close, app_maximize, app_minimize, widget_hide};
use commands::api_dispatch;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(SystemState::default())
        .invoke_handler(tauri::generate_handler![
            api_dispatch,
            app_minimize,
            app_maximize,
            app_close,
            widget_hide,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
