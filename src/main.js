import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { engine } from './components/inferenceEngine.js';
import { DatabaseService } from './backend/DatabaseService.js';
import { registerIpcHandlers } from './backend/IpcHandlers.js';
import { ApiServerService } from './backend/ApiServerService.js';
import { HardwareService } from './backend/HardwareService.js';
import { DownloadService } from './backend/DownloadService.js';
import DiscordBridge from './backend/discordBridge.js'; // The new Bridge import

if (started) {
  app.quit();
}

let apiServerInstance = null;
let discordBridgeInstance = null; // Store globally for graceful shutdown

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
  // Initialize Core Services
  const dbService = new DatabaseService(app.getPath('userData'));
  const hardwareScanner = new HardwareService();
  const downloader = new DownloadService(path.join(app.getPath('userData'), 'models'));
  
  // Initialize Network & Bridge Services
  apiServerInstance = new ApiServerService();
  discordBridgeInstance = new DiscordBridge(engine);
  
  // Wire everything into the IPC Router
  registerIpcHandlers(dbService, apiServerInstance, hardwareScanner, downloader);
  
  // Register Discord Bridge IPC Handlers
  ipcMain.handle('start-discord-bot', async (event, config) => {
    try {
      await discordBridgeInstance.start(config);
      return { success: true };
    } catch (error) {
      console.error("Failed to start bot:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('stop-discord-bot', async () => {
    try {
      await discordBridgeInstance.stop();
      return { success: true };
    } catch (error) {
      console.error("Failed to stop bot:", error);
      return { success: false, error: error.message };
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// --- Graceful Shutdown Handlers ---
app.on('window-all-closed', async () => {
  if (apiServerInstance) apiServerInstance.stop();
  if (discordBridgeInstance) await discordBridgeInstance.stop(); // Clean Discord disconnect
  await engine.unload();
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', async () => {
  if (apiServerInstance) apiServerInstance.stop();
  if (discordBridgeInstance) await discordBridgeInstance.stop();
  await engine.unload();
});

process.on('SIGINT', async () => {
  if (apiServerInstance) apiServerInstance.stop();
  if (discordBridgeInstance) await discordBridgeInstance.stop();
  await engine.unload();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (apiServerInstance) apiServerInstance.stop();
  if (discordBridgeInstance) await discordBridgeInstance.stop();
  await engine.unload();
  process.exit(0);
});