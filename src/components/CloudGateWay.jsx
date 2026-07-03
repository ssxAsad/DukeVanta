import React from 'react';

export default function CloudGateway({ selectedApi, setSelectedApi, apiKey, setApiKey }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', background: 'rgba(0,0,0,0.2)', padding: '32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden' }}>
      
      {/* Coming Soon Overlay Layer */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 15, 20, 0.4)', backdropFilter: 'blur(2px)' }}>
        <div style={{ background: 'rgba(20, 184, 166, 0.15)', border: '1px solid rgba(20, 184, 166, 0.3)', color: '#14b8a6', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}>
          Will be available soon
        </div>
      </div>

      <div style={{ opacity: 0.3, pointerEvents: 'none' }}>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '14px' }}>Provider Gateway</label>
          <select value={selectedApi} onChange={(e) => setSelectedApi(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.4)', color: 'white', outline: 'none' }}>
            <option value="Groq">Groq</option>
            <option value="Gemini">Gemini</option>
            <option value="OpenAI">OpenAI</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '14px' }}>Access Token Keys</label>
          <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.4)', color: 'white', outline: 'none' }} />
        </div>
      </div>
    </div>
  );
}