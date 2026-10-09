pub mod exec;
pub mod window;
pub mod app;
pub mod system;
pub mod memory;
pub mod startup;
pub mod services;
pub mod cleanup;
pub mod power;
pub mod network;
pub mod tweaks;
pub mod tools;
pub mod uninstaller;
pub mod security;
pub mod settings;
pub mod changelog;
pub mod ytdlp;
pub mod updater;
pub mod icons;

use serde_json::{json, Value};
use system::SystemState;

#[tauri::command]
pub fn api_dispatch(
    channel: String,
    payload: Vec<Value>,
    state: tauri::State<SystemState>,
) -> Result<Value, String> {
    match channel.as_str() {
        "app:isAdmin" => Ok(json!(app::is_admin())),
        "app:getVersion" => Ok(json!(app::get_version())),
        "app:relaunchAsAdmin" => app::relaunch_as_admin(),
        "app:showMainWindow" => Ok(json!(true)),
        "app:openExternal" => {
            let url = payload.first().and_then(|v| v.as_str()).unwrap_or("");
            app::open_external(url).map(|b| json!(b))
        }
        "app:openSpeedTestModal" => {
            let url = payload.first().and_then(|v| v.as_str()).unwrap_or("");
            app::open_external(url).map(|b| json!(b))
        }

        "changelog:get" => changelog::get_changelog(),

        "security:getDefenderStatus" => security::get_defender_status(),
        "security:getFirewallStatus" => security::get_firewall_status(),
        "security:openWindowsSecurity" => security::open_windows_security(),

        "uninstaller:listApps" => uninstaller::list_apps(),
        "uninstaller:uninstallApp" => {
            let key = payload.first().and_then(|v| v.as_str()).unwrap_or("");
            uninstaller::uninstall_app(key)
        }
        "uninstaller:scanLeftovers" => {
            let apps = payload.first().and_then(|v| v.as_array()).cloned().unwrap_or_default();
            uninstaller::scan_leftovers(&apps)
        }
        "uninstaller:deleteLeftovers" => {
            let items: Vec<String> = payload.first()
                .and_then(|v| v.as_array())
                .map(|a| a.iter().filter_map(|s| s.as_str().map(|x| x.to_string())).collect())
                .unwrap_or_default();
            uninstaller::delete_leftovers(&items)
        }

        "settings:get" => settings::get_settings(),
        "settings:set" => {
            let partial = payload.first().cloned().unwrap_or(json!({}));
            settings::set_settings(partial)
        }

        "system:getStats" => system::get_stats(&state),
        "system:getLiveStats" => system::get_live_stats(&state),
        "system:getGpuStats" => system::get_gpu_stats(),
        "system:getProcesses" => system::get_processes(&state),
        "system:getProcessCount" => system::get_process_count(&state),
        "system:getFileIcon" => {
            let path = payload.first().and_then(|v| v.as_str()).unwrap_or("");
            Ok(json!(icons::get_cached_icon(path)))
        }
        "system:killProcess" => {
            let pid = payload.first().and_then(|v| v.as_u64()).unwrap_or(0) as u32;
            system::kill_process(pid)
        }
        "system:optimizeDisk" => {
            let mount = payload.first().and_then(|v| v.as_str()).unwrap_or("C:");
            system::optimize_disk(mount)
        }
        "system:setPriority" => {
            let pid = payload.first().and_then(|v| v.as_u64()).unwrap_or(0) as u32;
            let priority = payload.get(1).and_then(|v| v.as_str()).unwrap_or("Normal");
            system::set_priority(pid, priority)
        }

        "memory:listBackgroundApps" => memory::list_background_apps(&state),
        "memory:cleanMemory" => {
            let pids: Vec<u32> = payload.first()
                .and_then(|v| v.as_array())
                .map(|a| a.iter().filter_map(|v| v.as_u64().map(|x| x as u32)).collect())
                .unwrap_or_default();
            memory::clean_memory(&pids, &state)
        }

        "startup:list" => startup::list(),
        "startup:toggle" => {
            let item = payload.first().cloned().unwrap_or(json!({}));
            startup::toggle(item)
        }

        "services:list" => services::list(),
        "services:setStatus" => {
            let name = payload.first().and_then(|v| v.as_str()).unwrap_or("");
            let action = payload.get(1).and_then(|v| v.as_str()).unwrap_or("");
            services::set_status(name, action)
        }
        "services:setStartType" => {
            let name = payload.first().and_then(|v| v.as_str()).unwrap_or("");
            let start_type = payload.get(1).and_then(|v| v.as_str()).unwrap_or("");
            services::set_start_type(name, start_type)
        }

        "cleanup:scan" => cleanup::scan(),
        "cleanup:getTempFilesSize" => cleanup::get_temp_files_size(),
        "cleanup:clean" => {
            let cats: Vec<String> = payload.first()
                .and_then(|v| v.as_array())
                .map(|a| a.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect())
                .unwrap_or_default();
            cleanup::clean(&cats)
        }

        "power:listPlans" => power::list_plans(),
        "power:getBatteryInfo" => power::get_battery_info(),
        "power:getShowBatteryPercentage" => power::get_show_battery_percentage(),
        "power:setShowBatteryPercentage" => {
            let enabled = payload.first().and_then(|v| v.as_bool()).unwrap_or(false);
            power::set_show_battery_percentage(enabled)
        }
        "power:setActivePlan" => {
            let guid = payload.first().and_then(|v| v.as_str()).unwrap_or("");
            power::set_active_plan(guid)
        }
        "power:enableUltimatePerformance" => power::enable_ultimate_performance(),

        "network:listAdapters" => network::list_adapters(),
        "network:setAdapterEnabled" => {
            let name = payload.first().and_then(|v| v.as_str()).unwrap_or("");
            let enabled = payload.get(1).and_then(|v| v.as_bool()).unwrap_or(true);
            network::set_adapter_enabled(name, enabled)
        }
        "network:flushDns" => network::flush_dns(),
        "network:resetWinsock" => network::reset_winsock(),
        "network:resetTcpIp" => network::reset_tcp_ip(),
        "network:getDnsServers" => {
            let name = payload.first().and_then(|v| v.as_str()).unwrap_or("");
            network::get_dns_servers(name)
        }
        "network:setDnsServers" => {
            let name = payload.first().and_then(|v| v.as_str()).unwrap_or("");
            let servers: Vec<String> = payload.get(1)
                .and_then(|v| v.as_array())
                .map(|a| a.iter().filter_map(|s| s.as_str().map(|x| x.to_string())).collect())
                .unwrap_or_default();
            network::set_dns_servers(name, &servers)
        }
        "network:getWifiSignal" => network::get_wifi_signal(),
        "network:runSpeedTest" => network::run_speed_test(),

        "tweaks:list" => tweaks::list(),
        "tweaks:apply" => {
            let id = payload.first().and_then(|v| v.as_str()).unwrap_or("");
            let enabled = payload.get(1).and_then(|v| v.as_bool()).unwrap_or(false);
            tweaks::apply(id, enabled)
        }

        "tools:runCttWinUtil" => tools::run_ctt_win_util(),
        "tools:runMassGraveActivation" => tools::run_massgrave_activation(),

        "ytdlp:isInstalled" => ytdlp::is_installed().map(|b| json!(b)),
        "ytdlp:install" => ytdlp::install(),
        "ytdlp:listFormats" => {
            let url = payload.first().and_then(|v| v.as_str()).unwrap_or("");
            ytdlp::list_formats(url)
        }
        "ytdlp:getInfo" => {
            let url = payload.first().and_then(|v| v.as_str()).unwrap_or("");
            ytdlp::get_info(url)
        }
        "ytdlp:getHistory" => ytdlp::get_history(),
        "ytdlp:clearHistory" => ytdlp::clear_history(),
        "ytdlp:openHistoryItem" => {
            let p = payload.first().and_then(|v| v.as_str()).unwrap_or("");
            ytdlp::open_history_item(p)
        }
        "ytdlp:removeHistoryItem" => {
            let id = payload.first().and_then(|v| v.as_str()).unwrap_or("");
            ytdlp::remove_history_item(id)
        }
        "ytdlp:deleteFileAndHistoryItem" => {
            let id = payload.first().and_then(|v| v.as_str()).unwrap_or("");
            let p = payload.get(1).and_then(|v| v.as_str()).unwrap_or("");
            ytdlp::delete_file_and_history_item(id, p)
        }

        "updater:check" => updater::check(),
        "updater:download" => updater::download(),
        "updater:install" => updater::install(),

        "widget:hide" => Ok(json!({ "success": true })),

        _ => Err(format!("Unhandled api channel: {}", channel)),
    }
}
