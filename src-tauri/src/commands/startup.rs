use serde_json::json;
use crate::commands::exec::{run_powershell, run_powershell_json};

const LIST_SCRIPT: &str = r#"
$origins = @{
  HKCU_Run = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
  HKLM_Run = 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Run'
  HKLM_Run32 = 'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Run'
}
$results = @()
foreach ($originName in $origins.Keys) {
  $keyPath = $origins[$originName]
  if (Test-Path $keyPath) {
    $props = Get-ItemProperty -Path $keyPath -ErrorAction SilentlyContinue
    if ($props) {
      foreach ($p in $props.PSObject.Properties) {
        if ($p.Name -notmatch '^PS(Path|ParentPath|ChildName|Drive|Provider)$') {
          $results += [PSCustomObject]@{
            id = "$originName|$($p.Name)"
            name = $p.Name
            command = "$($p.Value)"
            origin = $originName
            enabled = $true
          }
        }
      }
    }
  }
}
$disabledRoot = 'HKCU:\Software\IceTools\DisabledStartup'
if (Test-Path $disabledRoot) {
  Get-ChildItem -Path $disabledRoot -ErrorAction SilentlyContinue | ForEach-Object {
    $originName = $_.PSChildName
    $props = Get-ItemProperty -Path $_.PSPath -ErrorAction SilentlyContinue
    if ($props) {
      foreach ($p in $props.PSObject.Properties) {
        if ($p.Name -notmatch '^PS(Path|ParentPath|ChildName|Drive|Provider)$') {
          $results += [PSCustomObject]@{
            id = "$originName|$($p.Name)"
            name = $p.Name
            command = "$($p.Value)"
            origin = $originName
            enabled = $false
          }
        }
      }
    }
  }
}

$folders = @(
  @{ id = 'folder:user'; dir = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup" },
  @{ id = 'folder:allUsers'; dir = "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Startup" }
)
foreach ($f in $folders) {
  $activeDir = $f.dir
  $disabledDir = Join-Path $f.dir '_IceToolsDisabled'
  if (Test-Path $activeDir) {
    Get-ChildItem -Path $activeDir -File -ErrorAction SilentlyContinue | ForEach-Object {
      $results += [PSCustomObject]@{
        id = "$($f.id)|$($_.Name)"
        name = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
        command = $_.FullName
        origin = $f.id
        enabled = $true
      }
    }
  }
  if (Test-Path $disabledDir) {
    Get-ChildItem -Path $disabledDir -File -ErrorAction SilentlyContinue | ForEach-Object {
      $results += [PSCustomObject]@{
        id = "$($f.id)|$($_.Name)"
        name = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
        command = $_.FullName
        origin = $f.id
        enabled = $false
      }
    }
  }
}

$results | ConvertTo-Json -Depth 4
"#;

pub fn list() -> Result<serde_json::Value, String> {
    let mut raw = run_powershell_json(LIST_SCRIPT, &[])?;
    if let Some(arr) = raw.as_array_mut() {
        for item in arr {
            let cmd = item["command"].as_str().unwrap_or("");
            let exe = if item["origin"].as_str().unwrap_or("").starts_with("folder:") {
                Some(cmd.to_string())
            } else {
                crate::commands::icons::extract_exe_path(cmd)
            };
            let icon = exe.as_deref().and_then(crate::commands::icons::get_cached_icon);
            item["icon"] = json!(icon);
        }
    }
    Ok(raw)
}

pub fn toggle(item: serde_json::Value) -> Result<serde_json::Value, String> {
    let enabled = item["enabled"]
        .as_bool()
        .ok_or_else(|| "Missing 'enabled' status".to_string())?;

    let (origin, name) = if let Some(id) = item["id"].as_str() {
        if let Some((o, n)) = id.split_once('|') {
            (o.to_string(), n.to_string())
        } else {
            let n = item["name"].as_str().ok_or("Missing name")?.to_string();
            let o = item["origin"].as_str().ok_or("Missing origin")?.to_string();
            (o, n)
        }
    } else {
        let n = item["name"].as_str().ok_or("Missing name")?.to_string();
        let o = item["origin"].as_str().ok_or("Missing origin")?.to_string();
        (o, n)
    };

    if origin.starts_with("folder:") {
        let folder_id = origin.strip_prefix("folder:").unwrap_or(&origin);
        let script = r#"
        $folderId = $env:ICE_FOLDER_ID
        $fileName = $env:ICE_FILE_NAME
        $enable = $env:ICE_ENABLE -eq 'true'

        $baseDir = if ($folderId -eq 'user') {
            "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
        } else {
            "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Startup"
        }
        $disabledDir = Join-Path $baseDir '_IceToolsDisabled'

        if ($enable) {
            $src = Join-Path $disabledDir $fileName
            $dst = Join-Path $baseDir $fileName
            if (Test-Path $src) { Move-Item -Path $src -Destination $dst -Force }
        } else {
            if (-not (Test-Path $disabledDir)) { New-Item -Path $disabledDir -ItemType Directory -Force | Out-Null }
            $src = Join-Path $baseDir $fileName
            $dst = Join-Path $disabledDir $fileName
            if (Test-Path $src) { Move-Item -Path $src -Destination $dst -Force }
        }
        "#;
        run_powershell(script, &[
            ("ICE_FOLDER_ID", folder_id),
            ("ICE_FILE_NAME", &name),
            ("ICE_ENABLE", if enabled { "true" } else { "false" }),
        ])?;
    } else {
        let origins = [
            ("HKCU_Run", "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"),
            ("HKLM_Run", "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"),
            ("HKLM_Run32", "HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run"),
        ];

        let run_key = origins.iter()
            .find(|(k, _)| *k == origin)
            .map(|(_, v)| *v)
            .ok_or_else(|| format!("Invalid startup origin: {}", origin))?;

        let disabled_key = format!("HKCU:\\Software\\IceTools\\DisabledStartup\\{}", origin);

        let (src_key, dst_key) = if enabled {
            (disabled_key.as_str(), run_key)
        } else {
            (run_key, disabled_key.as_str())
        };

        let script = r#"
        $sourceRoot = $env:ICE_SRC
        $destRoot = $env:ICE_DST
        $name = $env:ICE_NAME
        if (-not (Test-Path $destRoot)) { New-Item -Path $destRoot -Force | Out-Null }
        $prop = Get-ItemProperty -Path $sourceRoot -Name $name -ErrorAction SilentlyContinue
        if ($null -ne $prop -and $null -ne $prop.$name) {
            $val = $prop.$name
            New-ItemProperty -Path $destRoot -Name $name -Value $val -PropertyType String -Force | Out-Null
            Remove-ItemProperty -Path $sourceRoot -Name $name -Force -ErrorAction SilentlyContinue
        } else {
            if ($env:ICE_CMD) {
                New-ItemProperty -Path $destRoot -Name $name -Value $env:ICE_CMD -PropertyType String -Force | Out-Null
                Remove-ItemProperty -Path $sourceRoot -Name $name -Force -ErrorAction SilentlyContinue
            } else {
                throw "Property $name not found in $sourceRoot"
            }
        }
        "#;

        let cmd_fallback = item["command"].as_str().unwrap_or("");
        run_powershell(script, &[
            ("ICE_SRC", src_key),
            ("ICE_DST", dst_key),
            ("ICE_NAME", &name),
            ("ICE_CMD", cmd_fallback),
        ])?;
    }

    Ok(json!({ "success": true }))
}
