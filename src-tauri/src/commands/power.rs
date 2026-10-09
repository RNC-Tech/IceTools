use serde_json::json;
use crate::commands::exec::{run_command, run_powershell};

pub fn list_plans() -> Result<serde_json::Value, String> {
    let out = run_command("powercfg.exe", &["/list"])?;
    let mut plans = Vec::new();

    // Line format: Power Scheme GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (Balanced) *
    for line in out.lines() {
        if let Some(idx) = line.find("Power Scheme GUID:") {
            let rest = &line[idx + "Power Scheme GUID:".len()..].trim();
            if let Some(guid_end) = rest.find(' ') {
                let guid = &rest[..guid_end].trim();
                let after_guid = &rest[guid_end..].trim();
                let active = after_guid.ends_with('*');
                let name = after_guid
                    .trim_end_matches('*')
                    .trim()
                    .trim_start_matches('(')
                    .trim_end_matches(')')
                    .trim();

                plans.push(json!({
                    "guid": guid,
                    "name": name,
                    "active": active
                }));
            }
        }
    }

    Ok(serde_json::Value::Array(plans))
}

pub fn set_active_plan(guid: &str) -> Result<serde_json::Value, String> {
    run_command("powercfg.exe", &["/setactive", guid])?;
    Ok(json!({ "success": true }))
}

pub fn enable_ultimate_performance() -> Result<serde_json::Value, String> {
    let _ = run_command("powercfg.exe", &["-duplicatescheme", "e9a42b02-d5df-448d-aa00-03f14749eb61"]);
    list_plans()
}

pub fn get_battery_info() -> Result<serde_json::Value, String> {
    // Check battery via WMI/PowerShell
    let script = "(Get-CimInstance Win32_Battery | Select-Object EstimatedChargeRemaining, BatteryStatus) | ConvertTo-Json";
    match crate::commands::exec::run_powershell_json(script, &[]) {
        Ok(val) => {
            let first = if val.is_array() { val.as_array().and_then(|a| a.first()).cloned() } else { Some(val) };
            if let Some(b) = first {
                let percent = b["EstimatedChargeRemaining"].as_u64().unwrap_or(100);
                let status = b["BatteryStatus"].as_u64().unwrap_or(1);
                let is_charging = status == 2 || status == 6 || status == 7;
                return Ok(json!({
                    "hasBattery": true,
                    "percent": percent,
                    "isCharging": is_charging,
                    "acConnected": is_charging,
                    "healthPercent": 100
                }));
            }
            Ok(json!({ "hasBattery": false }))
        }
        Err(_) => Ok(json!({ "hasBattery": false })),
    }
}

pub fn get_show_battery_percentage() -> Result<serde_json::Value, String> {
    let script = "(Get-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced' -Name 'ShowBatteryPercentage' -ErrorAction SilentlyContinue).ShowBatteryPercentage";
    match run_powershell(script, &[]) {
        Ok(out) => Ok(json!(out.trim() == "1")),
        Err(_) => Ok(json!(false)),
    }
}

pub fn set_show_battery_percentage(enabled: bool) -> Result<serde_json::Value, String> {
    let val = if enabled { "1" } else { "0" };
    let script = "Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced' -Name 'ShowBatteryPercentage' -Value $env:ICE_VAL -Type DWord -Force";
    run_powershell(script, &[("ICE_VAL", val)])?;
    Ok(json!(enabled))
}
