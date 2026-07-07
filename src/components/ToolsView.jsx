import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ToolsView({ selectedModel }) {
  const [activeTool, setActiveTool] = useState(null);
  
  // Multi-Bot State
  const [savedBots, setSavedBots] = useState([]);
  const [activeBotIds, setActiveBotIds] = useState({});
  const [editingBot, setEditingBot] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sysError, setSysError] = useState(null);

  useEffect(() => {
    if (activeTool === 'discord-bot') {
      fetchBots();
      checkStatuses();
      const interval = setInterval(checkStatuses, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTool]);

  const fetchBots = async () => {
    const bots = await window.dukeAPI.getDiscordBots();
    setSavedBots(bots);
  };

  const checkStatuses = async () => {
    const statuses = await window.dukeAPI.getBotStatuses();
    setActiveBotIds(statuses);
  };

  const handleCreateNew = () => {
    setSysError(null);
    setEditingBot({
      id: null,
      name: 'New Identity',
      token: '',
      systemPrompt: 'You are a stoic and arrogant entity. You speak with absolute authority and minimal words.'
    });
  };

  const handleSaveBot = async () => {
    if (!editingBot.name || !editingBot.systemPrompt) {
      setSysError("Name and System Prompt are required.");
      return;
    }
    
    setIsLoading(true);
    await window.dukeAPI.saveDiscordBot(editingBot);
    await fetchBots();
    setEditingBot(null);
    setIsLoading(false);
  };

  const handleDeleteBot = async (id, e) => {
    e.stopPropagation();
    if(window.confirm("Are you sure you want to delete this bot profile?")) {
      await window.dukeAPI.deleteDiscordBot(id);
      await fetchBots();
      await checkStatuses();
    }
  };

  const toggleBotState = async (id, e) => {
    e.stopPropagation();
    setSysError(null);
    setIsLoading(true);

    const isRunning = activeBotIds[id];
    let result;
    
    if (isRunning) {
      result = await window.dukeAPI.stopDiscordBot(id);
    } else {
      if (!selectedModel) {
        setSysError("A local model must be loaded in System Settings first.");
        setIsLoading(false);
        return;
      }
      result = await window.dukeAPI.startDiscordBot(id);
    }

    if (result.success) {
      await checkStatuses();
    } else {
      setSysError(result.error || `Failed to ${isRunning ? 'stop' : 'start'} the bot.`);
    }
    setIsLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} style={{ flex: 1, background: 'rgba(15, 15, 20, 0.8)', backdropFilter: 'blur(32px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', padding: '40px', color: 'white', overflowY: 'auto', display: 'flex', gap: '40px' }}>
      
      {/* Left Column */}
      <div style={{ width: '240px', borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h2 style={{ fontWeight: 600, color: '#ececec', margin: '0 0 24px 0', fontSize: '20px' }}>Tools</h2>
        <button onClick={() => setActiveTool('discord-bot')} style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', background: activeTool === 'discord-bot' ? 'rgba(255,255,255,0.05)' : 'transparent', border: '1px solid transparent', color: activeTool === 'discord-bot' ? '#fff' : '#888', cursor: 'pointer', textAlign: 'left', fontWeight: 500, transition: 'all 0.2s' }}>
          Discord Bot Builder
        </button>
      </div>

      {/* Right Column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {activeTool === null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#555' }}>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Select a tool to get started</span>
          </motion.div>
        )}

        {activeTool === 'discord-bot' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '700px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#ececec', fontSize: '18px', fontWeight: 600 }}>Discord Local Bridge</h3>
                <p style={{ margin: 0, color: '#888', fontSize: '13px', lineHeight: '1.5' }}>Manage standalone bot profiles. Multiple bots can share the engine concurrently if using different tokens.</p>
              </div>
              {!editingBot && (
                <button onClick={handleCreateNew} style={{ background: 'rgba(124, 92, 250, 0.1)', color: '#7c5cfa', border: '1px solid rgba(124, 92, 250, 0.3)', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>+ New Identity</button>
              )}
            </div>

            {sysError && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '13px' }}>
                {sysError}
              </div>
            )}

            {/* --- LIST VIEW --- */}
            {!editingBot && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {savedBots.length === 0 ? (
                  <div style={{ gridColumn: 'span 2', padding: '40px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', color: '#555', fontSize: '14px' }}>No identities configured.</div>
                ) : (
                  savedBots.map((bot) => (
                    <div key={bot.id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#ececec' }}>{bot.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                           <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: activeBotIds[bot.id] ? '#14b8a6' : '#555' }} />
                           <span style={{ fontSize: '11px', color: '#888', fontWeight: 600 }}>{activeBotIds[bot.id] ? 'ONLINE' : 'OFFLINE'}</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={(e) => toggleBotState(bot.id, e)} disabled={isLoading} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: activeBotIds[bot.id] ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.05)', background: activeBotIds[bot.id] ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.02)', color: activeBotIds[bot.id] ? '#ef4444' : '#ececec', cursor: isLoading ? 'wait' : 'pointer', fontSize: '12px', fontWeight: 600 }}>
                          {activeBotIds[bot.id] ? 'TERMINATE' : 'INITIALIZE'}
                        </button>
                        <button onClick={() => setEditingBot(bot)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', background: 'transparent', color: '#888', cursor: 'pointer' }}>⚙️</button>
                        <button onClick={(e) => handleDeleteBot(bot.id, e)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>🗑️</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* --- EDITOR VIEW --- */}
            {editingBot && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Bot Name / Alias</label>
                  <input type="text" value={editingBot.name} onChange={(e) => setEditingBot({...editingBot, name: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Authentication Token</label>
                  <input type="password" placeholder={editingBot.token === 'ENCRYPTED_MASK' ? '••••••••••••••••' : 'Paste new token...'} value={editingBot.token === 'ENCRYPTED_MASK' ? '' : editingBot.token} onChange={(e) => setEditingBot({...editingBot, token: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                  {editingBot.id && <span style={{ fontSize: '11px', color: '#555', marginTop: '6px', display: 'block' }}>Leave blank to keep existing secure token.</span>}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Absolute System Prompt</label>
                  <textarea value={editingBot.systemPrompt} onChange={(e) => setEditingBot({...editingBot, systemPrompt: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)', color: '#ececec', outline: 'none', minHeight: '120px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button onClick={handleSaveBot} disabled={isLoading} style={{ flex: 1, padding: '14px', borderRadius: '8px', background: 'rgba(20, 184, 166, 0.1)', color: '#14b8a6', border: '1px solid rgba(20, 184, 166, 0.3)', fontWeight: 600, cursor: 'pointer' }}>{isLoading ? 'Saving...' : 'Commit Configuration'}</button>
                  <button onClick={() => setEditingBot(null)} style={{ padding: '14px 24px', borderRadius: '8px', background: 'transparent', color: '#888', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                </div>

              </motion.div>
            )}

          </motion.div>
        )}
      </div>
    </motion.div>
  );
}