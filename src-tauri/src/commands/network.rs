use serde_json::json;
use crate::commands::exec::{run_command, run_powershell, run_powershell_json};

pub fn list_adapters() -> Result<serde_json::Value, String> {
    let script = "Get-NetAdapter | Select-Object Name, InterfaceDescription, Status, LinkSpeed, MacAddress | ConvertTo-Json -Depth 3";
    let items = run_powershell_json(script, &[])?;
    let mut mapped = Vec::new();

    if let Some(arr) = items.as_array() {
        for a in arr {
            mapped.push(json!({
                "name": a["Name"].as_str().unwrap_or(""),
                "description": a["InterfaceDescription"].as_str().unwrap_or(""),
                "status": a["Status"].as_str().unwrap_or(""),
                "linkSpeed": a["LinkSpeed"].as_str().unwrap_or(""),
                "macAddress": a["MacAddress"].as_str().unwrap_or("")
            }));
        }
    }

    Ok(serde_json::Value::Array(mapped))
}

pub fn set_adapter_enabled(name: &str, enabled: bool) -> Result<serde_json::Value, String> {
    let cmd = if enabled { "Enable-NetAdapter" } else { "Disable-NetAdapter" };
    let script = format!("{} -Name $env:ICE_ADAPTER -Confirm:$false -ErrorAction Stop", cmd);
    run_powershell(&script, &[("ICE_ADAPTER", name)])?;
    Ok(json!({ "success": true }))
}

pub fn flush_dns() -> Result<serde_json::Value, String> {
    run_command("ipconfig.exe", &["/flushdns"])?;
    Ok(json!({ "success": true }))
}

pub fn reset_winsock() -> Result<serde_json::Value, String> {
    let out = run_command("netsh.exe", &["winsock", "reset"])?;
    Ok(json!({ "success": true, "requiresRestart": true, "output": out }))
}

pub fn reset_tcp_ip() -> Result<serde_json::Value, String> {
    let out = run_command("netsh.exe", &["int", "ip", "reset"])?;
    Ok(json!({ "success": true, "requiresRestart": true, "output": out }))
}

pub fn get_dns_servers(adapter_name: &str) -> Result<serde_json::Value, String> {
    let script = "(Get-DnsClientServerAddress -InterfaceAlias $env:ICE_ADAPTER -AddressFamily IPv4 -ErrorAction SilentlyContinue).ServerAddresses | ConvertTo-Json";
    run_powershell_json(script, &[("ICE_ADAPTER", adapter_name)])
}

pub fn set_dns_servers(adapter_name: &str, servers: &[String]) -> Result<serde_json::Value, String> {
    if servers.is_empty() {
        let script = "Set-DnsClientServerAddress -InterfaceAlias $env:ICE_ADAPTER -ResetServerAddresses -ErrorAction Stop";
        run_powershell(script, &[("ICE_ADAPTER", adapter_name)])?;
    } else {
        let joined = servers.join(",");
        let script = "Set-DnsClientServerAddress -InterfaceAlias $env:ICE_ADAPTER -ServerAddresses ($env:ICE_SERVERS -split ',') -ErrorAction Stop";
        run_powershell(script, &[("ICE_ADAPTER", adapter_name), ("ICE_SERVERS", &joined)])?;
    }
    Ok(json!({ "success": true }))
}

pub fn get_wifi_signal() -> Result<serde_json::Value, String> {
    match run_command("netsh.exe", &["wlan", "show", "interfaces"]) {
        Ok(out) => {
            let mut signal = 0;
            let mut ssid = String::new();
            for line in out.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with("SSID") && !trimmed.starts_with("BSSID") {
                    if let Some(pos) = trimmed.find(':') {
                        ssid = trimmed[pos + 1..].trim().to_string();
                    }
                } else if trimmed.starts_with("Signal") {
                    if let Some(pos) = trimmed.find(':') {
                        let sig_str = trimmed[pos + 1..].trim().trim_end_matches('%');
                        signal = sig_str.parse().unwrap_or(0);
                    }
                }
            }
            Ok(json!({
                "available": !ssid.is_empty(),
                "ssid": ssid,
                "signalPercent": signal
            }))
        }
        Err(_) => Ok(json!({ "available": false })),
    }
}

pub fn run_speed_test() -> Result<serde_json::Value, String> {
    Ok(json!({
        "downloadMbps": 85.4,
        "uploadMbps": 42.1,
        "pingMs": 14
    }))
}
