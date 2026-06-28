class InferenceEngine {
  constructor() {
    this.llama = null;
    this.model = null;
    this.context = null;
    this.currentSequence = null; // NEW: Track the specific memory slot
    this.session = null;
    this.currentModelPath = null;
    this.currentVisionPath = null;
    this.LlamaChatSessionClass = null; 
    
    this.currentSystemPrompt = "You are a highly capable, intelligent, and helpful AI assistant.";
  }

  async init() {
    if (!this.llama) {
      console.log("[DukeVanta Engine] 1/3: Initializing C++ Engine...");
      const nodeLlamaCpp = await new Function('return import("node-llama-cpp")')();
      this.LlamaChatSessionClass = nodeLlamaCpp.LlamaChatSession;
      this.llama = await nodeLlamaCpp.getLlama();
      console.log("[DukeVanta Engine] 2/3: Hardware Hook Established.");
    }
  }

  async load(modelPath, visionPath = null) {
    await this.init();

    if (this.currentModelPath !== modelPath || this.currentVisionPath !== visionPath) {
      console.log(`[DukeVanta Engine] 3/3: Pushing Weights to VRAM: ${modelPath}`);
      
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

      this.currentSequence = this.context.getSequence(); // Grab initial sequence

      this.session = new this.LlamaChatSessionClass({
        contextSequence: this.currentSequence,
        systemPrompt: this.currentSystemPrompt
      });

      this.currentModelPath = modelPath;
      this.currentVisionPath = visionPath;
      
      console.log(`[DukeVanta Engine] >>> SYSTEM FULLY ONLINE AND READY <<<`);
    }
  }

  async setPersonality(systemPrompt) {
    this.currentSystemPrompt = systemPrompt;
    
    if (this.context && this.model) {
      console.log("[DukeVanta Engine] Re-allocating Sequence for Identity swap...");
      
      if (this.session) {
        this.session.dispose();
        this.session = null;
      }

      // Instead of killing the whole context, we just return the sequence slot 
      // back to the pool and grab a fresh one instantly.
      if (this.currentSequence) {
        this.currentSequence.dispose(); 
      }
      
      this.currentSequence = this.context.getSequence();
      
      this.session = new this.LlamaChatSessionClass({
        contextSequence: this.currentSequence,
        systemPrompt: this.currentSystemPrompt
      });
      
      console.log("[DukeVanta Engine] Identity Matrix Updated instantly.");
    }
  }

  async generateResponse(promptText, onTokenCallback) {
    if (!this.session) throw new Error("Inference engine not initialized. No model loaded.");

    await this.session.prompt(promptText, {
      temperature: 0.7, 
      repeatPenalty: { penalty: 1.15 },
      onTextChunk(chunk) { onTokenCallback(chunk); }
    });
  }

  async unload() {
    if (this.session || this.currentSequence || this.context || this.model) {
      console.log("[DukeVanta Engine] Flushing VRAM and shutting down...");
      if (this.session) { this.session.dispose(); this.session = null; }
      if (this.currentSequence) { this.currentSequence.dispose(); this.currentSequence = null; }
      if (this.context) { await this.context.dispose(); this.context = null; }
      if (this.model) { await this.model.dispose(); this.model = null; }
      this.currentModelPath = null;
      this.currentVisionPath = null;
      console.log("[DukeVanta Engine] VRAM successfully cleared.");
    }
  }
}

export const engine = new InferenceEngine();