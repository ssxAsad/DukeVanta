const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dukeAPI', {
  // --- EXISTING ENGINE & DATA CHANNELS ---
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
  getVramState: () => ipcRenderer.invoke('get-vram-state'),
  importPersonality: () => ipcRenderer.invoke('import-personality'),
  deletePersonality: (id) => ipcRenderer.invoke('delete-personality', id),
  toggleApiServer: (enable) => ipcRenderer.invoke('toggle-api-server', enable),

  // --- DISCORD MULTI-BOT CHANNELS ---
  getDiscordBots: () => ipcRenderer.invoke('get-discord-bots'),
  saveDiscordBot: (botData) => ipcRenderer.invoke('save-discord-bot', botData),
  deleteDiscordBot: (botId) => ipcRenderer.invoke('delete-discord-bot', botId),
  getBotStatuses: () => ipcRenderer.invoke('get-bot-statuses'),
  startDiscordBot: (botId) => ipcRenderer.invoke('start-discord-bot', botId),
  stopDiscordBot: (botId) => ipcRenderer.invoke('stop-discord-bot', botId),

  // --- HARDWARE & DOWNLOAD CHANNELS ---
  scanHardware: () => ipcRenderer.invoke('scan-hardware'),
  downloadModel: (data) => ipcRenderer.invoke('download-model', data),
  cancelDownload: (fileName) => ipcRenderer.invoke('cancel-download', fileName),
  getLocalModels: () => ipcRenderer.invoke('get-local-models'),
  
  // --- HUGGING FACE DYNAMIC HUB CHANNELS ---
  searchHFModels: (query) => ipcRenderer.invoke('search-hf-models', query),
  getHFModelFiles: (modelId) => ipcRenderer.invoke('get-hf-model-files', modelId),
  
  // --- REAL-TIME TELEMETRY STREAMS ---
  onDownloadProgress: (callback) => {
    ipcRenderer.removeAllListeners('download-progress');
    ipcRenderer.on('download-progress', (event, data) => callback(data));
  },
  onLoadProgress: (callback) => {
    ipcRenderer.removeAllListeners('load-progress');
    ipcRenderer.on('load-progress', (event, percent) => callback(percent));
  }
});