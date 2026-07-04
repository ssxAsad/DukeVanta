import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function ToolsView({ selectedModel }) {
  const [activeTool, setActiveTool] = useState(null); // No tool selected by default
  
  // Bot Builder State
  const [botConfig, setBotConfig] = useState({
    name: 'Vergil',
    token: '',
    systemPrompt: 'You are a stoic and arrogant entity. You speak with absolute authority and minimal words.',
  });

  const [isBotRunning, setIsBotRunning] = useState(false);
  const [isBotLoading, setIsBotLoading] = useState(false);
  const [botError, setBotError] = useState(null);

  const handleInputChange = (e) => {
    setBotConfig({ ...botConfig, [e.target.name]: e.target.value });
  };

  const toggleBotEngine = async () => {
    setBotError(null);
    setIsBotLoading(true);

    try {
      if (!isBotRunning) {
        const result = await window.dukeAPI.startDiscordBot({
          token: botConfig.token,
          systemPrompt: botConfig.systemPrompt,
        });

        if (result.success) {
          setIsBotRunning(true);
        } else {
          setBotError(result.error || 'Failed to start bot.');
        }
      } else {
        const result = await window.dukeAPI.stopDiscordBot();

        if (result.success) {
          setIsBotRunning(false);
        } else {
          setBotError(result.error || 'Failed to stop bot.');
        }
      }
    } catch (err) {
      setBotError(err.message || 'Unexpected error communicating with the bridge.');
    } finally {
      setIsBotLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -15 }} 
      style={{ flex: 1, background: 'rgba(15, 15, 20, 0.8)', backdropFilter: 'blur(32px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', padding: '40px', color: 'white', overflowY: 'auto', display: 'flex', gap: '40px' }}
    >
      
      {/* Left Column: Tool Selection List */}
      <div style={{ width: '240px', borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h2 style={{ fontWeight: 600, color: '#ececec', margin: '0 0 24px 0', fontSize: '20px' }}>Tools</h2>
        
        <button 
          onClick={() => setActiveTool('discord-bot')}
          style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', background: activeTool === 'discord-bot' ? 'rgba(255,255,255,0.05)' : 'transparent', border: '1px solid transparent', color: activeTool === 'discord-bot' ? '#fff' : '#888', cursor: 'pointer', textAlign: 'left', fontWeight: 500, transition: 'all 0.2s' }}
        >
          Discord Bot Builder
        </button>
      </div>

      {/* Right Column: Active Tool Interface */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {activeTool === null && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#555' }}
          >
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Select a tool to get started</span>
            <span style={{ fontSize: '12px', color: '#444' }}>Choose an option from the list on the left</span>
          </motion.div>
        )}

        {activeTool === 'discord-bot' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '600px' }}>
            
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: '#ececec', fontSize: '18px', fontWeight: 600 }}>Discord Local Bridge</h3>
              <p style={{ margin: 0, color: '#888', fontSize: '13px', lineHeight: '1.5' }}>
                Deploy the currently active VRAM model directly to a Discord bot instance. The bot will use the local engine for inference.
              </p>
            </div>

            {/* Status Panel */}
            <div style={{ padding: '16px 20px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Attached Engine</span>
                  <span style={{ fontSize: '14px', color: selectedModel ? '#14b8a6' : '#ef4444', fontWeight: 500 }}>
                    {selectedModel ? selectedModel.name : 'NO MODEL LOADED'}
                  </span>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isBotRunning ? '#14b8a6' : '#555' }} />
                 <span style={{ fontSize: '12px', color: '#888', fontWeight: 600 }}>
                   {isBotLoading ? 'CONNECTING...' : (isBotRunning ? 'ONLINE' : 'OFFLINE')}
                 </span>
               </div>
            </div>

            {/* Configuration Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Bot Identifier</label>
                <input 
                  type="text" 
                  name="name"
                  value={botConfig.name} 
                  onChange={handleInputChange} 
                  placeholder="e.g., Target Identity" 
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)', color: 'white', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Discord Authentication Token</label>
                <input 
                  type="password" 
                  name="token"
                  value={botConfig.token} 
                  onChange={handleInputChange} 
                  placeholder="MTEx..." 
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)', color: 'white', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Absolute System Prompt</label>
                <textarea 
                  name="systemPrompt"
                  value={botConfig.systemPrompt} 
                  onChange={handleInputChange} 
                  placeholder="Define the bot's unyielding personality rules here..."
                  style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)', color: '#ececec', outline: 'none', fontSize: '14px', minHeight: '120px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5', boxSizing: 'border-box' }}
                />
              </div>

            </div>

            {/* Error Message */}
            {botError && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '13px' }}>
                {botError}
              </div>
            )}

            {/* Action Area */}
            <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
              <button 
                onClick={toggleBotEngine}
                disabled={!selectedModel || isBotLoading || !botConfig.token}
                style={{ 
                  width: '100%', 
                  padding: '16px', 
                  borderRadius: '8px', 
                  background: isBotRunning ? 'rgba(239, 68, 68, 0.1)' : (selectedModel ? 'rgba(124, 92, 250, 0.1)' : 'rgba(255,255,255,0.02)'), 
                  color: isBotRunning ? '#ef4444' : (selectedModel ? '#7c5cfa' : '#555'), 
                  border: isBotRunning ? '1px solid rgba(239, 68, 68, 0.3)' : (selectedModel ? '1px solid rgba(124, 92, 250, 0.3)' : '1px solid transparent'), 
                  fontWeight: 600, 
                  cursor: (selectedModel && !isBotLoading && botConfig.token) ? 'pointer' : 'not-allowed', 
                  opacity: isBotLoading ? 0.6 : 1,
                  transition: 'all 0.2s' 
                }}
              >
                {isBotLoading ? 'Working...' : (isBotRunning ? 'Terminate Bridge Connection' : 'Initialize Bot Instance')}
              </button>
              {!selectedModel && (
                <p style={{ textAlign: 'center', margin: '12px 0 0 0', color: '#888', fontSize: '12px' }}>A local model must be loaded in the System Settings to initialize the bridge.</p>
              )}
              {selectedModel && !botConfig.token && (
                <p style={{ textAlign: 'center', margin: '12px 0 0 0', color: '#888', fontSize: '12px' }}>Enter a Discord Authentication Token to initialize the bridge.</p>
              )}
            </div>

          </motion.div>
        )}
      </div>

    </motion.div>
  );
}