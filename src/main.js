import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
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
    backgroundColor: '#050505', 
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
  
  const userDataPath = app.getPath('userData'); 
  const historyFilePath = path.join(userDataPath, 'DukeVanta_History.json');
  const personalitiesFilePath = path.join(userDataPath, 'DukeVanta_Personalities.json');
  
  const defaultPersonalities = [
    { 
      id: 'p_default', 
      name: 'DukeVanta Core', 
      description: 'The standard, hyper-intelligent, and analytical default persona.', 
      systemPrompt: 'You are DukeVanta, a highly capable, brilliant, and professional AI assistant. You provide exceptionally accurate and well-formatted answers.' 
    }
  ];

  const readHistory = async () => {
    try {
      const data = await fs.readFile(historyFilePath, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      return []; 
    }
  };

  const readPersonalities = async () => {
    try {
      const data = await fs.readFile(personalitiesFilePath, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      await fs.writeFile(personalitiesFilePath, JSON.stringify(defaultPersonalities, null, 2));
      return defaultPersonalities;
    }
  };

  ipcMain.handle('get-history', async () => {
    return await readHistory();
  });

  ipcMain.handle('save-chat', async (event, chatData) => {
    const history = await readHistory();
    const existingIndex = history.findIndex(c => c.id === chatData.id);
    
    if (existingIndex >= 0) {
      history[existingIndex] = chatData; 
    } else {
      history.unshift(chatData); 
    }
    
    await fs.writeFile(historyFilePath, JSON.stringify(history, null, 2));
    return history;
  });

  ipcMain.handle('delete-chat', async (event, id) => {
    let history = await readHistory();
    history = history.filter(c => c.id !== id);
    await fs.writeFile(historyFilePath, JSON.stringify(history, null, 2));
    return history;
  });

  ipcMain.handle('get-personalities', async () => {
    return await readPersonalities();
  });

  ipcMain.handle('import-personality', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'JSON Identity Cards', extensions: ['json'] }]
    });
    
    if (canceled) return null;
    
    try {
      const rawData = await fs.readFile(filePaths[0], 'utf-8');
      const parsed = JSON.parse(rawData);
      
      if (!parsed.name || !parsed.systemPrompt || !parsed.description) {
        throw new Error("Invalid Card Format. Requires 'name', 'description', and 'systemPrompt'.");
      }
      
      parsed.id = 'p_' + Date.now();
      const per = await readPersonalities();
      per.push(parsed);
      
      await fs.writeFile(personalitiesFilePath, JSON.stringify(per, null, 2));
      return per; 
    } catch (err) {
      return { error: err.message };
    }
  });

  // --- NEW: DELETE PERSONALITY HANDLER ---
  ipcMain.handle('delete-personality', async (event, id) => {
    if (id === 'p_default') return; // Core system safeguard
    let per = await readPersonalities();
    per = per.filter(p => p.id !== id);
    await fs.writeFile(personalitiesFilePath, JSON.stringify(per, null, 2));
    return per;
  });

  ipcMain.handle('set-engine-personality', async (event, sysPrompt) => {
    await engine.setPersonality(sysPrompt);
    return true;
  });

  ipcMain.handle('open-file-dialog', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'GGUF Models', extensions: ['gguf'] }]
    });
    if (canceled) return null;
    return filePaths[0]; 
  });

  ipcMain.handle('load-model', async (event, data) => {
    try {
      await engine.load(data.modelPath, data.visionPath || null);
      return { success: true };
    } catch (error) {
      console.error("DukeVanta Engine Pre-load Error:", error);
      return { success: false, error: error.message };
    }
  });

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

  ipcMain.handle('reset-engine', async () => {
    await engine.unload();
    return true;
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', async () => {
  await engine.unload();
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', async () => {
  await engine.unload();
});

process.on('SIGINT', async () => {
  await engine.unload();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await engine.unload();
  process.exit(0);
});