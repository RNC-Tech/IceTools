use tauri::{Manager, WebviewWindow};

#[tauri::command]
pub fn app_minimize(window: WebviewWindow) -> Result<bool, String> {
    window.minimize().map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub fn app_maximize(window: WebviewWindow) -> Result<bool, String> {
    if window.is_maximized().unwrap_or(false) {
        window.unmaximize().map_err(|e| e.to_string())?;
    } else {
        window.maximize().map_err(|e| e.to_string())?;
    }
    Ok(true)
}

#[tauri::command]
pub fn app_close(window: WebviewWindow) -> Result<bool, String> {
    window.close().map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub fn widget_hide(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    if let Some(w) = app.get_webview_window("widget") {
        let _ = w.hide();
    }
    Ok(serde_json::json!({ "success": true }))
}
