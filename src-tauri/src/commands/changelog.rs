use serde_json::json;

pub fn get_changelog() -> Result<serde_json::Value, String> {
    Ok(json!([
        {
            "version": "1.2.0",
            "name": "IceTools v1.2.0 - Major Feature Release & Enhancements",
            "notes": "• Official App Icon: Added high-resolution custom IceTools logo icon for Windows Taskbar, BrowserWindow frame, and System Tray.\n• Sub-Zero Memory & Junk Cleaner: Combined RAM optimization and temporary junk files cleanup into a single 1-click action.\n• Embedded Network Speed Tester: Dedicated Fast.com and Speedtest.net modal launcher windows with full performance testing and zero CSP blocking.\n• Elevated Admin Relaunch: Smooth UAC elevation prompt and app restart when triggering Administrator mode.\n• System Tray Widget Improvements: Added top close button, Fast.com launcher option, and official IceTools logo.\n• Sage Media Downloader: Media thumbnail previews, file location opener, and item deletion controls.\n• UI & Theme Refinements: Purged legacy green elements in Windows Defender & Firewall profiles with Electric Sapphire styling.",
            "publishedAt": "2026-08-10T00:00:00.000Z",
            "prerelease": false
        },
        {
            "version": "1.0.0",
            "name": "IceTools v1.0.0 - Initial Release",
            "notes": "• Core hardware load telemetry (CPU, RAM, GPU, Disk).\n• Startup Apps & Windows Services Manager.\n• Power Plan profile manager with Ultimate Performance unlocker.\n• Privacy & Telemetry hardening tweaks.",
            "publishedAt": "2026-08-01T00:00:00.000Z",
            "prerelease": false
        }
    ]))
}
