import fs from 'node:fs';
import path from 'node:path';

export class DownloadService {
  constructor(modelsDir) {
    this.modelsDir = modelsDir;
    this.activeDownloads = new Map(); // Tracks active download streams for cancellation
    
    // Ensure the local storage directory exists on launch
    if (!fs.existsSync(this.modelsDir)) {
      fs.mkdirSync(this.modelsDir, { recursive: true });
    }
  }

  /**
   * Scans the local models directory for existing GGUF files.
   * Maps directly to the UI's 'Local Arsenal' section.
   */
  async getModelList() {
    try {
      const files = await fs.promises.readdir(this.modelsDir);
      
      // FIXED: Added .toLowerCase() to ensure uppercase extensions don't become invisible
      const ggufFiles = files.filter(file => file.toLowerCase().endsWith('.gguf'));
      
      return ggufFiles.map(file => ({
        filename: file,
        path: path.join(this.modelsDir, file)
      }));
    } catch (error) {
      console.error("[DownloadService Cache Scan Error]:", error);
      return [];
    }
  }

  /**
   * Streams a model file from a URL and reports real-time progress to the React UI via IPC.
   */
  async downloadModel(url, fileName, webContents) {
    const targetPath = path.join(this.modelsDir, fileName);

    // If file already exists fully, short-circuit and return success
    if (fs.existsSync(targetPath)) {
      return { success: true, path: targetPath };
    }

    try {
      // Abort controller to allow immediate user cancellation
      const controller = new AbortController();
      this.activeDownloads.set(fileName, controller);

      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP Error: ${response.statusText}`);

      const totalBytes = parseInt(response.headers.get('content-length') || '0', 10);
      const fileStream = fs.createWriteStream(targetPath);
      const reader = response.body.getReader();

      let downloadedBytes = 0;
      let startTime = Date.now();
      let lastProgressTime = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        fileStream.write(Buffer.from(value));
        downloadedBytes += value.length;

        const currentTime = Date.now();
        // Throttle IPC progress updates to 200ms to avoid clogging the Electron IPC channel
        if (currentTime - lastProgressTime > 200 || downloadedBytes === totalBytes) {
          const percent = totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
          const elapsedTime = (currentTime - startTime) / 1000;
          const speedMBps = elapsedTime > 0 ? (downloadedBytes / (1024 * 1024)) / elapsedTime : 0;

          webContents.send('download-progress', {
            fileName,
            percent,
            speedMBps: parseFloat(speedMBps.toFixed(2)),
            downloadedMB: parseFloat((downloadedBytes / (1024 * 1024)).toFixed(1)),
            totalMB: parseFloat((totalBytes / (1024 * 1024)).toFixed(1))
          });

          lastProgressTime = currentTime;
        }
      }

      fileStream.end();
      this.activeDownloads.delete(fileName);
      return { success: true, path: targetPath };

    } catch (error) {
      // Clean up incomplete files on error/cancellation
      if (fs.existsSync(targetPath)) {
        try { await fs.promises.unlink(targetPath); } catch (e) {}
      }
      this.activeDownloads.delete(fileName);
      
      if (error.name === 'AbortError') {
        return { success: false, error: 'Download canceled by user.' };
      }
      throw error;
    }
  }

  /**
   * Interrupts an active download stream using its specific AbortController
   */
  cancelDownload(fileName) {
    const controller = this.activeDownloads.get(fileName);
    if (controller) {
      controller.abort();
      this.activeDownloads.delete(fileName);
      return true;
    }
    return false;
  }
}