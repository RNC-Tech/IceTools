use std::path::{Path, PathBuf};
use serde_json::json;
use crate::commands::exec::run_powershell;

fn get_dir_size(path: &Path) -> u64 {
    let mut total = 0;
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            if let Ok(meta) = entry.metadata() {
                if meta.is_file() {
                    total += meta.len();
                } else if meta.is_dir() {
                    total += get_dir_size(&entry.path());
                }
            }
        }
    }
    total
}

fn clean_dir_contents(path: &Path) -> u64 {
    let mut freed = 0;
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            let p = entry.path();
            if let Ok(meta) = entry.metadata() {
                let size = if meta.is_file() { meta.len() } else { get_dir_size(&p) };
                if meta.is_file() {
                    if std::fs::remove_file(&p).is_ok() {
                        freed += size;
                    }
                } else if meta.is_dir() {
                    if std::fs::remove_dir_all(&p).is_ok() {
                        freed += size;
                    }
                }
            }
        }
    }
    freed
}

pub fn get_categories() -> Vec<(String, String, String, Vec<PathBuf>, bool)> {
    let user_temp = std::env::temp_dir();
    let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_else(|_| "C:\\Users\\Default\\AppData\\Local".into());
    let windir = std::env::var("WINDIR").unwrap_or_else(|_| "C:\\Windows".into());

    vec![
        (
            "userTemp".into(),
            "User Temp Files".into(),
            user_temp.to_string_lossy().to_string(),
            vec![user_temp],
            false
        ),
        (
            "windowsTemp".into(),
            "Windows Temp Files".into(),
            format!("{}\\Temp", windir),
            vec![PathBuf::from(format!("{}\\Temp", windir))],
            false
        ),
        (
            "windowsUpdateCache".into(),
            "Windows Update Cache".into(),
            format!("{}\\SoftwareDistribution\\Download", windir),
            vec![PathBuf::from(format!("{}\\SoftwareDistribution\\Download", windir))],
            false
        ),
        (
            "prefetch".into(),
            "Prefetch Data".into(),
            format!("{}\\Prefetch", windir),
            vec![PathBuf::from(format!("{}\\Prefetch", windir))],
            false
        ),
        (
            "recycleBin".into(),
            "Recycle Bin".into(),
            "Empty the Recycle Bin".into(),
            vec![],
            true
        ),
        (
            "chromeCache".into(),
            "Google Chrome Cache".into(),
            "Browser cache files".into(),
            vec![
                PathBuf::from(format!("{}\\Google\\Chrome\\User Data\\Default\\Cache", local_app_data)),
                PathBuf::from(format!("{}\\Google\\Chrome\\User Data\\Default\\Code Cache", local_app_data)),
                PathBuf::from(format!("{}\\Google\\Chrome\\User Data\\Default\\GPUCache", local_app_data)),
            ],
            false
        ),
        (
            "edgeCache".into(),
            "Microsoft Edge Cache".into(),
            "Browser cache files".into(),
            vec![
                PathBuf::from(format!("{}\\Microsoft\\Edge\\User Data\\Default\\Cache", local_app_data)),
                PathBuf::from(format!("{}\\Microsoft\\Edge\\User Data\\Default\\Code Cache", local_app_data)),
                PathBuf::from(format!("{}\\Microsoft\\Edge\\User Data\\Default\\GPUCache", local_app_data)),
            ],
            false
        ),
    ]
}

pub fn scan() -> Result<serde_json::Value, String> {
    let cats = get_categories();
    let mut results = Vec::new();

    for (id, label, desc, dirs, is_recycle) in cats {
        let size: u64 = if is_recycle {
            // Check recycle bin size via PowerShell
            match run_powershell(
                "(New-Object -ComObject Shell.Application).NameSpace(0xa).Items() | Measure-Object -Property Size -Sum | Select-Object -ExpandProperty Sum",
                &[]
            ) {
                Ok(out) => out.parse::<u64>().unwrap_or(0),
                Err(_) => 0,
            }
        } else {
            dirs.iter().map(|d| get_dir_size(d)).sum()
        };

        results.push(json!({
            "id": id,
            "label": label,
            "description": desc,
            "sizeBytes": size
        }));
    }

    Ok(serde_json::Value::Array(results))
}

pub fn get_temp_files_size() -> Result<serde_json::Value, String> {
    let user_temp = std::env::temp_dir();
    let windir = std::env::var("WINDIR").unwrap_or_else(|_| "C:\\Windows".into());
    let win_temp = PathBuf::from(format!("{}\\Temp", windir));

    let size = get_dir_size(&user_temp) + get_dir_size(&win_temp);
    Ok(json!({ "sizeBytes": size }))
}

pub fn clean(category_ids: &[String]) -> Result<serde_json::Value, String> {
    let cats = get_categories();
    let mut outcomes = Vec::new();

    for id in category_ids {
        if let Some((_, _, _, dirs, is_recycle)) = cats.iter().find(|(cid, ..)| cid == id) {
            if *is_recycle {
                let res = run_powershell("Clear-RecycleBin -Force -ErrorAction SilentlyContinue", &[]);
                outcomes.push(json!({
                    "id": id,
                    "success": res.is_ok()
                }));
            } else {
                for d in dirs {
                    clean_dir_contents(d);
                }
                outcomes.push(json!({
                    "id": id,
                    "success": true
                }));
            }
        } else {
            outcomes.push(json!({
                "id": id,
                "success": true
            }));
        }
    }

    Ok(serde_json::Value::Array(outcomes))
}
