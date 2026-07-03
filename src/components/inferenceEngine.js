class InferenceEngine {
  constructor() {
    this.llamaModule = null;
    this.llama = null;
    this.model = null;
    this.context = null;
    this.session = null;
    this.systemPrompt = "You are a helpful AI assistant.";
  }

  async initialize() {
    if (!this.llamaModule) {
      this.llamaModule = await import('node-llama-cpp');
    }
    if (!this.llama) {
      // V3 API: Clean initialization without needing to hack the logger stream
      this.llama = await this.llamaModule.getLlama();
    }
  }

  async load(modelPath, visionPath = null, progressCallback = null) {
    await this.initialize();
    await this.unload(); 

    try {
      this.model = await this.llama.loadModel({ 
        modelPath: modelPath,
        // V3 API: Native VRAM progress hook (returns a float between 0.0 and 1.0)
        onLoadProgress: (progress) => {
          if (progressCallback) {
            const percent = Math.min(Math.round(progress * 100), 99);
            progressCallback(percent);
          }
        }
      });
      
      this.context = await this.model.createContext();
      
      this.session = new this.llamaModule.LlamaChatSession({
        contextSequence: this.context.getSequence(),
        systemPrompt: this.systemPrompt
      });

      // Force UI to 100% when the promise resolves and VRAM is firmly locked
      if (progressCallback) progressCallback(100);
      return true;
      
    } catch (error) {
      console.error("[Engine Load Error]:", error);
      throw error;
    }
  }

  async setPersonality(sysPrompt) {
    this.systemPrompt = sysPrompt;
    
    if (this.model && this.llamaModule) {
      // 1. Safely vaporize the old context to wipe VRAM memory of previous chats
      if (this.context) {
          await this.context.dispose();
      }
      
      // 2. Create a brand new, empty context block
      this.context = await this.model.createContext();
      
      // 3. Bind the new session with the new identity rules
      this.session = new this.llamaModule.LlamaChatSession({
         contextSequence: this.context.getSequence(),
         systemPrompt: this.systemPrompt
      });
    }
  }

  async generateResponse(userMessage, chunkCallback) {
    if (!this.session) throw new Error("No model loaded in VRAM.");

    try {
      const response = await this.session.prompt(userMessage, {
        onToken: (chunk) => {
          const text = this.model.detokenize(chunk);
          if (chunkCallback) chunkCallback(text);
        }
      });
      return response;
    } catch (error) {
      console.error("[Engine Inference Error]:", error);
      throw error;
    }
  }

  async unload() {
    this.session = null;
    if (this.context) {
        await this.context.dispose();
        this.context = null;
    }
    if (this.model) {
        await this.model.dispose();
        this.model = null;
    }
  }
}

export const engine = new InferenceEngine();