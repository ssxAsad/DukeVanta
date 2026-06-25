import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function SettingsView({ 
  isLocalMode, setIsLocalMode, 
  selectedApi, setSelectedApi, 
  apiKey, setApiKey,
  selectedModel, setSelectedModel,
  selectedVisionModel, setSelectedVisionModel 
}) {
  const [isBooting, setIsBooting] = useState(false);

  const handleMainFileChange = async () => {
    // 1. Trigger the native Windows/Mac file picker
    const filePath = await window.dukeAPI.openFileDialog();
    
    if (filePath) {
      setIsBooting(true);
      
      // 2. Extract just the filename from the absolute path for the UI
      const fileName = filePath.split('\\').pop().split('/').pop();
      const modelData = { name: fileName, path: filePath };
      
      try {
        const response = await window.dukeAPI.loadModel({
          modelPath: modelData.path,
          visionPath: selectedVisionModel ? selectedVisionModel.path : null
        });

        if (response.success) {
          setSelectedModel(modelData);
        } else {
          console.error("Failed to load model:", response.error);
          alert("Engine Error: " + response.error);
        }
      } catch (err) {
        console.error("IPC Bridge Error:", err);
      }
      
      setIsBooting(false);
    }
  };

  const handleVisionFileChange = async () => {
    if (!selectedModel) return;
    
    const filePath = await window.dukeAPI.openFileDialog();
    
    if (filePath) {
      setIsBooting(true);
      const fileName = filePath.split('\\').pop().split('/').pop();
      const visionData = { name: fileName, path: filePath };
      
      await window.dukeAPI.loadModel({
        modelPath: selectedModel.path,
        visionPath: visionData.path
      });

      setSelectedVisionModel(visionData);
      setIsBooting(false);
    }
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
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Core Intelligence Weights (Required)</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', border: '1px dashed var(--glass-border)', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', color: isBooting ? '#5A35E6' : (selectedModel ? 'white' : 'var(--text-secondary)'), fontWeight: 500, transition: 'all 0.2s', textAlign: 'center' }}>
                {isBooting ? 'Booting Engine into VRAM... (Please wait)' : (selectedModel ? `Loaded: ${selectedModel.name}` : 'No Model Loaded')}
              </div>
              
              {/* Changed from <label for=input> to a simple <button> */}
              <button 
                onClick={handleMainFileChange} 
                disabled={isBooting}
                style={{ padding: '0 32px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-purple))', color: 'white', cursor: isBooting ? 'wait' : 'pointer', fontWeight: 600, opacity: isBooting ? 0.5 : 1, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
              >
                {selectedModel ? 'Change' : 'Browse'}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Vision Projector (Optional mmproj)</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', background: 'rgba(0,0,0,0.1)', color: isBooting ? 'var(--text-secondary)' : (selectedVisionModel ? 'white' : 'var(--text-secondary)'), fontWeight: 500, fontSize: '14px', transition: 'all 0.2s', textAlign: 'center' }}>
                {isBooting ? 'Standby...' : (selectedVisionModel ? `Vision Active: ${selectedVisionModel.name}` : 'No Vision Cortex Loaded')}
              </div>

              {/* Changed from <label for=input> to a simple <button> */}
              <button 
                onClick={handleVisionFileChange} 
                disabled={isBooting || !selectedModel}
                style={{ padding: '0 32px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border)', color: 'white', cursor: (isBooting || !selectedModel) ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: (isBooting || !selectedModel) ? 0.5 : 1 }}
              >
                Add
              </button>
            </div>
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