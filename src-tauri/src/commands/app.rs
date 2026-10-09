use std::process::Command;
use std::os::windows::process::CommandExt;
use crate::commands::exec::{run_powershell, CREATE_NO_WINDOW};

pub fn is_admin() -> bool {
    let script = "([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)";
    match run_powershell(script, &[]) {
        Ok(out) => out.trim().eq_ignore_ascii_case("true"),
        Err(_) => false,
    }
}

pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

pub fn relaunch_as_admin() -> Result<serde_json::Value, String> {
    let current_exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let exe_str = current_exe.to_string_lossy().replace('\'', "''");
    let script = format!("Start-Process -FilePath '{}' -Verb RunAs", exe_str);

    let mut cmd = Command::new("powershell.exe");
    cmd.args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", &script]);
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd.spawn().map_err(|e| e.to_string())?;

    std::thread::spawn(|| {
        std::thread::sleep(std::time::Duration::from_millis(300));
        std::process::exit(0);
    });

    Ok(serde_json::json!({ "success": true }))
}

pub fn open_external(url: &str) -> Result<bool, String> {
    if url.starts_with("http://") || url.starts_with("https://") || url.starts_with("windowsdefender:") {
        let mut cmd = Command::new("cmd.exe");
        cmd.args(["/c", "start", "", url]);
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.spawn().map_err(|e| e.to_string())?;
        Ok(true)
    } else {
        Err("Invalid URL protocol".to_string())
    }
}
