const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dukeAPI', {
  // AI Engine Bridges
  loadModel: (data) => ipcRenderer.invoke('load-model', data),
  startChat: (data) => ipcRenderer.invoke('start-chat', data),
  onChatStream: (callback) => {
    ipcRenderer.removeAllListeners('chat-chunk');
    ipcRenderer.on('chat-chunk', (event, chunk) => callback(chunk));
  },
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  
  // --- NEW: VRAM Kill Switch Bridge ---
  resetEngine: () => ipcRenderer.invoke('reset-engine'),

  // History Database Bridges
  getHistory: () => ipcRenderer.invoke('get-history'),
  saveChat: (chatData) => ipcRenderer.invoke('save-chat', chatData),
  deleteChat: (id) => ipcRenderer.invoke('delete-chat', id)
});