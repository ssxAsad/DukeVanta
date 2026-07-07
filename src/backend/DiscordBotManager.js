import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import DiscordBridge from './discordBridge.js';

export default class DiscordBotManager {
  constructor(engine, userDataPath) {
    this.engine = engine;
    this.configPath = path.join(userDataPath, 'discord_bots.json');
    this.activeBridges = new Map(); // Tracks botId -> active bridge instance

    // IMPORTANT: `this.engine` is a single shared LLM/GPU context — it can
    // only have ONE personality loaded at a time. Every bridge used to keep
    // its own private queue and call engine.setPersonality() independently,
    // which meant Bot A and Bot B could silently stomp on each other's
    // loaded personality (whichever bot last called setPersonality wins,
    // even for messages the OTHER bot is about to answer).
    //
    // To fix this, the queue AND the "which personality is currently
    // loaded" tracking live here, at the one place that's actually shared
    // across all bots. Every bridge must route ALL engine access through
    // runOnEngine() instead of touching this.engine directly.
    this._engineQueue = Promise.resolve();
    this._loadedPersonality = null;
  }

  // Every engine operation (from any bridge) goes through here.
  // Before running `task`, we make sure the engine actually has
  // `systemPrompt` loaded — if some other bot's turn ran last, we reload it.
  // `force` lets callers (e.g. the periodic context refresh) require a
  // reload even if the tracked personality string already matches.
  runOnEngine(systemPrompt, task, { force = false } = {}) {
    const run = this._engineQueue.then(async () => {
      if (force || this._loadedPersonality !== systemPrompt) {
        await this.engine.setPersonality(systemPrompt);
        this._loadedPersonality = systemPrompt;
      }
      return task();
    });
    // Swallow errors here so one bot's failure doesn't wedge the shared
    // queue for every other bot; the caller still sees the rejection via `run`.
    this._engineQueue = run.then(() => undefined, () => undefined);
    return run;
  }

  // --- DATABASE OPERATIONS ---

  async _getRawBots() {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      // File doesn't exist yet, return empty array
      return [];
    }
  }

  async getBots() {
    const bots = await this._getRawBots();
    // Strip the real tokens before sending to the frontend for security
    return bots.map(b => ({ ...b, token: b.token ? 'ENCRYPTED_MASK' : '' }));
  }

  async saveBot(botData) {
    const bots = await this._getRawBots();
    let existing = bots.find(b => b.id === botData.id);

    if (existing) {
      existing.name = botData.name;
      existing.systemPrompt = botData.systemPrompt;
      // Only update the token if the user provided a new real token
      if (botData.token && botData.token.trim() !== '' && botData.token !== 'ENCRYPTED_MASK') {
        existing.token = botData.token;
      }
    } else {
      botData.id = crypto.randomUUID();
      bots.push(botData);
    }

    await fs.writeFile(this.configPath, JSON.stringify(bots, null, 2));
    return { success: true, id: botData.id };
  }

  async deleteBot(botId) {
    await this.stopBot(botId); // Clean termination if it's currently running
    let bots = await this._getRawBots();
    bots = bots.filter(b => b.id !== botId);
    await fs.writeFile(this.configPath, JSON.stringify(bots, null, 2));
    return { success: true };
  }

  // --- ENGINE ROUTING & CONCURRENCY ---

  async startBot(botId) {
    if (this.activeBridges.has(botId)) return { success: true };

    const bots = await this._getRawBots();
    const botConfig = bots.find(b => b.id === botId);
    if (!botConfig) throw new Error("Bot configuration not found.");

    // Concurrency Rule: Only one active bot allowed per Discord Token
    for (const [activeId, bridge] of this.activeBridges.entries()) {
      if (bridge.configToken === botConfig.token) {
        throw new Error("Another instance is already running with this authentication token.");
      }
    }

    // Pass `this` (the manager) so the bridge routes all engine access
    // through the shared queue instead of managing its own.
    const bridge = new DiscordBridge(this.engine, this);
    bridge.configToken = botConfig.token; // Store for the concurrency check above

    await bridge.start(botConfig);
    this.activeBridges.set(botId, bridge);
    return { success: true };
  }

  async stopBot(botId) {
    const bridge = this.activeBridges.get(botId);
    if (bridge) {
      await bridge.stop();
      this.activeBridges.delete(botId);
    }
    return { success: true };
  }

  getStatuses() {
    const statuses = {};
    for (const botId of this.activeBridges.keys()) {
      statuses[botId] = true;
    }
    return statuses; // Returns a map of IDs that are currently online
  }

  async stopAll() {
    for (const botId of this.activeBridges.keys()) {
      await this.stopBot(botId);
    }
  }
}