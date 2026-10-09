import { invoke } from "@tauri-apps/api/core";

// Detect if running inside Tauri webview
const isTauri =
  typeof window !== "undefined" &&
  Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__);

function callTauri(channel) {
  return async (...args) => {
    try {
      const result = await invoke("api_dispatch", { channel, payload: args });
      return { ok: true, data: result };
    } catch (err) {
      return { ok: false, error: typeof err === "string" ? err : err?.message || String(err) };
    }
  };
}

if (isTauri) {
  window.api = {
    window: {
      minimize: async () => {
        try {
          await invoke("app_minimize");
          return { ok: true, data: true };
        } catch (err) {
          return { ok: false, error: String(err) };
        }
      },
      maximize: async () => {
        try {
          await invoke("app_maximize");
          return { ok: true, data: true };
        } catch (err) {
          return { ok: false, error: String(err) };
        }
      },
      close: async () => {
        try {
          await invoke("app_close");
          return { ok: true, data: true };
        } catch (err) {
          return { ok: false, error: String(err) };
        }
      },
    },
    app: {
      isAdmin: callTauri("app:isAdmin"),
      getVersion: callTauri("app:getVersion"),
      relaunchAsAdmin: callTauri("app:relaunchAsAdmin"),
      showMainWindow: callTauri("app:showMainWindow"),
      openExternal: callTauri("app:openExternal"),
      openSpeedTestModal: callTauri("app:openSpeedTestModal"),
      platform: "win32",
    },
    system: {
      getStats: callTauri("system:getStats"),
      getLiveStats: callTauri("system:getLiveStats"),
      getGpuStats: callTauri("system:getGpuStats"),
      getProcesses: callTauri("system:getProcesses"),
      getProcessCount: callTauri("system:getProcessCount"),
      killProcess: callTauri("system:killProcess"),
      setPriority: callTauri("system:setPriority"),
      optimizeDisk: callTauri("system:optimizeDisk"),
      getFileIcon: callTauri("system:getFileIcon"),
    },
    memory: {
      listBackgroundApps: callTauri("memory:listBackgroundApps"),
      cleanMemory: callTauri("memory:cleanMemory"),
    },
    startup: {
      list: callTauri("startup:list"),
      toggle: callTauri("startup:toggle"),
    },
    services: {
      list: callTauri("services:list"),
      setStatus: callTauri("services:setStatus"),
      setStartType: callTauri("services:setStartType"),
    },
    cleanup: {
      scan: callTauri("cleanup:scan"),
      getTempFilesSize: callTauri("cleanup:getTempFilesSize"),
      clean: callTauri("cleanup:clean"),
    },
    power: {
      listPlans: callTauri("power:listPlans"),
      getBatteryInfo: callTauri("power:getBatteryInfo"),
      getShowBatteryPercentage: callTauri("power:getShowBatteryPercentage"),
      setShowBatteryPercentage: callTauri("power:setShowBatteryPercentage"),
      setActivePlan: callTauri("power:setActivePlan"),
      enableUltimatePerformance: callTauri("power:enableUltimatePerformance"),
    },
    network: {
      listAdapters: callTauri("network:listAdapters"),
      setAdapterEnabled: callTauri("network:setAdapterEnabled"),
      flushDns: callTauri("network:flushDns"),
      resetWinsock: callTauri("network:resetWinsock"),
      resetTcpIp: callTauri("network:resetTcpIp"),
      getDnsServers: callTauri("network:getDnsServers"),
      setDnsServers: callTauri("network:setDnsServers"),
      getWifiSignal: callTauri("network:getWifiSignal"),
      runSpeedTest: callTauri("network:runSpeedTest"),
    },
    changelog: {
      get: callTauri("changelog:get"),
    },
    security: {
      getDefenderStatus: callTauri("security:getDefenderStatus"),
      getFirewallStatus: callTauri("security:getFirewallStatus"),
      openWindowsSecurity: callTauri("security:openWindowsSecurity"),
    },
    uninstaller: {
      listApps: callTauri("uninstaller:listApps"),
      uninstallApp: callTauri("uninstaller:uninstallApp"),
      scanLeftovers: callTauri("uninstaller:scanLeftovers"),
      deleteLeftovers: callTauri("uninstaller:deleteLeftovers"),
    },
    tweaks: {
      list: callTauri("tweaks:list"),
      apply: callTauri("tweaks:apply"),
    },
    tools: {
      runCttWinUtil: callTauri("tools:runCttWinUtil"),
      runMassGraveActivation: callTauri("tools:runMassGraveActivation"),
    },
    ytdlp: {
      isInstalled: callTauri("ytdlp:isInstalled"),
      install: callTauri("ytdlp:install"),
      listFormats: callTauri("ytdlp:listFormats"),
      getInfo: callTauri("ytdlp:getInfo"),
      download: callTauri("ytdlp:download"),
      getHistory: callTauri("ytdlp:getHistory"),
      clearHistory: callTauri("ytdlp:clearHistory"),
      openHistoryItem: callTauri("ytdlp:openHistoryItem"),
      removeHistoryItem: callTauri("ytdlp:removeHistoryItem"),
      deleteFileAndHistoryItem: callTauri("ytdlp:deleteFileAndHistoryItem"),
      onProgress: () => () => {},
    },
    widget: {
      hide: async () => {
        try {
          await invoke("widget_hide");
          return { ok: true, data: { success: true } };
        } catch (err) {
          return { ok: false, error: String(err) };
        }
      },
    },
    settings: {
      get: callTauri("settings:get"),
      set: callTauri("settings:set"),
    },
    updater: {
      check: callTauri("updater:check"),
      download: callTauri("updater:download"),
      install: callTauri("updater:install"),
      onEvent: () => () => {},
    },
  };
}

export default isTauri;
