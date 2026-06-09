import React from 'react';
import { motion } from 'framer-motion';

export default function SettingsView({ 
  isLocalMode, setIsLocalMode, 
  selectedApi, setSelectedApi, 
  apiKey, setApiKey,
  selectedModel, setSelectedModel,
  selectedVisionModel, setSelectedVisionModel 
}) {

  const handleMainFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedModel(file);
  };

  const handleVisionFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedVisionModel(file);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
      style={{ flex: 1, background: 'var(--glass-surface)', backdropFilter: 'blur(32px)', borderRadius: '24px', border: '1px solid var(--glass-border)', padding: '40px', color: 'white', overflowY: 'auto' }}
    >
      <h2 style={{ marginBottom: '32px', fontWeight: 600 }}>System Configuration</h2>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        <button onClick={() => setIsLocalMode(true)} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: isLocalMode ? '1px solid rgba(124, 92, 250, 0.6)' : '1px solid var(--glass-border)', background: isLocalMode ? 'rgba(124, 92, 250, 0.1)' : 'transparent', color: 'white', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>
          Local Engine
        </button>
        <button onClick={() => setIsLocalMode(false)} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: !isLocalMode ? '1px solid rgba(124, 92, 250, 0.6)' : '1px solid var(--glass-border)', background: !isLocalMode ? 'rgba(124, 92, 250, 0.1)' : 'transparent', color: 'white', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>
          Cloud API
        </button>
      </div>

      {isLocalMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* CORE LLM DROP-ZONE */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Core Intelligence Weights (Required)</label>
            <input type="file" accept=".gguf" id="model-upload" onChange={handleMainFileChange} style={{ display: 'none' }} />
            <label 
              htmlFor="model-upload" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', border: '1px dashed var(--glass-border)', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', cursor: 'pointer', color: 'var(--primary-accent)', fontWeight: 500, transition: 'all 0.2s', textAlign: 'center' }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(124, 92, 250, 0.6)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
            >
              {selectedModel ? `Loaded: ${selectedModel.name}` : '+ Load Main .gguf Brain'}
            </label>
          </div>

          {/* VISION PROJECTOR DROP-ZONE (Optional) */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Vision Projector (Optional mmproj)</label>
            <input type="file" accept=".gguf" id="vision-upload" onChange={handleVisionFileChange} style={{ display: 'none' }} />
            <label 
              htmlFor="vision-upload" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', background: 'rgba(0,0,0,0.1)', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '14px', transition: 'all 0.2s', textAlign: 'center' }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(124, 92, 250, 0.4)'; e.currentTarget.style.color = 'var(--primary-accent)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              {selectedVisionModel ? `Vision Active: ${selectedVisionModel.name}` : '+ Add Vision Support (mmproj)'}
            </label>
          </div>

        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Provider</label>
            <select value={selectedApi} onChange={(e) => setSelectedApi(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.4)', color: 'white', outline: 'none' }}>
              <option value="Gemini">Gemini</option>
              <option value="Grok">Grok</option>
              <option value="OpenAI">OpenAI</option>
              <option value="Kimmy">Kimmy</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>API Key</label>
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.4)', color: 'white', outline: 'none' }} />
          </div>
        </div>
      )}
    </motion.div>
  );
}