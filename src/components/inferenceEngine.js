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
        // 'auto' lets node-llama-cpp pick the largest number of layers that
        // actually fits in the available VRAM, and fall back toward partial
        // GPU / CPU offload on smaller cards instead of hard-failing.
        // ('max' forces every layer onto the GPU regardless of fit, which is
        // what caused the VRAM error together with the fixed context size.)
        gpuLayers: 'auto',
        // V3 API: Native VRAM progress hook (returns a float between 0.0 and 1.0)
        onLoadProgress: (progress) => {
          if (progressCallback) {
            const percent = Math.min(Math.round(progress * 100), 99);
            progressCallback(percent);
          }
        }
      });
      
      this.context = await this.model.createContext({
        // A plain number here (e.g. contextSize: 4096) forces that EXACT size
        // and throws if it doesn't fit in available VRAM — which is exactly
        // what just happened. { max: 4096 } instead tells it "use up to 4096,
        // but shrink automatically to whatever actually fits." You still get
        // as much context as your hardware allows, without a hard crash.
        contextSize: { max: 4096 },
        batchSize: 512,
        // Use all available CPU threads for the portion of work that stays
        // on CPU (embeddings, sampling, any non-offloaded layers).
        threads: Math.max(1, require('os').cpus().length)
      });
      
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
      this.context = await this.model.createContext({
        contextSize: { max: 4096 },
        batchSize: 512,
        threads: Math.max(1, require('os').cpus().length)
      });
      
      // 3. Bind the new session with the new identity rules
      this.session = new this.llamaModule.LlamaChatSession({
         contextSequence: this.context.getSequence(),
         systemPrompt: this.systemPrompt
      });
    }
  }

  // Generic degenerate-output detector: looks for a short text pattern
  // (anywhere from 4 to 40 chars — a word, phrase, or sentence fragment)
  // that repeats 3 times in a row at the tail of the generated text.
  // This catches token-loop and phrase-loop failure modes regardless of
  // what caused them (greedy decoding, an internal refusal/compliance
  // conflict, degenerate sampling, etc.) without caring about *what*
  // the repeated content actually says.
  _isLooping(fullText) {
    const tail = fullText.slice(-200);
    for (let patLen = 4; patLen <= 40; patLen++) {
      if (tail.length < patLen * 3) continue;
      const p1 = tail.slice(-patLen);
      const p2 = tail.slice(-patLen * 2, -patLen);
      const p3 = tail.slice(-patLen * 3, -patLen * 2);
      if (p1.trim().length > 0 && p1 === p2 && p2 === p3) {
        return true;
      }
    }
    return false;
  }

  async generateResponse(userMessage, chunkCallback) {
    if (!this.session) throw new Error("No model loaded in VRAM.");

    const abortController = new AbortController();
    let fullText = '';
    let loopDetected = false;

    const handleToken = (chunk) => {
      const text = this.model.detokenize(chunk);
      fullText += text;
      if (chunkCallback) chunkCallback(text);

      if (!loopDetected && this._isLooping(fullText)) {
        loopDetected = true;
        console.warn("[Engine] Repetition loop detected — aborting generation early.");
        abortController.abort();
      }
    };

    try {
      const response = await this.session.prompt(userMessage, {
        // Non-zero temperature breaks the greedy-decoding loops that cause
        // repeated phrases; topK/topP add a bit of controlled randomness.
        temperature: 0.7,
        topK: 40,
        topP: 0.9,
        // Repeat penalty window. Note this is a real speed/quality tradeoff:
        // the sampler re-scans this many trailing tokens on *every single
        // generated token*, so lastTokens: 1024 was quietly multiplying the
        // per-token cost of generation many times over — likely the single
        // biggest cause of the lag. 256 still reaches back further than the
        // old 128-token default (enough to stop most loops from re-forming)
        // without paying for a full 1024-token rescan every step. Raise this
        // only if you still see cross-turn repetition and can afford the cost.
        repeatPenalty: {
          lastTokens: 256,
          penalty: 1.3,
          frequencyPenalty: 0.4,
          presencePenalty: 0.3
        },
        maxTokens: 220, // short-reply cap: keeps latency low and backstops the "keep it short" prompt rule
        signal: abortController.signal,
        stopOnAbortSignal: true, // resolve with partial text instead of throwing on abort
        onToken: handleToken
      });

      if (loopDetected) {
        const notice = "\n\n*[Generation stopped — the model got stuck repeating itself.]*";
        if (chunkCallback) chunkCallback(notice);
        return (response || fullText) + notice;
      }
      return response;

    } catch (error) {
      // Some versions/backends may still reject the promise on abort
      // rather than resolving with partial text — handle that gracefully.
      if (loopDetected) {
        const notice = "\n\n*[Generation stopped — the model got stuck repeating itself.]*";
        if (chunkCallback) chunkCallback(notice);
        return fullText + notice;
      }
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