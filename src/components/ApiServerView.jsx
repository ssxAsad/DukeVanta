import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ApiServerView({ isApiServerActive, setIsApiServerActive }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (isApiServerActive) {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Starting local inference API server on port 8080...`]);
      setTimeout(() => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Engine loaded.`]), 600);
      setTimeout(() => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Listening for connections on 127.0.0.1:8080`]), 1200);
    } else {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Server stopped.`]);
    }
  }, [isApiServerActive]);

  const handleServerToggle = async () => {
    const nextState = !isApiServerActive;
    setIsApiServerActive(nextState);
    if (window.dukeAPI && window.dukeAPI.toggleApiServer) {
      await window.dukeAPI.toggleApiServer(nextState);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} style={{ flex: 1, background: 'var(--surface-main)', borderRadius: '24px', border: '1px solid var(--border-color)', padding: '40px', color: 'white', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 600 }}>Local API Server</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Expose your local models to other applications via a local HTTP endpoint.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: isApiServerActive ? 'var(--success)' : 'var(--text-muted)' }}>
            {isApiServerActive ? 'ONLINE' : 'OFFLINE'}
          </span>
          <div 
            onClick={handleServerToggle}
            style={{ width: '56px', height: '32px', backgroundColor: isApiServerActive ? 'var(--primary-accent)' : 'rgba(255,255,255,0.1)', borderRadius: '100px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 4px', transition: 'all 0.2s ease-in-out', border: '1px solid var(--border-color)' }}
          >
            <motion.div 
              animate={{ x: isApiServerActive ? 24 : 0 }} 
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
            />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, background: '#000', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '16px', fontFamily: 'monospace', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>// DukeVanta API Server Console</div>
        {logs.map((log, i) => (
          <div key={i} style={{ color: log.includes('stopped') ? '#ef4444' : '#10b981', fontSize: '13px' }}>
            {log}
          </div>
        ))}
      </div>

    </motion.div>
  );
}
