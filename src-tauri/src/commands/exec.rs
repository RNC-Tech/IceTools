use std::process::Command;
use std::os::windows::process::CommandExt;

pub const CREATE_NO_WINDOW: u32 = 0x08000000;

pub fn clean_powershell_error(err: &str) -> String {
    for line in err.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty()
            || trimmed.starts_with('+')
            || trimmed.starts_with("At line:")
            || trimmed.starts_with("CategoryInfo")
            || trimmed.starts_with("FullyQualifiedErrorId")
        {
            continue;
        }
        if let Some((_, msg)) = trimmed.split_once(" : ") {
            let msg = msg.trim();
            if !msg.is_empty() {
                return msg.to_string();
            }
        }
        return trimmed.to_string();
    }
    err.to_string()
}

pub fn run_powershell(script: &str, envs: &[(&str, &str)]) -> Result<String, String> {
    let mut cmd = Command::new("powershell.exe");
    cmd.args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script]);
    cmd.creation_flags(CREATE_NO_WINDOW);
    for (k, v) in envs {
        cmd.env(k, v);
    }
    let output = cmd.output().map_err(|e| e.to_string())?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        if !stderr.is_empty() {
            return Err(clean_powershell_error(&stderr));
        }
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

pub fn run_powershell_json(script: &str, envs: &[(&str, &str)]) -> Result<serde_json::Value, String> {
    let out = run_powershell(script, envs)?;
    if out.is_empty() {
        return Ok(serde_json::json!([]));
    }
    let parsed: serde_json::Value = serde_json::from_str(&out)
        .map_err(|e| format!("JSON parse error: {e}, raw: {out}"))?;
    if parsed.is_array() {
        Ok(parsed)
    } else {
        Ok(serde_json::json!([parsed]))
    }
}

pub fn run_command(file: &str, args: &[&str]) -> Result<String, String> {
    let mut cmd = Command::new(file);
    cmd.args(args);
    cmd.creation_flags(CREATE_NO_WINDOW);
    let output = cmd.output().map_err(|e| e.to_string())?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        if !stderr.is_empty() {
            return Err(stderr);
        }
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}
