const { Client, GatewayIntentBits } = require('discord.js');

// How many turns a channel can go before we force a fresh context.
// This keeps old scene-setups from lingering in context indefinitely
// and compounding into a "the bot only ever writes this one scene" loop.
const CONTEXT_RESET_EVERY_N_TURNS = 20;

class DiscordBridge {
  constructor(engine) {
    this.engine = engine;
    this.client = null;
    this.systemPrompt = null;

    // Per-channel state for cross-turn repetition detection + context resets
    this.recentReplies = new Map(); // channelId -> string[] (last few bot replies)
    this.turnCounts = new Map();    // channelId -> number
  }

  // Simple Jaccard similarity over normalized word sets. Cheap, no deps,
  // good enough to catch "same scene/beats, different nouns" repeats.
  _similarity(a, b) {
    const norm = (s) =>
      s
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(Boolean);
    const wa = new Set(norm(a));
    const wb = new Set(norm(b));
    if (wa.size === 0 || wb.size === 0) return 0;
    let inter = 0;
    for (const w of wa) if (wb.has(w)) inter++;
    const union = new Set([...wa, ...wb]).size;
    return union === 0 ? 0 : inter / union;
  }

  _isRepeatOfRecent(channelId, text) {
    const recent = this.recentReplies.get(channelId) || [];
    return recent.some((prev) => this._similarity(prev, text) > 0.5);
  }

  _recordReply(channelId, text) {
    const list = this.recentReplies.get(channelId) || [];
    list.push(text);
    this.recentReplies.set(channelId, list.slice(-5)); // keep last 5
  }

  async _maybeResetContext(channelId) {
    const count = (this.turnCounts.get(channelId) || 0) + 1;
    this.turnCounts.set(channelId, count);

    if (count % CONTEXT_RESET_EVERY_N_TURNS === 0 && this.systemPrompt) {
      console.log(
        `[Discord Bridge] Refreshing context for channel ${channelId} after ${count} turns.`
      );
      await this.engine.setPersonality(this.systemPrompt);
      this.recentReplies.delete(channelId);
    }
  }

  async start(config) {
    if (this.client) await this.stop();

    this.systemPrompt = config.systemPrompt;

    // Set the strict personality before bringing the bot online
    await this.engine.setPersonality(config.systemPrompt);

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    // ==========================================
    // DIAGNOSTIC LISTENERS: Terminal Output Only
    // ==========================================
    this.client.on('error', (error) => console.error("[Discord Bridge FATAL ERROR]:", error));
    this.client.on('warn', (info) => console.warn("[Discord Bridge WARNING]:", info));
    this.client.on('debug', (info) => console.log("[Discord Bridge RAW DEBUG]:", info));
    // ==========================================

    this.client.on('ready', () => {
      console.log(`[Discord Bridge] Online as ${this.client.user.tag}`);

      // Force Discord to broadcast the "Online" status to all servers
      this.client.user.setPresence({
        status: 'online',
        activities: [{
          name: 'Local LLM Engine',
          type: 0 // Playing
        }]
      });

      console.log("[Discord Bridge] Presence broadcast forced.");
    });

    this.client.on('messageCreate', async (message) => {
      // Diagnostic log to catch silent message rejections
      console.log(`[Message Detected] Author: ${message.author.tag} | Content: ${message.content}`);

      // Ignore bot messages to prevent infinite loops
      if (message.author.bot) return;

      // Only respond if the bot is specifically mentioned
      if (!message.mentions.has(this.client.user)) return;

      const channelId = message.channel.id;

      try {
        // Strip the mention (<@123...>) from the user's text
        const userText = message.content.replace(/<@!?\d+>/g, '').trim();

        // Show "Bot is typing..." in Discord
        await message.channel.sendTyping();

        // Route to the local model and collect the chunks
        let fullResponse = "";
        await this.engine.generateResponse(userText, (chunk) => {
          fullResponse += chunk;
        });

        // Cross-turn repetition check: if this reply is too similar to one
        // of the last few replies in this channel, regenerate once with an
        // explicit nudge before falling back to whatever we got.
        if (this._isRepeatOfRecent(channelId, fullResponse)) {
          console.warn(`[Discord Bridge] Near-duplicate reply detected in channel ${channelId} — regenerating.`);
          let retryText = "";
          await this.engine.generateResponse(
            userText +
              "\n\n(System note: your last few replies have repeated the same scenario/phrasing. " +
              "Give a genuinely different response this time — new angle, new wording, don't reuse prior setups.)",
            (chunk) => {
              retryText += chunk;
            }
          );
          if (retryText.trim().length > 0) {
            fullResponse = retryText;
          }
        }

        this._recordReply(channelId, fullResponse);
        await this._maybeResetContext(channelId);

        // Split on the "|||" delimiter into up to 3 separate messages,
        // so the bot can send a quick burst of short texts instead of
        // one long paragraph, like a real person would.
        const parts = fullResponse
          .split('|||')
          .map(p => p.trim())
          .filter(p => p.length > 0)
          .slice(0, 3);

        if (parts.length === 0) parts.push("...");

        // Send the first part as a reply, remaining parts as follow-up
        // messages in the channel, with a brief typing pause between
        // each so it reads like natural back-to-back texting.
        await message.reply(parts[0]);

        for (let i = 1; i < parts.length; i++) {
          await message.channel.sendTyping();
          await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));
          await message.channel.send(parts[i]);
        }

      } catch (error) {
        console.error("[Discord Bridge Inference Error]:", error);
        await message.reply("System fault: Engine offline or VRAM overloaded.");
      }
    });

    try {
      await this.client.login(config.token);
      return true;
    } catch (loginError) {
      console.error("[Discord Bridge LOGIN FAILED]:", loginError);
      throw loginError;
    }
  }

  async stop() {
    if (this.client) {
      this.client.destroy();
      this.client = null;
      console.log("[Discord Bridge] Connection terminated.");
    }
    this.recentReplies.clear();
    this.turnCounts.clear();
    return true;
  }
}

export default DiscordBridge;