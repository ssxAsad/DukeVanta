import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsView({ isLocalMode, setIsLocalMode, selectedApi, setSelectedApi, apiKey, setApiKey }) {
  return (
    <motion.div 
      key="settings"
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}
      style={{ flex: 1, background: 'var(--glass-surface)', backdropFilter: 'blur(32px)', borderRadius: '24px', border: '1px solid var(--glass-border)', padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', overflowY: 'auto' }}
    >
      <div style={{ maxWidth: '600px', width: '100%', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0' }}>Engine Configuration</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '15px' }}>Determine how DukeVanta processes intelligence. Local execution provides absolute privacy, while APIs offer larger parameter models.</p>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600 }}>Local Execution Mode</h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Run models directly from your local project folder.</p>
          </div>
          
          <div onClick={() => setIsLocalMode(!isLocalMode)} style={{ width: '56px', height: '32px', background: isLocalMode ? 'var(--primary-accent)' : 'rgba(255,255,255,0.1)', borderRadius: '100px', display: 'flex', alignItems: 'center', padding: '4px', cursor: 'pointer', boxSizing: 'border-box', transition: 'background 0.3s' }}>
            <motion.div 
              animate={{ x: isLocalMode ? 24 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}
              style={{ width: '24px', height: '24px', background: '#fff', borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}
            />
          </div>
        </div>

        <AnimatePresence>
          {!isLocalMode && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Provider</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <select value={selectedApi} onChange={(e) => setSelectedApi(e.target.value)}
                    style={{ width: '100%', padding: '16px 40px 16px 16px', borderRadius: '12px', background: 'rgba(15, 15, 20, 0.6)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '15px', fontWeight: 500, outline: 'none', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}>
                    <option value="Gemini">Google Gemini</option>
                    <option value="ChatGPT">OpenAI ChatGPT</option>
                    <option value="Grok">xAI Grok</option>
                    <option value="Kimmy">Kimmy AI</option>
                  </select>
                  <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>API Key</label>
                <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={`Enter secure ${selectedApi} API key...`}
                  style={{ padding: '16px', borderRadius: '12px', background: 'rgba(15, 15, 20, 0.6)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '15px', outline: 'none' }}
                />
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ padding: '16px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-purple))', border: 'none', color: 'white', fontWeight: 600, fontSize: '15px', cursor: 'pointer', marginTop: '12px', boxShadow: '0 4px 16px rgba(124, 92, 250, 0.3)' }}>
                Save Configuration
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}