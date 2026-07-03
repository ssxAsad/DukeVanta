import si from 'systeminformation';

export class HardwareService {
  constructor() {
    this.vramGB = 0;
    this.gpuName = "";
  }

  async scanHardware() {
    try {
      const graphics = await si.graphics();
      
      // Strict Check: Refuse to proceed if no graphics controllers are found
      if (!graphics || !graphics.controllers || graphics.controllers.length === 0) {
        throw new Error("No graphics controller detected by OS.");
      }

      // Find the GPU with the highest VRAM (filters out basic integrated graphics)
      let primaryGpu = graphics.controllers[0];
      for (const gpu of graphics.controllers) {
        if (gpu.vram && gpu.vram > (primaryGpu.vram || 0)) {
          primaryGpu = gpu;
        }
      }

      // Strict Check: If it has virtually no VRAM, it cannot run local models
      if (!primaryGpu.vram || primaryGpu.vram < 100) {
        throw new Error("Insufficient VRAM architecture detected.");
      }

      this.gpuName = primaryGpu.model || "Standard Graphics Controller";
      this.vramGB = Math.round(primaryGpu.vram / 1024);
      
      console.log(`[DukeVanta Hardware Hook] Detected GPU: ${this.gpuName} | VRAM: ${this.vramGB}GB`);
      
      return {
        compatible: true,
        gpuName: this.gpuName,
        vramGB: this.vramGB
      };
      
    } catch (error) {
      console.error("[DukeVanta Hardware Hook] System check failed:", error.message);
      
      // No assumptions. Explicit incompatibility return.
      return {
        compatible: false,
        error: "This app is not compatible with your pc"
      };
    }
  }
}