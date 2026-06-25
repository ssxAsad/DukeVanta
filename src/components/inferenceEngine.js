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
      
      // Dynamic import bypasses Vite's aggressive CommonJS transpilation
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
      console.log(`[DukeVanta Engine] 3/3: Pushing Weights to VRAM: ${modelPath}`);
      
      // Dump old VRAM before loading a new model to prevent memory leaks
      await this.unload();

      // Load Core LLM - bypassing the strict v3 memory estimator that causes hanging
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
      temperature: 0.7, // Adds enough randomness to break out of rigid loops
      repeatPenalty: {
        penalty: 1.15,  // Punishes the model for repeating the same string of text
      },
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

// Export a single singleton instance to maintain memory state across the app
export const engine = new InferenceEngine();