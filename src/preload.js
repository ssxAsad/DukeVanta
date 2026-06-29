const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dukeAPI', {
  loadModel: (data) => ipcRenderer.invoke('load-model', data),
  startChat: (data) => ipcRenderer.invoke('start-chat', data),
  onChatStream: (callback) => {
    ipcRenderer.removeAllListeners('chat-chunk');
    ipcRenderer.on('chat-chunk', (event, chunk) => callback(chunk));
  },
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  resetEngine: () => ipcRenderer.invoke('reset-engine'),
  
  setEnginePersonality: (sysPrompt) => ipcRenderer.invoke('set-engine-personality', sysPrompt),

  getHistory: () => ipcRenderer.invoke('get-history'),
  saveChat: (chatData) => ipcRenderer.invoke('save-chat', chatData),
  deleteChat: (id) => ipcRenderer.invoke('delete-chat', id),
  
  getPersonalities: () => ipcRenderer.invoke('get-personalities'),
  importPersonality: () => ipcRenderer.invoke('import-personality'),
  deletePersonality: (id) => ipcRenderer.invoke('delete-personality', id),
  
  toggleApiServer: (enable) => ipcRenderer.invoke('toggle-api-server', enable) // NEW
});