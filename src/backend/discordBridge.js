const { Client, GatewayIntentBits } = require('discord.js');

const CONTEXT_RESET_EVERY_N_TURNS = 20;

class DiscordBridge {
  constructor(engine, manager) {
    this.engine = engine;
    this.manager = manager; // Owns the shared engine queue + loaded-personality tracking
    this.client = null;
    this.systemPrompt = null;
    this.recentReplies = new Map();
    this.turnCounts = new Map();

    // NOTE: there is intentionally no per-bridge queue anymore. The engine
    // is a single shared GPU context that every bot's bridge talks to, so
    // serialization AND "which personality is currently loaded" must live
    // in ONE shared place (DiscordBotManager), not per-bridge. Two bridges
    // each guaranteeing their own internal ordering did nothing to stop
    // them from stomping on each other's personality on the shared engine.
  }

  // Convenience wrapper: run `task` on the shared engine queue, making sure
  // THIS bot's personality is the one loaded first. `force` forces a
  // reload even if we think it's already loaded (used for periodic refresh).
  _enqueue(task, opts) {
    return this.manager.runOnEngine(this.systemPrompt, task, opts);
  }

  _similarity(a, b) {
    const norm = (s) => s.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
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
    this.recentReplies.set(channelId, list.slice(-5));
  }

  async _maybeResetContext(channelId) {
    const count = (this.turnCounts.get(channelId) || 0) + 1;
    this.turnCounts.set(channelId, count);

    if (count % CONTEXT_RESET_EVERY_N_TURNS === 0 && this.systemPrompt) {
      console.log(`[Discord Bridge] Refreshing context for channel ${channelId}`);
      // force: true because we want an actual reload here even though the
      // manager may already believe this bot's personality is loaded.
      await this._enqueue(() => Promise.resolve(), { force: true });
      this.recentReplies.delete(channelId);
    }
  }

  async start(config) {
    if (this.client) await this.stop();
    this.systemPrompt = config.systemPrompt;

    this.client = new Client({
      intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent ],
    });

    this.client.on('error', (error) => console.error("[Discord Bridge FATAL]:", error));
    this.client.on('warn', (info) => console.warn("[Discord Bridge WARN]:", info));

    this.client.on('ready', () => {
      console.log(`[Discord Bridge] Online as ${this.client.user.tag}`);
      this.client.user.setPresence({ status: 'online', activities: [{ name: 'Local LLM Engine', type: 0 }] });
    });

    // We no longer "set the personality once at startup and assume it
    // stays put" — with multiple bots sharing one engine, another bot can
    // load its own personality in between messages. Instead, every engine
    // operation (including generation) goes through _enqueue(), which
    // checks/reloads the personality immediately before it runs. This call
    // just makes sure the personality is loaded before we start accepting
    // messages; per-message generation below re-confirms it every time.
    await this._enqueue(() => Promise.resolve());

    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return;
      if (!message.mentions.has(this.client.user)) return;

      const channelId = message.channel.id;

      try {
        const userText = message.content.replace(/<@!?\d+>/g, '').trim();
        // Fire the typing indicator immediately, before queueing/waiting on
        // inference, so the channel shows activity right away even if a
        // prior message (possibly from another bot) is still being generated.
        await message.channel.sendTyping();

        let fullResponse = await this._enqueue(() =>
          this._generate(userText)
        );

        if (this._isRepeatOfRecent(channelId, fullResponse)) {
          const retryText = await this._enqueue(() =>
            this._generate(
              userText + "\n\n(System note: give a genuinely different response this time. New angle, new wording.)"
            )
          );
          if (retryText.trim().length > 0) fullResponse = retryText;
        }

        this._recordReply(channelId, fullResponse);
        await this._maybeResetContext(channelId);

        const parts = fullResponse.split('|||').map(p => p.trim()).filter(p => p.length > 0).slice(0, 3);
        if (parts.length === 0) parts.push("...");

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

    await this.client.login(config.token);
    return true;
  }

  // Small helper so both the primary attempt and the anti-repeat retry share
  // exactly one code path for calling generateResponse.
  async _generate(prompt) {
    let text = "";
    await this.engine.generateResponse(prompt, (chunk) => {
      text += chunk;
    });
    return text;
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