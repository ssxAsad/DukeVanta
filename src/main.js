import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';

if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#08080A', // Changed to deep dark black
    show: false, 
    autoHideMenuBar: true, 
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,     
      contextIsolation: false,   
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
};

app.whenReady().then(() => {
  
  // --- DUKEVANTA IPC BACKEND ---
  // Listens for the frontend asking to check for models
  ipcMain.handle('check-models', async () => {
    // Defines the secure path directly inside your project root
    const modelDir = path.join(__dirname, '..', 'models');
    
    // If the directory doesn't exist yet, create it
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
      return { exists: false, count: 0, files: [] };
    }

    // Scan for quantized GGUF weights
    const files = fs.readdirSync(modelDir).filter(file => file.endsWith('.gguf'));
    
    return { 
      exists: files.length > 0, 
      count: files.length, 
      files: files 
    };
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});