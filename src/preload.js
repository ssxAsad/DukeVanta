const { contextBridge, ipcRenderer } = require('electron');

// Exposes secure streaming functions to your React frontend under "window.dukeAPI"
contextBridge.exposeInMainWorld('dukeAPI', {
  
  // Sends the prompt, model path, and vision path to the backend
  startChat: (data) => ipcRenderer.invoke('start-chat', data),
  
  // Listens for the incoming stream of words as the AI generates them
  onChatStream: (callback) => {
    // Clears old listeners to prevent double-typing glitches
    ipcRenderer.removeAllListeners('chat-chunk');
    ipcRenderer.on('chat-chunk', (event, chunk) => callback(chunk));
  }

});