use std::fs;
use std::path::PathBuf;
use std::process::Command;
use serde_json::{json, Value};
use crate::commands::exec::CREATE_NO_WINDOW;
use std::os::windows::process::CommandExt;

fn get_app_dir() -> PathBuf {
    let app_data = std::env::var("APPDATA").unwrap_or_else(|_| ".".into());
    let dir = PathBuf::from(app_data).join("IceTools");
    let _ = fs::create_dir_all(&dir);
    dir
}

fn get_bin_path() -> PathBuf {
    let bin_dir = get_app_dir().join("bin");
    let _ = fs::create_dir_all(&bin_dir);
    bin_dir.join("yt-dlp.exe")
}

fn get_history_path() -> PathBuf {
    get_app_dir().join("download-history.json")
}

pub fn is_installed() -> Result<bool, String> {
    if get_bin_path().exists() {
        return Ok(true);
    }
    // Check if in PATH
    let mut cmd = Command::new("yt-dlp.exe");
    cmd.arg("--version");
    cmd.creation_flags(CREATE_NO_WINDOW);
    Ok(cmd.output().is_ok())
}

pub fn install() -> Result<serde_json::Value, String> {
    let bin = get_bin_path();
    let url = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe";
    let script = format!(
        "Invoke-WebRequest -Uri '{}' -OutFile '{}' -UseBasicParsing",
        url,
        bin.to_string_lossy()
    );
    crate::commands::exec::run_powershell(&script, &[])?;
    Ok(json!({ "success": true }))
}

pub fn list_formats(url: &str) -> Result<serde_json::Value, String> {
    let bin = if get_bin_path().exists() {
        get_bin_path().to_string_lossy().to_string()
    } else {
        "yt-dlp.exe".to_string()
    };

    let mut cmd = Command::new(&bin);
    cmd.args(["-J", url]);
    cmd.creation_flags(CREATE_NO_WINDOW);
    let out = cmd.output().map_err(|e| e.to_string())?;
    let json_str = String::from_utf8_lossy(&out.stdout);
    let parsed: Value = serde_json::from_str(&json_str).map_err(|e| e.to_string())?;

    let formats = parsed.get("formats").cloned().unwrap_or(json!([]));
    Ok(formats)
}

pub fn get_info(url: &str) -> Result<serde_json::Value, String> {
    let bin = if get_bin_path().exists() {
        get_bin_path().to_string_lossy().to_string()
    } else {
        "yt-dlp.exe".to_string()
    };

    let mut cmd = Command::new(&bin);
    cmd.args(["-J", "--flat-playlist", url]);
    cmd.creation_flags(CREATE_NO_WINDOW);
    let out = cmd.output().map_err(|e| e.to_string())?;
    let json_str = String::from_utf8_lossy(&out.stdout);
    let parsed: Value = serde_json::from_str(&json_str).map_err(|e| e.to_string())?;
    Ok(parsed)
}

pub fn get_history() -> Result<Value, String> {
    let p = get_history_path();
    if let Ok(content) = fs::read_to_string(p) {
        if let Ok(val) = serde_json::from_str::<Value>(&content) {
            return Ok(val);
        }
    }
    Ok(json!([]))
}

pub fn clear_history() -> Result<Value, String> {
    let _ = fs::write(get_history_path(), "[]");
    Ok(json!({ "success": true }))
}

pub fn open_history_item(file_path: &str) -> Result<Value, String> {
    let mut cmd = Command::new("explorer.exe");
    cmd.args(["/select,", file_path]);
    let _ = cmd.spawn();
    Ok(json!({ "success": true }))
}

pub fn remove_history_item(id: &str) -> Result<Value, String> {
    let mut hist = get_history()?;
    if let Some(arr) = hist.as_array_mut() {
        arr.retain(|item| item["id"].as_str() != Some(id) && item["filePath"].as_str() != Some(id));
    }
    let _ = fs::write(get_history_path(), serde_json::to_string_pretty(&hist).unwrap_or_default());
    Ok(json!({ "success": true }))
}

pub fn delete_file_and_history_item(id: &str, file_path: &str) -> Result<Value, String> {
    let target = if !file_path.is_empty() { file_path } else { id };
    let _ = fs::remove_file(target);
    remove_history_item(id)
}
