const { Client, GatewayIntentBits } = require('discord.js');

class DiscordBridge {
  constructor(engine) {
    this.engine = engine; 
    this.client = null;
  }

  async start(config) {
    if (this.client) await this.stop();

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
    return true;
  }
}

export default DiscordBridge;