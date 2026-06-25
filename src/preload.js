const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dukeAPI', {
  loadModel: (data) => ipcRenderer.invoke('load-model', data),
  startChat: (data) => ipcRenderer.invoke('start-chat', data),
  onChatStream: (callback) => {
    ipcRenderer.removeAllListeners('chat-chunk');
    ipcRenderer.on('chat-chunk', (event, chunk) => callback(chunk));
  },
  // NEW: Native File Picker route
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog')
});