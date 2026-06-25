import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { engine } from './components/inferenceEngine.js';

if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#08080A', 
    show: false, 
    autoHideMenuBar: true, 
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,     
      contextIsolation: true,  
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
  
  // --- NATIVE DESKTOP FILE PICKER ---
  ipcMain.handle('open-file-dialog', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'GGUF Models', extensions: ['gguf'] }]
    });
    if (canceled) return null;
    return filePaths[0]; 
  });

  // --- PRELOAD ENGINE FROM SETTINGS ---
  ipcMain.handle('load-model', async (event, data) => {
    try {
      await engine.load(data.modelPath, data.visionPath || null);
      return { success: true };
    } catch (error) {
      console.error("DukeVanta Engine Pre-load Error:", error);
      return { success: false, error: error.message };
    }
  });

  // --- IPC BRIDGE: CHAT GENERATION ---
  ipcMain.handle('start-chat', async (event, data) => {
    try {
      await engine.generateResponse(data.prompt, (chunk) => {
        event.sender.send('chat-chunk', chunk);
      });
      event.sender.send('chat-complete', true);
      return { success: true };
    } catch (error) {
      console.error("DukeVanta Inference Error:", error);
      event.sender.send('chat-chunk', `\n\n[Inference Error: ${error.message}]`);
      event.sender.send('chat-complete', true);
      return { success: false, error: error.message };
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});


// --- VRAM GARBAGE COLLECTION HOOKS ---

app.on('window-all-closed', async () => {
  await engine.unload();
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', async () => {
  await engine.unload();
});

// Catch terminal restarts
process.on('SIGINT', async () => {
  await engine.unload();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await engine.unload();
  process.exit(0);
});