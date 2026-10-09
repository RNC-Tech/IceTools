use serde_json::json;
use crate::commands::exec::{run_powershell_json, CREATE_NO_WINDOW};
use std::process::Command;
use std::os::windows::process::CommandExt;

pub fn get_defender_status() -> Result<serde_json::Value, String> {
    let script = "Get-MpComputerStatus | Select-Object AntivirusEnabled, RealTimeProtectionEnabled, AntispywareEnabled, AntivirusSignatureAge, IoavProtectionEnabled | ConvertTo-Json";
    match run_powershell_json(script, &[]) {
        Ok(raw) => {
            let status = if raw.is_array() {
                raw.as_array().and_then(|a| a.first()).cloned()
            } else {
                Some(raw)
            };
            if let Some(s) = status {
                return Ok(json!({
                    "available": true,
                    "antivirusEnabled": s["AntivirusEnabled"].as_bool().unwrap_or(false),
                    "realTimeProtectionEnabled": s["RealTimeProtectionEnabled"].as_bool().unwrap_or(false),
                    "antispywareEnabled": s["AntispywareEnabled"].as_bool().unwrap_or(false),
                    "signatureAgeDays": s["AntivirusSignatureAge"].as_u64()
                }));
            }
            Ok(json!({ "available": false }))
        }
        Err(_) => Ok(json!({ "available": false })),
    }
}

pub fn get_firewall_status() -> Result<serde_json::Value, String> {
    let script = "Get-NetFirewallProfile | Select-Object Name, Enabled | ConvertTo-Json";
    match run_powershell_json(script, &[]) {
        Ok(raw) => {
            let profiles = if let Some(arr) = raw.as_array() {
                arr.iter().map(|p| json!({
                    "name": p["Name"].as_str().unwrap_or(""),
                    "enabled": p["Enabled"].as_bool().unwrap_or(false)
                })).collect()
            } else {
                vec![json!({
                    "name": raw["Name"].as_str().unwrap_or(""),
                    "enabled": raw["Enabled"].as_bool().unwrap_or(false)
                })]
            };
            Ok(json!({ "available": true, "profiles": profiles }))
        }
        Err(_) => Ok(json!({ "available": false, "profiles": [] })),
    }
}

pub fn open_windows_security() -> Result<serde_json::Value, String> {
    let mut cmd = Command::new("cmd.exe");
    cmd.args(["/c", "start", "windowsdefender:"]);
    cmd.creation_flags(CREATE_NO_WINDOW);
    let _ = cmd.spawn();
    Ok(json!({ "success": true }))
}
