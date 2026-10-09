use std::fs;
use std::path::PathBuf;
use serde_json::{json, Value};

fn get_settings_path() -> PathBuf {
    let app_data = std::env::var("APPDATA").unwrap_or_else(|_| ".".into());
    let dir = PathBuf::from(app_data).join("IceTools");
    let _ = fs::create_dir_all(&dir);
    dir.join("settings.json")
}

pub fn get_settings() -> Result<Value, String> {
    let path = get_settings_path();
    let defaults = json!({
        "runAtStartup": false,
        "closeToTray": false,
        "minimizeToTray": false,
        "autoCheckUpdates": true
    });

    if let Ok(content) = fs::read_to_string(path) {
        if let Ok(mut parsed) = serde_json::from_str::<Value>(&content) {
            if let Some(obj) = parsed.as_object_mut() {
                if let Some(def_obj) = defaults.as_object() {
                    for (k, v) in def_obj {
                        obj.entry(k).or_insert_with(|| v.clone());
                    }
                }
            }
            return Ok(parsed);
        }
    }

    Ok(defaults)
}

pub fn set_settings(partial: Value) -> Result<Value, String> {
    let mut current = get_settings()?;
    if let (Some(curr_obj), Some(part_obj)) = (current.as_object_mut(), partial.as_object()) {
        for (k, v) in part_obj {
            curr_obj.insert(k.clone(), v.clone());
        }
    }

    let path = get_settings_path();
    if let Ok(s) = serde_json::to_string_pretty(&current) {
        let _ = fs::write(path, s);
    }

    Ok(current)
}
