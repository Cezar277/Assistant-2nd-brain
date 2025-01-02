const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    openUrl: (url) => ipcRenderer.send('open-url', url)
});