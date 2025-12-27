// preload.js - Expose safe APIs to renderer
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process
// to use the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Gateway control
    getGatewayStatus: () => ipcRenderer.invoke('get-gateway-status'),
    
    // Window control
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    
    // File system
    openWorkspace: () => ipcRenderer.send('open-workspace'),
    
    // Notifications
    showNotification: (title, message) => ipcRenderer.send('show-notification', title, message),
    
    // Events
    onGatewayLog: (callback) => ipcRenderer.on('gateway-log', callback),
    onGatewayError: (callback) => ipcRenderer.on('gateway-error', callback),
    onGatewayStopped: (callback) => ipcRenderer.on('gateway-stopped', callback)
});
