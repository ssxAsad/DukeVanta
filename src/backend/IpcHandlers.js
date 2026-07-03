import { ipcMain, dialog } from 'electron';
import fs from 'node:fs/promises';
import { engine } from '../components/inferenceEngine.js';
import { HuggingFaceService } from './HuggingFaceService.js'; 

export function registerIpcHandlers(db, apiServer, hardwareScanner, downloader) {
  
  // --- DATABASE BRIDGES ---
  ipcMain.handle('get-history', () => db.getHistory());
  ipcMain.handle('save-chat', (event, chatData) => db.saveChat(chatData));
  ipcMain.handle('delete-chat', (event, id) => db.deleteChat(id));

  ipcMain.handle('get-personalities', () => db.getPersonalities());
  ipcMain.handle('delete-personality', (event, id) => db.deletePersonality(id));
  
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
        throw new Error("Invalid Card Format.");
      }
      
      parsed.id = 'p_' + Date.now();
      return await db.addPersonality(parsed);
    } catch (err) {
      return { error: err.message };
    }
  });

  // --- SERVER SWITCH ROUTING ---
  ipcMain.handle('toggle-api-server', (event, enable) => {
    if (enable) {
      apiServer.start();
    } else {
      apiServer.stop();
    }
    return true;
  });

  // --- HARDWARE & DOWNLOAD MANAGER BRIDGES ---
  ipcMain.handle('scan-hardware', async () => {
    return await hardwareScanner.scanHardware();
  });

  ipcMain.handle('download-model', async (event, data) => {
    try {
      return await downloader.downloadModel(data.url, data.fileName, event.sender);
    } catch (error) {
      console.error("[IPC Download Error]:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('cancel-download', (event, fileName) => {
    return downloader.cancelDownload(fileName);
  });

  ipcMain.handle('get-local-models', async () => {
    return await downloader.getModelList();
  });

  // --- HUGGING FACE API BRIDGES ---
  ipcMain.handle('search-hf-models', async (event, query) => {
    return await HuggingFaceService.searchModels(query);
  });

  ipcMain.handle('get-hf-model-files', async (event, modelId) => {
    return await HuggingFaceService.getModelFiles(modelId);
  });

  // --- ENGINE BRIDGES ---
  ipcMain.handle('set-engine-personality', async (event, sysPrompt) => {
    await engine.setPersonality(sysPrompt);
    return true;
  });

  ipcMain.handle('reset-engine', async () => {
    await engine.unload();
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

  // UPDATED: Now passes the progress callback directly to the engine layer
  ipcMain.handle('load-model', async (event, data) => {
    try {
      await engine.load(data.modelPath, data.visionPath || null, (percent) => {
        event.sender.send('load-progress', percent);
      });
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
}