import React from 'react';
import { motion } from 'framer-motion';

export default function Header({ setIsSidebarOpen, activeView, isLocalMode }) {
  return (
    <header style={{ height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <motion.button onClick={() => setIsSidebarOpen(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          style={{ background: 'var(--glass-surface)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </motion.button>
        
        <h2 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.3px', textShadow: '0 2px 10px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          DukeVanta <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/</span> 
          <span style={{ color: 'var(--primary-accent)' }}>
            {activeView === 'chat' ? 'Console' : activeView === 'history' ? 'Archives' : 'Settings'}
          </span>
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--glass-surface)', backdropFilter: 'blur(12px)', border: '1px solid var(--glass-border)', padding: '6px 12px', borderRadius: '20px' }}>
        <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 2.5 }}
          style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isLocalMode ? 'var(--success)' : 'var(--primary-accent)' }} 
        />
        <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>{isLocalMode ? 'Local LLM' : 'Cloud API'}</span>
      </div>
    </header>
  );
}