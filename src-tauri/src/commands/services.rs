use serde_json::json;
use crate::commands::exec::{run_powershell, run_powershell_json};

const LIST_SERVICES_SCRIPT: &str = r#"
$paths = @{}
Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Services\*' -Name ImagePath -ErrorAction SilentlyContinue |
  ForEach-Object { $paths[$_.PSChildName] = $_.ImagePath }
Get-Service | Select-Object Name, DisplayName,
  @{Name='Status'; Expression={$_.Status.ToString()}},
  @{Name='StartType'; Expression={$_.StartType.ToString()}},
  @{Name='ImagePath'; Expression={$paths[$_.Name]}} |
ConvertTo-Json -Depth 3
"#;

pub fn list() -> Result<serde_json::Value, String> {
    let items = run_powershell_json(LIST_SERVICES_SCRIPT, &[])?;
    let mut mapped = Vec::new();

    if let Some(arr) = items.as_array() {
        for s in arr {
            let name = s["Name"].as_str().unwrap_or("");
            let display_name = s["DisplayName"].as_str().unwrap_or("");
            let status = s["Status"].as_str().unwrap_or("");
            let start_type = s["StartType"].as_str().unwrap_or("");
            let image_path = s["ImagePath"].as_str().unwrap_or("");

            let exe_path = crate::commands::icons::extract_exe_path(image_path);
            let icon = exe_path.as_deref().and_then(crate::commands::icons::get_cached_icon);

            mapped.push(json!({
                "name": name,
                "displayName": display_name,
                "status": status,
                "startType": start_type,
                "exePath": image_path,
                "icon": icon
            }));
        }
    }

    Ok(serde_json::Value::Array(mapped))
}

pub fn set_status(name: &str, action: &str) -> Result<serde_json::Value, String> {
    if name.is_empty() {
        return Err("Service name required".into());
    }
    let cmd = match action {
        "start" => "Start-Service",
        "stop" => "Stop-Service",
        "restart" => "Restart-Service",
        _ => return Err("Invalid service action".into()),
    };

    if !crate::commands::app::is_admin() {
        return Err(format!(
            "Administrator rights required to {} service '{}'. Please click 'Restart as Admin' at the top.",
            action, name
        ));
    }

    let script = format!("{} -Name $env:ICE_SVC -Force -ErrorAction Stop", cmd);
    run_powershell(&script, &[("ICE_SVC", name)])?;
    Ok(json!({ "success": true }))
}

pub fn set_start_type(name: &str, start_type: &str) -> Result<serde_json::Value, String> {
    let valid = ["Automatic", "AutomaticDelayedStart", "Manual", "Disabled"];
    if !valid.contains(&start_type) {
        return Err("Invalid start type".into());
    }

    if !crate::commands::app::is_admin() {
        return Err(format!(
            "Administrator rights required to change startup type for service '{}'. Please click 'Restart as Admin' at the top.",
            name
        ));
    }

    let script = "Set-Service -Name $env:ICE_SVC -StartupType $env:ICE_START_TYPE -ErrorAction Stop";
    run_powershell(script, &[("ICE_SVC", name), ("ICE_START_TYPE", start_type)])?;
    Ok(json!({ "success": true }))
}
