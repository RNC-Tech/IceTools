use std::process::Command;
use serde_json::json;

pub fn run_ctt_win_util() -> Result<serde_json::Value, String> {
    let mut cmd = Command::new("cmd.exe");
    cmd.args([
        "/c", "start", "CTT Windows Utility", "powershell.exe",
        "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "irm christitus.com/win | iex"
    ]);
    cmd.spawn().map_err(|e| e.to_string())?;
    Ok(json!({ "success": true }))
}

pub fn run_massgrave_activation() -> Result<serde_json::Value, String> {
    let mut cmd = Command::new("cmd.exe");
    cmd.args([
        "/c", "start", "Mass Grave Activation", "powershell.exe",
        "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "irm https://get.activated.win | iex"
    ]);
    cmd.spawn().map_err(|e| e.to_string())?;
    Ok(json!({ "success": true }))
}
