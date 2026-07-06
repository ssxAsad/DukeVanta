import React from 'react';

export default function LocalArsenal({ localModels, refreshLocalCache, handleLoadLocal, isBooting }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <label style={{ display: 'block', color: '#ececec', fontWeight: 600, fontSize: '15px' }}>Detected models</label>
        <button onClick={refreshLocalCache} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px' }}>↻ Refresh</button>
      </div>
      
      {localModels.length === 0 ? (
        <div style={{ color: '#555', fontSize: '14px', fontStyle: 'italic', padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
          No models currently downloaded in the local cache.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '8px' }}>
          {localModels.map(model => (
            <div key={model.path} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>{model.filename}</span>
                  <span style={{ color: '#555', fontSize: '11px' }}>{model.path}</span>
                </div>
                <button 
                  onClick={() => handleLoadLocal(model, false)} 
                  disabled={isBooting} 
                  style={{ padding: '8px 16px', background: 'rgba(20, 184, 166, 0.1)', color: '#14b8a6', border: '1px solid rgba(20, 184, 166, 0.3)', borderRadius: '8px', cursor: isBooting ? 'wait' : 'pointer', fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap' }}
                >
                  Load Model
                </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}