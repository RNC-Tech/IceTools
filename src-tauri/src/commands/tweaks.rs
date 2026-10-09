use serde_json::json;
use crate::commands::exec::{run_command, run_powershell};

struct TweakDef {
    id: &'static str,
    label: &'static str,
    description: &'static str,
    category: &'static str,
    requires_admin: bool,
    kind: &'static str, // "registry", "service", "hibernate"
    reg_path: &'static str,
    value_name: &'static str,
    on_val: i32,
    off_val: Option<i32>,
    service_name: &'static str,
}

const TWEAKS: &[TweakDef] = &[
    TweakDef {
        id: "gameMode",
        label: "Enable Game Mode",
        description: "Turns on Windows Game Mode (prioritizes foreground games for CPU/GPU scheduling).",
        category: "performance",
        requires_admin: false,
        kind: "registry",
        reg_path: "HKCU:\\Software\\Microsoft\\GameBar",
        value_name: "AllowAutoGameMode",
        on_val: 1,
        off_val: Some(0),
        service_name: "",
    },
    TweakDef {
        id: "startupDelay",
        label: "Disable Startup App Delay",
        description: "Removes the ~10s Explorer delay before startup apps launch after logon.",
        category: "performance",
        requires_admin: false,
        kind: "registry",
        reg_path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Serialize",
        value_name: "StartupDelayInMSec",
        on_val: 0,
        off_val: None,
        service_name: "",
    },
    TweakDef {
        id: "bestPerformanceVisuals",
        label: "Visual Effects: Best Performance",
        description: "Disables animations/shadows/transparency for a snappier UI.",
        category: "performance",
        requires_admin: false,
        kind: "registry",
        reg_path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects",
        value_name: "VisualFXSetting",
        on_val: 2,
        off_val: Some(0),
        service_name: "",
    },
    TweakDef {
        id: "disableTelemetry",
        label: "Disable Diagnostic Data",
        description: "Sets Windows diagnostic data collection to the minimum level policy allows.",
        category: "privacy",
        requires_admin: true,
        kind: "registry",
        reg_path: "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection",
        value_name: "AllowTelemetry",
        on_val: 0,
        off_val: None,
        service_name: "",
    },
    TweakDef {
        id: "disableAdvertisingId",
        label: "Disable Advertising ID",
        description: "Stops apps from using your advertising ID to personalize ads across apps.",
        category: "privacy",
        requires_admin: false,
        kind: "registry",
        reg_path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo",
        value_name: "Enabled",
        on_val: 0,
        off_val: None,
        service_name: "",
    },
    TweakDef {
        id: "disableTailoredExperiences",
        label: "Disable Tailored Experiences",
        description: "Stops Windows from using your diagnostic data to suggest tips and personalized content.",
        category: "privacy",
        requires_admin: false,
        kind: "registry",
        reg_path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Privacy",
        value_name: "TailoredExperiencesWithDiagnosticDataEnabled",
        on_val: 0,
        off_val: None,
        service_name: "",
    },
    TweakDef {
        id: "disableActivityFeed",
        label: "Disable Activity History",
        description: "Stops Windows from collecting your activity history (Timeline) for this device.",
        category: "privacy",
        requires_admin: true,
        kind: "registry",
        reg_path: "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\System",
        value_name: "EnableActivityFeed",
        on_val: 0,
        off_val: None,
        service_name: "",
    },
    TweakDef {
        id: "disableBingSearch",
        label: "Disable Web Search in Start Menu",
        description: "Keeps Start Menu search results limited to your PC, without sending queries to Bing.",
        category: "privacy",
        requires_admin: false,
        kind: "registry",
        reg_path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Search",
        value_name: "BingSearchEnabled",
        on_val: 0,
        off_val: None,
        service_name: "",
    },
    TweakDef {
        id: "disableConsumerFeatures",
        label: "Disable Consumer Features",
        description: "Stops Windows from auto-installing suggested apps and promotional content.",
        category: "privacy",
        requires_admin: true,
        kind: "registry",
        reg_path: "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\CloudContent",
        value_name: "DisableWindowsConsumerFeatures",
        on_val: 1,
        off_val: None,
        service_name: "",
    },
    TweakDef {
        id: "removeWidgets",
        label: "Remove Widgets",
        description: "Hides the Widgets icon and panel from the taskbar.",
        category: "privacy",
        requires_admin: false,
        kind: "registry",
        reg_path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced",
        value_name: "TaskbarDa",
        on_val: 0,
        off_val: Some(1),
        service_name: "",
    },
    TweakDef {
        id: "disableSuperfetch",
        label: "Disable Superfetch",
        description: "Stops and disables the SysMain service, which preloads apps into RAM in the background.",
        category: "privacy",
        requires_admin: true,
        kind: "service",
        reg_path: "",
        value_name: "",
        on_val: 0,
        off_val: None,
        service_name: "SysMain",
    },
    TweakDef {
        id: "disableDeliveryOptimization",
        label: "Disable Delivery Optimization",
        description: "Stops and disables the service that shares Windows Update downloads with other PCs.",
        category: "privacy",
        requires_admin: true,
        kind: "service",
        reg_path: "",
        value_name: "",
        on_val: 0,
        off_val: None,
        service_name: "DoSvc",
    },
    TweakDef {
        id: "disableHibernate",
        label: "Disable Hibernate",
        description: "Turns off hibernation and deletes hiberfil.sys, freeing disk space equal to RAM.",
        category: "privacy",
        requires_admin: true,
        kind: "hibernate",
        reg_path: "",
        value_name: "",
        on_val: 0,
        off_val: None,
        service_name: "",
    },
];

fn read_reg_value(path: &str, name: &str) -> Option<i32> {
    let script = "(Get-ItemProperty -Path $env:ICE_PATH -Name $env:ICE_VALUE -ErrorAction SilentlyContinue).$env:ICE_VALUE";
    match run_powershell(script, &[("ICE_PATH", path), ("ICE_VALUE", name)]) {
        Ok(out) => out.trim().parse::<i32>().ok(),
        Err(_) => None,
    }
}

pub fn list() -> Result<serde_json::Value, String> {
    let mut results = Vec::new();

    for t in TWEAKS {
        let enabled = match t.kind {
            "service" => {
                let script = "(Get-Service -Name $env:ICE_SVC -ErrorAction SilentlyContinue).StartType.ToString()";
                match run_powershell(script, &[("ICE_SVC", t.service_name)]) {
                    Ok(out) => out.trim() == "Disabled",
                    Err(_) => false,
                }
            }
            "hibernate" => {
                match run_command("powercfg.exe", &["/a"]) {
                    Ok(out) => out.contains("Hibernation has not been enabled"),
                    Err(_) => false,
                }
            }
            _ => {
                let current = read_reg_value(t.reg_path, t.value_name);
                current == Some(t.on_val)
            }
        };

        results.push(json!({
            "id": t.id,
            "label": t.label,
            "description": t.description,
            "requiresAdmin": t.requires_admin,
            "category": t.category,
            "enabled": enabled
        }));
    }

    Ok(serde_json::Value::Array(results))
}

pub fn apply(id: &str, enabled: bool) -> Result<serde_json::Value, String> {
    let t = TWEAKS.iter().find(|x| x.id == id).ok_or("Unknown tweak")?;

    match t.kind {
        "service" => {
            if enabled {
                let _ = run_powershell("Stop-Service -Name $env:ICE_SVC -Force -ErrorAction SilentlyContinue", &[("ICE_SVC", t.service_name)]);
                run_powershell("Set-Service -Name $env:ICE_SVC -StartupType Disabled -ErrorAction Stop", &[("ICE_SVC", t.service_name)])?;
            } else {
                run_powershell("Set-Service -Name $env:ICE_SVC -StartupType Automatic -ErrorAction Stop", &[("ICE_SVC", t.service_name)])?;
                let _ = run_powershell("Start-Service -Name $env:ICE_SVC -ErrorAction SilentlyContinue", &[("ICE_SVC", t.service_name)]);
            }
        }
        "hibernate" => {
            let arg = if enabled { "off" } else { "on" };
            run_command("powercfg.exe", &["/hibernate", arg])?;
        }
        _ => {
            if enabled {
                let on_val_str = t.on_val.to_string();
                let script = r#"
                if (-not (Test-Path $env:ICE_PATH)) { New-Item -Path $env:ICE_PATH -Force | Out-Null }
                New-ItemProperty -Path $env:ICE_PATH -Name $env:ICE_VALUE -Value $env:ICE_ON -PropertyType DWord -Force | Out-Null
                "#;
                run_powershell(script, &[("ICE_PATH", t.reg_path), ("ICE_VALUE", t.value_name), ("ICE_ON", &on_val_str)])?;
            } else if let Some(off_val) = t.off_val {
                let off_val_str = off_val.to_string();
                let script = r#"
                if (-not (Test-Path $env:ICE_PATH)) { New-Item -Path $env:ICE_PATH -Force | Out-Null }
                New-ItemProperty -Path $env:ICE_PATH -Name $env:ICE_VALUE -Value $env:ICE_OFF -PropertyType DWord -Force | Out-Null
                "#;
                run_powershell(script, &[("ICE_PATH", t.reg_path), ("ICE_VALUE", t.value_name), ("ICE_OFF", &off_val_str)])?;
            } else {
                let script = "Remove-ItemProperty -Path $env:ICE_PATH -Name $env:ICE_VALUE -ErrorAction SilentlyContinue";
                let _ = run_powershell(script, &[("ICE_PATH", t.reg_path), ("ICE_VALUE", t.value_name)]);
            }
        }
    }

    Ok(json!({ "success": true }))
}
