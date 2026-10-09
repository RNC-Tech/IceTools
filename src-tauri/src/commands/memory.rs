use serde_json::json;
use crate::commands::exec::{run_command, run_powershell};
use crate::commands::system::SystemState;

pub fn list_background_apps(state: &SystemState) -> Result<serde_json::Value, String> {
    let protected = [
        "system", "system idle process", "registry", "smss", "csrss", "wininit", "services",
        "lsass", "winlogon", "dwm", "svchost", "sihost", "explorer", "taskhostw", "audiodg",
        "spoolsv", "runtimebroker", "shellexperiencehost", "startmenuexperiencehost", "searchindexer",
        "searchhost", "textinputhost", "trustedinstaller", "wmiprvse", "dllhost", "msmpeng",
        "securityhealthservice", "smartscreen", "conhost", "icetools"
    ];

    let mut sys = state.sys.lock().map_err(|e| e.to_string())?;
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let mut list = Vec::new();
    for (pid, p) in sys.processes() {
        let name = p.name().to_string_lossy().to_string();
        let name_lower = name.to_lowercase();
        if protected.iter().any(|&prot| name_lower.contains(prot)) {
            continue;
        }

        let mem = p.memory();
        if mem > 10 * 1024 * 1024 { // Only processes using > 10MB
            list.push(json!({
                "pid": pid.as_u32(),
                "name": name,
                "memBytes": mem,
                "path": p.exe().map(|e| e.to_string_lossy().to_string()),
                "icon": null
            }));
        }
    }

    list.sort_by(|a, b| {
        let b_mem = b["memBytes"].as_u64().unwrap_or(0);
        let a_mem = a["memBytes"].as_u64().unwrap_or(0);
        b_mem.cmp(&a_mem)
    });

    for item in &mut list {
        if let Some(path_val) = item.get("path").and_then(|p| p.as_str()) {
            item["icon"] = json!(crate::commands::icons::get_cached_icon(path_val));
        }
    }

    Ok(serde_json::Value::Array(list))
}

pub fn clean_memory(pids: &[u32], state: &SystemState) -> Result<serde_json::Value, String> {
    let before_mem = {
        let mut sys = state.sys.lock().map_err(|e| e.to_string())?;
        sys.refresh_memory();
        (sys.used_memory(), sys.total_memory())
    };

    for pid in pids {
        let _ = run_command("taskkill.exe", &["/PID", &pid.to_string(), "/F"]);
    }

    // Trim working sets
    let _ = run_powershell(
        "Get-Process | ForEach-Object { try { $_.MinWorkingSet = $_.MinWorkingSet } catch {} }",
        &[]
    );

    let after_mem = {
        let mut sys = state.sys.lock().map_err(|e| e.to_string())?;
        sys.refresh_memory();
        (sys.used_memory(), sys.total_memory())
    };

    let freed = before_mem.0.saturating_sub(after_mem.0);

    Ok(json!({
        "closedCount": pids.len(),
        "freedBytes": freed,
        "before": { "usedBytes": before_mem.0, "totalBytes": before_mem.1 },
        "after": { "usedBytes": after_mem.0, "totalBytes": after_mem.1 }
    }))
}
