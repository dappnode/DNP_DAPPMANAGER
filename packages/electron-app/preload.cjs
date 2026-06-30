const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("dappnodeDesktop", {
  getBackendUrl: () => ipcRenderer.invoke("backend:get"),
  getConnectionConfig: () => ipcRenderer.invoke("connection:get"),
  saveBackendUrl: (backendUrl) => ipcRenderer.invoke("backend:save", backendUrl),
  saveConnectionConfig: (config) => ipcRenderer.invoke("connection:save", config),
  clearBackendUrl: () => ipcRenderer.invoke("backend:clear")
});
