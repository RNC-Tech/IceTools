use std::process::Command;
use std::os::windows::process::CommandExt;
use serde_json::json;
use crate::commands::exec::{run_powershell, run_powershell_json, CREATE_NO_WINDOW};

const UNINSTALL_LIST_SCRIPT: &str = r#"
$paths = @(
  'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*',
  'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
  'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*'
)
Get-ItemProperty -Path $paths -ErrorAction SilentlyContinue |
  Where-Object { $_.DisplayName -and -not $_.SystemComponent -and -not $_.ParentKeyName } |
  Select-Object DisplayName, Publisher, DisplayVersion, InstallLocation, UninstallString, QuietUninstallString, EstimatedSize, DisplayIcon,
    @{N='KeyPath'; E={
      ($_.PSPath -replace '^Microsoft\.PowerShell\.Core\\Registry::HKEY_LOCAL_MACHINE','HKLM:') -replace '^Microsoft\.PowerShell\.Core\\Registry::HKEY_CURRENT_USER','HKCU:'
    }} |
  ConvertTo-Json -Depth 3
"#;

pub fn list_apps() -> Result<serde_json::Value, String> {
    let raw = run_powershell_json(UNINSTALL_LIST_SCRIPT, &[])?;
    let mut apps = Vec::new();

    if let Some(arr) = raw.as_array() {
        for a in arr {
            let display_name = a["DisplayName"].as_str().unwrap_or("");
            if display_name.is_empty() {
                continue;
            }
            let key_path = a["KeyPath"].as_str().unwrap_or("");
            let publisher = a["Publisher"].as_str();
            let version = a["DisplayVersion"].as_str();
            let install_loc = a["InstallLocation"].as_str();
            let size_bytes = a["EstimatedSize"].as_u64().map(|kb| kb * 1024);

            let display_icon = a["DisplayIcon"].as_str().and_then(crate::commands::icons::parse_display_icon);
            let uninstall_str = a["UninstallString"].as_str().and_then(crate::commands::icons::extract_exe_path);
            let icon_path = display_icon.or(uninstall_str);
            let icon = icon_path.as_deref().and_then(crate::commands::icons::get_cached_icon);

            apps.push(json!({
                "keyPath": key_path,
                "displayName": display_name,
                "publisher": publisher,
                "version": version,
                "installLocation": install_loc,
                "sizeBytes": size_bytes,
                "icon": icon
            }));
        }
    }

    apps.sort_by(|a, b| {
        let name_a = a["displayName"].as_str().unwrap_or("");
        let name_b = b["displayName"].as_str().unwrap_or("");
        name_a.to_lowercase().cmp(&name_b.to_lowercase())
    });

    Ok(serde_json::Value::Array(apps))
}

pub fn uninstall_app(key_path: &str) -> Result<serde_json::Value, String> {
    let script = "(Get-ItemProperty -Path $env:ICE_KEY -ErrorAction Stop).UninstallString";
    let cmd_str = run_powershell(script, &[("ICE_KEY", key_path)])?;

    if cmd_str.is_empty() {
        return Err("No uninstall string found".into());
    }

    let mut child = Command::new("cmd.exe");
    child.args(["/c", &cmd_str]);
    child.creation_flags(CREATE_NO_WINDOW);
    child.spawn().map_err(|e| e.to_string())?;

    Ok(json!({ "success": true }))
}

pub fn scan_leftovers(apps: &[serde_json::Value]) -> Result<serde_json::Value, String> {
    let _ = apps;
    Ok(json!([]))
}

pub fn delete_leftovers(items: &[String]) -> Result<serde_json::Value, String> {
    let mut outcomes = Vec::new();
    for item in items {
        let path = std::path::Path::new(item);
        let ok = if path.is_file() {
            std::fs::remove_file(path).is_ok()
        } else if path.is_dir() {
            std::fs::remove_dir_all(path).is_ok()
        } else {
            true
        };
        outcomes.push(json!({ "item": item, "success": ok }));
    }
    Ok(serde_json::Value::Array(outcomes))
}
