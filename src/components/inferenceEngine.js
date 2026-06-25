class InferenceEngine {
  constructor() {
    this.llama = null;
    this.model = null;
    this.context = null;
    this.session = null;
    this.currentModelPath = null;
    this.currentVisionPath = null;
    this.LlamaChatSessionClass = null; 
  }

  /**
   * 1. Initialize the C++ backend and hook into native GPU architecture
   */
  async init() {
    if (!this.llama) {
      console.log("[DukeVanta Engine] 1/3: Initializing C++ Engine...");
      
      const nodeLlamaCpp = await new Function('return import("node-llama-cpp")')();
      this.LlamaChatSessionClass = nodeLlamaCpp.LlamaChatSession;
      
      this.llama = await nodeLlamaCpp.getLlama();
      console.log("[DukeVanta Engine] 2/3: Hardware Hook Established.");
    }
  }

  /**
   * 2. Load the core weights into VRAM
   */
  async load(modelPath, visionPath = null) {
    await this.init();

    if (this.currentModelPath !== modelPath || this.currentVisionPath !== visionPath) {
      console.log(`[DukeVanta Engine] 3/3: Pushing 5GB Weights to VRAM: ${modelPath}`);
      
      // Dump old VRAM before loading new model
      await this.unload();

      this.model = await this.llama.loadModel({
        modelPath: modelPath,
        ignoreMemorySafetyChecks: true 
      });

      if (visionPath) {
        console.log(`[DukeVanta Engine] Vision Module mapped at: ${visionPath}`);
      }

      console.log("[DukeVanta Engine] Model Loaded! Creating Context Memory...");
      
      this.context = await this.model.createContext({
        batchSize: 512,         
        threads: 6              
      });

      this.session = new this.LlamaChatSessionClass({
        contextSequence: this.context.getSequence()
      });

      this.currentModelPath = modelPath;
      this.currentVisionPath = visionPath;
      
      console.log(`[DukeVanta Engine] >>> SYSTEM FULLY ONLINE AND READY <<<`);
    }
  }

  /**
   * 3. Process the prompt and stream token chunks back to React
   */
  async generateResponse(promptText, onTokenCallback) {
    if (!this.session) throw new Error("Inference engine not initialized. No model loaded.");

    await this.session.prompt(promptText, {
      onTextChunk(chunk) {
        onTokenCallback(chunk);
      }
    });
  }

  /**
   * 4. Manually dump VRAM (Crucial for Electron lifecycle events)
   */
  async unload() {
    if (this.session || this.context || this.model) {
      console.log("[DukeVanta Engine] Flushing VRAM and shutting down...");
      if (this.session) {
        this.session.dispose();
        this.session = null;
      }
      if (this.context) {
        await this.context.dispose();
        this.context = null;
      }
      if (this.model) {
        await this.model.dispose();
        this.model = null;
      }
      this.currentModelPath = null;
      this.currentVisionPath = null;
      console.log("[DukeVanta Engine] VRAM successfully cleared.");
    }
  }
}

export const engine = new InferenceEngine();