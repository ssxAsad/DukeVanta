const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dukeAPI', {
  // Engine Bridges
  loadModel: (data) => ipcRenderer.invoke('load-model', data),
  startChat: (data) => ipcRenderer.invoke('start-chat', data),
  onChatStream: (callback) => {
    ipcRenderer.removeAllListeners('chat-chunk');
    ipcRenderer.on('chat-chunk', (event, chunk) => callback(chunk));
  },
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  resetEngine: () => ipcRenderer.invoke('reset-engine'),
  
  // Personality Identity Bridge
  setEnginePersonality: (sysPrompt) => ipcRenderer.invoke('set-engine-personality', sysPrompt),

  // Database Bridges
  getHistory: () => ipcRenderer.invoke('get-history'),
  saveChat: (chatData) => ipcRenderer.invoke('save-chat', chatData),
  deleteChat: (id) => ipcRenderer.invoke('delete-chat', id),
  
  // Personality Database Bridges
  getPersonalities: () => ipcRenderer.invoke('get-personalities'),
  importPersonality: () => ipcRenderer.invoke('import-personality'),
  deletePersonality: (id) => ipcRenderer.invoke('delete-personality', id) // NEW
});