const { contextBridge, ipcRenderer } = require("electron");

function invoke(channel) {
  return (...args) => ipcRenderer.invoke(channel, ...args);
}

contextBridge.exposeInMainWorld("api", {
  window: {
    minimize: invoke("window:minimize"),
    maximize: invoke("window:maximize"),
    close: invoke("window:close"),
  },
  app: {
    isAdmin: invoke("app:isAdmin"),
    getVersion: invoke("app:getVersion"),
    relaunchAsAdmin: invoke("app:relaunchAsAdmin"),
    showMainWindow: invoke("app:showMainWindow"),
    openExternal: invoke("app:openExternal"),
    openSpeedTestModal: invoke("app:openSpeedTestModal"),
    platform: process.platform,
  },
  system: {
    getStats: invoke("system:getStats"),
    getLiveStats: invoke("system:getLiveStats"),
    getGpuStats: invoke("system:getGpuStats"),
    getProcesses: invoke("system:getProcesses"),
    getProcessCount: invoke("system:getProcessCount"),
    killProcess: invoke("system:killProcess"),
    setPriority: invoke("system:setPriority"),
    optimizeDisk: invoke("system:optimizeDisk"),
  },
  memory: {
    listBackgroundApps: invoke("memory:listBackgroundApps"),
    cleanMemory: invoke("memory:cleanMemory"),
  },
  startup: {
    list: invoke("startup:list"),
    toggle: invoke("startup:toggle"),
  },
  services: {
    list: invoke("services:list"),
    setStatus: invoke("services:setStatus"),
    setStartType: invoke("services:setStartType"),
  },
  cleanup: {
    scan: invoke("cleanup:scan"),
    getTempFilesSize: invoke("cleanup:getTempFilesSize"),
    clean: invoke("cleanup:clean"),
  },
  power: {
    listPlans: invoke("power:listPlans"),
    getBatteryInfo: invoke("power:getBatteryInfo"),
    getShowBatteryPercentage: invoke("power:getShowBatteryPercentage"),
    setShowBatteryPercentage: invoke("power:setShowBatteryPercentage"),
    setActivePlan: invoke("power:setActivePlan"),
    enableUltimatePerformance: invoke("power:enableUltimatePerformance"),
  },
  network: {
    listAdapters: invoke("network:listAdapters"),
    setAdapterEnabled: invoke("network:setAdapterEnabled"),
    flushDns: invoke("network:flushDns"),
    resetWinsock: invoke("network:resetWinsock"),
    resetTcpIp: invoke("network:resetTcpIp"),
    getDnsServers: invoke("network:getDnsServers"),
    setDnsServers: invoke("network:setDnsServers"),
    getWifiSignal: invoke("network:getWifiSignal"),
    runSpeedTest: invoke("network:runSpeedTest"),
  },
  changelog: {
    get: invoke("changelog:get"),
  },
  security: {
    getDefenderStatus: invoke("security:getDefenderStatus"),
    getFirewallStatus: invoke("security:getFirewallStatus"),
    openWindowsSecurity: invoke("security:openWindowsSecurity"),
  },
  uninstaller: {
    listApps: invoke("uninstaller:listApps"),
    uninstallApp: invoke("uninstaller:uninstallApp"),
    scanLeftovers: invoke("uninstaller:scanLeftovers"),
    deleteLeftovers: invoke("uninstaller:deleteLeftovers"),
  },
  tweaks: {
    list: invoke("tweaks:list"),
    apply: invoke("tweaks:apply"),
  },
  tools: {
    runCttWinUtil: invoke("tools:runCttWinUtil"),
    runMassGraveActivation: invoke("tools:runMassGraveActivation"),
  },
  ytdlp: {
    isInstalled: invoke("ytdlp:isInstalled"),
    install: invoke("ytdlp:install"),
    listFormats: invoke("ytdlp:listFormats"),
    getInfo: invoke("ytdlp:getInfo"),
    download: invoke("ytdlp:download"),
    getHistory: invoke("ytdlp:getHistory"),
    clearHistory: invoke("ytdlp:clearHistory"),
    openHistoryItem: invoke("ytdlp:openHistoryItem"),
    removeHistoryItem: invoke("ytdlp:removeHistoryItem"),
    deleteFileAndHistoryItem: invoke("ytdlp:deleteFileAndHistoryItem"),
    onProgress: (callback) => {
      const listener = (_event, data) => callback(data);
      ipcRenderer.on("ytdlp:progress", listener);
      return () => ipcRenderer.removeListener("ytdlp:progress", listener);
    },
  },
  widget: {
    hide: invoke("widget:hide"),
  },
  settings: {
    get: invoke("settings:get"),
    set: invoke("settings:set"),
  },
  updater: {
    check: invoke("updater:check"),
    download: invoke("updater:download"),
    install: invoke("updater:install"),
    onEvent: (callback) => {
      const listener = (_event, data) => callback(data);
      ipcRenderer.on("updater:event", listener);
      return () => ipcRenderer.removeListener("updater:event", listener);
    },
  },
});
