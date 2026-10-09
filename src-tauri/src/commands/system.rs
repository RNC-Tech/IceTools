use std::sync::Mutex;
use sysinfo::{CpuRefreshKind, Disks, MemoryRefreshKind, ProcessRefreshKind, RefreshKind, System};
use serde_json::json;
use crate::commands::exec::{run_command, run_powershell};

pub struct SystemState {
    pub sys: Mutex<System>,
}

impl Default for SystemState {
    fn default() -> Self {
        let mut sys = System::new_with_specifics(
            RefreshKind::nothing()
                .with_cpu(CpuRefreshKind::everything())
                .with_memory(MemoryRefreshKind::everything())
                .with_processes(ProcessRefreshKind::everything()),
        );
        sys.refresh_all();
        Self {
            sys: Mutex::new(sys),
        }
    }
}

pub fn get_live_stats(state: &SystemState) -> Result<serde_json::Value, String> {
    let mut sys = state.sys.lock().map_err(|e| e.to_string())?;
    sys.refresh_cpu_usage();
    sys.refresh_memory();

    let cpu_load = sys.global_cpu_usage().round();
    let per_core: Vec<f32> = sys.cpus().iter().map(|c| c.cpu_usage().round()).collect();

    let total_mem = sys.total_memory();
    let used_mem = sys.used_memory();
    let used_percent = if total_mem > 0 {
        ((used_mem as f64 / total_mem as f64) * 100.0).round()
    } else {
        0.0
    };

    Ok(json!({
        "cpu": {
            "loadPercent": cpu_load,
            "perCore": per_core
        },
        "memory": {
            "totalBytes": total_mem,
            "usedBytes": used_mem,
            "usedPercent": used_percent
        }
    }))
}

pub fn get_disks() -> Result<serde_json::Value, String> {
    let disks = Disks::new_with_refreshed_list();
    let mut disk_list = Vec::new();

    for d in &disks {
        let mount = d.mount_point().to_string_lossy().to_string();
        let total = d.total_space();
        let available = d.available_space();
        let used = total.saturating_sub(available);
        let used_percent = if total > 0 {
            ((used as f64 / total as f64) * 100.0).round()
        } else {
            0.0
        };

        disk_list.push(json!({
            "mount": mount,
            "totalBytes": total,
            "usedBytes": used,
            "usedPercent": used_percent,
            "healthStatus": "Healthy",
            "operationalStatus": "OK"
        }));
    }

    Ok(serde_json::Value::Array(disk_list))
}

pub fn get_stats(state: &SystemState) -> Result<serde_json::Value, String> {
    let live = get_live_stats(state)?;
    let disks = get_disks().unwrap_or(json!([]));

    let sys = state.sys.lock().map_err(|e| e.to_string())?;
    let cpu_brand = sys.cpus().first().map(|c| c.brand().to_string()).unwrap_or_else(|| "Unknown CPU".into());
    let cores = sys.cpus().len();

    Ok(json!({
        "cpu": {
            "model": cpu_brand,
            "cores": cores,
            "loadPercent": live["cpu"]["loadPercent"]
        },
        "memory": live["memory"],
        "disks": disks
    }))
}

pub fn get_gpu_stats() -> Result<serde_json::Value, String> {
    match run_command("nvidia-smi.exe", &[
        "--query-gpu=name,utilization.gpu,temperature.gpu,memory.used,memory.total",
        "--format=csv,noheader,nounits"
    ]) {
        Ok(out) => {
            if let Some(first_line) = out.lines().next() {
                let parts: Vec<&str> = first_line.split(',').map(|s| s.trim()).collect();
                if parts.len() >= 5 {
                    let name = parts[0];
                    let load: f64 = parts[1].parse().unwrap_or(0.0);
                    let temp: f64 = parts[2].parse().unwrap_or(0.0);
                    let mem_used_mb: f64 = parts[3].parse().unwrap_or(0.0);
                    let mem_total_mb: f64 = parts[4].parse().unwrap_or(0.0);
                    return Ok(json!({
                        "available": true,
                        "name": name,
                        "loadPercent": load.round(),
                        "temperatureC": temp,
                        "memUsedBytes": (mem_used_mb * 1024.0 * 1024.0) as u64,
                        "memTotalBytes": (mem_total_mb * 1024.0 * 1024.0) as u64
                    }));
                }
            }
            Ok(json!({ "available": false }))
        }
        Err(_) => Ok(json!({ "available": false })),
    }
}

pub fn get_processes(state: &SystemState) -> Result<serde_json::Value, String> {
    let mut sys = state.sys.lock().map_err(|e| e.to_string())?;
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let mut list = Vec::new();
    for (pid, p) in sys.processes() {
        let cpu = p.cpu_usage().round();
        let mem = p.memory();
        let name = p.name().to_string_lossy().to_string();
        let path = p.exe().map(|e| e.to_string_lossy().to_string());

        list.push(json!({
            "pid": pid.as_u32(),
            "name": name,
            "cpu": cpu,
            "memBytes": mem,
            "priority": "Normal",
            "path": path,
            "icon": null
        }));
    }

    list.sort_by(|a, b| {
        let b_cpu = b["cpu"].as_f64().unwrap_or(0.0);
        let a_cpu = a["cpu"].as_f64().unwrap_or(0.0);
        b_cpu.partial_cmp(&a_cpu).unwrap_or(std::cmp::Ordering::Equal)
    });

    list.truncate(200);

    for item in &mut list {
        if let Some(path_val) = item.get("path").and_then(|p| p.as_str()) {
            item["icon"] = json!(crate::commands::icons::get_cached_icon(path_val));
        }
    }

    Ok(serde_json::Value::Array(list))
}

pub fn get_process_count(state: &SystemState) -> Result<serde_json::Value, String> {
    let sys = state.sys.lock().map_err(|e| e.to_string())?;
    Ok(json!({ "count": sys.processes().len() }))
}

pub fn kill_process(pid: u32) -> Result<serde_json::Value, String> {
    run_command("taskkill.exe", &["/PID", &pid.to_string(), "/F", "/T"])?;
    Ok(json!({ "success": true }))
}

pub fn set_priority(pid: u32, priority: &str) -> Result<serde_json::Value, String> {
    let valid_priorities = ["Idle", "BelowNormal", "Normal", "AboveNormal", "High", "RealTime"];
    if !valid_priorities.contains(&priority) {
        return Err("Invalid priority".into());
    }
    let pid_str = pid.to_string();
    run_powershell(
        "(Get-Process -Id $env:ICE_PID).PriorityClass = $env:ICE_PRIORITY",
        &[("ICE_PID", &pid_str), ("ICE_PRIORITY", priority)]
    )?;
    Ok(json!({ "success": true }))
}

pub fn optimize_disk(mount: &str) -> Result<serde_json::Value, String> {
    let drive_letter = mount.trim_end_matches(['\\', '/']);
    run_command("defrag.exe", &[drive_letter, "/O"])?;
    Ok(json!({ "success": true }))
}
