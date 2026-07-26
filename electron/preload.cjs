const { contextBridge, ipcRenderer } = require("electron");

function invoke(channel) {
  return (...args) => ipcRenderer.invoke(channel, ...args);
}

contextBridge.exposeInMainWorld("api", {
  app: {
    isAdmin: invoke("app:isAdmin"),
    getVersion: invoke("app:getVersion"),
    openExternal: invoke("app:openExternal"),
    platform: process.platform,
  },
  system: {
    getStats: invoke("system:getStats"),
    getLiveStats: invoke("system:getLiveStats"),
    getGpuStats: invoke("system:getGpuStats"),
    getProcesses: invoke("system:getProcesses"),
    killProcess: invoke("system:killProcess"),
    setPriority: invoke("system:setPriority"),
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
    setActivePlan: invoke("power:setActivePlan"),
    enableUltimatePerformance: invoke("power:enableUltimatePerformance"),
  },
  network: {
    listAdapters: invoke("network:listAdapters"),
    setAdapterEnabled: invoke("network:setAdapterEnabled"),
    flushDns: invoke("network:flushDns"),
    resetWinsock: invoke("network:resetWinsock"),
    resetTcpIp: invoke("network:resetTcpIp"),
  },
  tweaks: {
    list: invoke("tweaks:list"),
    apply: invoke("tweaks:apply"),
  },
  tools: {
    runCttWinUtil: invoke("tools:runCttWinUtil"),
    openDownloaderWindow: invoke("tools:openDownloaderWindow"),
  },
  ytdlp: {
    isInstalled: invoke("ytdlp:isInstalled"),
    install: invoke("ytdlp:install"),
    listFormats: invoke("ytdlp:listFormats"),
    download: invoke("ytdlp:download"),
    getHistory: invoke("ytdlp:getHistory"),
    openHistoryItem: invoke("ytdlp:openHistoryItem"),
    onProgress: (callback) => {
      const listener = (_event, data) => callback(data);
      ipcRenderer.on("ytdlp:progress", listener);
      return () => ipcRenderer.removeListener("ytdlp:progress", listener);
    },
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
