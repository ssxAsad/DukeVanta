import React from 'react';
import { motion } from 'framer-motion';

export default function HistoryView({ chatHistory, setChatTopic, setActiveView }) {
  return (
    <motion.div key="history" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}
      style={{ flex: 1, background: 'var(--glass-surface)', backdropFilter: 'blur(32px)', borderRadius: '24px', border: '1px solid var(--glass-border)', padding: '40px', display: 'flex', flexDirection: 'column', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', overflowY: 'auto' }}
    >
      <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 6px 0' }}>Chat Archives</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>Access and reload active environment contexts stored locally within your database directories.</p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
          {chatHistory.map((session) => (
            <motion.div 
              key={session.id} 
              whileHover={{ scale: 1.01, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'var(--glass-highlight)' }}
              onClick={() => {
                setChatTopic(session.topic);
                setActiveView('chat');
              }}
              style={{ padding: '20px', borderRadius: '16px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--glass-border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color 0.2s, background-color 0.2s' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>{session.topic}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{session.preview}</span>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}