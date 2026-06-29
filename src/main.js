import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { engine } from './components/inferenceEngine.js';
import { DatabaseService } from './backend/DatabaseService.js';
import { registerIpcHandlers } from './backend/IpcHandlers.js';
import { ApiServerService } from './backend/ApiServerService.js';

if (started) {
  app.quit();
}

let apiServerInstance = null;

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
  const dbService = new DatabaseService(app.getPath('userData'));
  
  apiServerInstance = new ApiServerService();
  apiServerInstance.start(); // Active by default
  
  registerIpcHandlers(dbService, apiServerInstance);
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', async () => {
  if (apiServerInstance) apiServerInstance.stop();
  await engine.unload();
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', async () => {
  if (apiServerInstance) apiServerInstance.stop();
  await engine.unload();
});