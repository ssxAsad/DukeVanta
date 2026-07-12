import path from 'node:path';
import fs from 'node:fs/promises';

export class DatabaseService {
  constructor(userDataPath) {
    this.historyPath = path.join(userDataPath, 'DukeVanta_History.json');
    this.personalitiesPath = path.join(userDataPath, 'DukeVanta_Personalities.json');
    
    this.defaultPersonalities = [
      { 
        id: 'p_default', 
        name: 'DukeVanta Core', 
        description: 'The standard, hyper-intelligent, and analytical default persona.', 
        systemPrompt: 'You are DukeVanta, a highly capable, brilliant, and professional AI assistant. You provide exceptionally accurate, helpful, and well-formatted answers. Always reply in a direct, natural conversational tone, exactly like ChatGPT or Gemini. Never include roleplay text, stage directions, parenthetical actions, or descriptions of physical actions (such as *smiles*, *sighs*, or *nods*).' 
      }
    ];
  }

  // --- HISTORY METHODS ---
  async getHistory() {
    try {
      const data = await fs.readFile(this.historyPath, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      return []; 
    }
  }

  async saveChat(chatData) {
    const history = await this.getHistory();
    const existingIndex = history.findIndex(c => c.id === chatData.id);
    
    if (existingIndex >= 0) {
      history[existingIndex] = chatData; 
    } else {
      history.unshift(chatData); 
    }
    
    await fs.writeFile(this.historyPath, JSON.stringify(history, null, 2));
    return history;
  }

  async deleteChat(id) {
    let history = await this.getHistory();
    history = history.filter(c => c.id !== id);
    await fs.writeFile(this.historyPath, JSON.stringify(history, null, 2));
    return history;
  }

  // --- PERSONALITY METHODS ---
  async getPersonalities() {
    try {
      const data = await fs.readFile(this.personalitiesPath, 'utf-8');
      const parsed = JSON.parse(data);
      // Automatically update the default personality system prompt if it exists and is outdated
      const defaultIndex = parsed.findIndex(p => p.id === 'p_default');
      const currentDefaultPrompt = this.defaultPersonalities[0].systemPrompt;
      if (defaultIndex >= 0 && parsed[defaultIndex].systemPrompt !== currentDefaultPrompt) {
        parsed[defaultIndex].systemPrompt = currentDefaultPrompt;
        parsed[defaultIndex].description = this.defaultPersonalities[0].description;
        await fs.writeFile(this.personalitiesPath, JSON.stringify(parsed, null, 2));
      }
      return parsed;
    } catch (err) {
      await fs.writeFile(this.personalitiesPath, JSON.stringify(this.defaultPersonalities, null, 2));
      return this.defaultPersonalities;
    }
  }

  async addPersonality(parsedData) {
    const per = await this.getPersonalities();
    per.push(parsedData);
    await fs.writeFile(this.personalitiesPath, JSON.stringify(per, null, 2));
    return per;
  }

  async deletePersonality(id) {
    if (id === 'p_default') return; // Core safeguard
    let per = await this.getPersonalities();
    per = per.filter(p => p.id !== id);
    await fs.writeFile(this.personalitiesPath, JSON.stringify(per, null, 2));
    return per;
  }
}