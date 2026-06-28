import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen, activeView, chatTopic, handleNavigation }) {
  return (
    <>
      {/* BACKDROP OVERLAY */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            onClick={() => setIsSidebarOpen(false)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)', zIndex: 40 }}
          />
        )}
      </AnimatePresence>

      {/* SLIDING DRAWER */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '300px', background: 'rgba(10, 10, 15, 0.95)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', borderRight: '1px solid rgba(255,255,255,0.05)', zIndex: 50, display: 'flex', flexDirection: 'column', padding: '32px 24px', boxSizing: 'border-box', boxShadow: '12px 0 40px rgba(0,0,0,0.8)' }}
          >
            <div style={{ marginBottom: '40px', padding: '16px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Current Context</span>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#14b8a6', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chatTopic}</h3>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <motion.button onClick={() => handleNavigation('new')} whileTap={{ scale: 0.96 }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '12px', textAlign: 'left', color: '#ececec', fontWeight: 500, fontSize: '14px', cursor: 'pointer', background: 'transparent', border: 'none' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                New Chat
              </motion.button>
              
              <motion.button onClick={() => handleNavigation('personalities')} whileTap={{ scale: 0.96 }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '12px', textAlign: 'left', color: activeView === 'personalities' ? '#14b8a6' : '#888', fontWeight: activeView === 'personalities' ? 600 : 500, fontSize: '14px', cursor: 'pointer', background: activeView === 'personalities' ? 'rgba(20, 184, 166, 0.1)' : 'transparent', border: 'none' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                Identities
              </motion.button>

              <motion.button onClick={() => handleNavigation('history')} whileTap={{ scale: 0.96 }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '12px', textAlign: 'left', color: activeView === 'history' ? '#14b8a6' : '#888', fontWeight: activeView === 'history' ? 600 : 500, fontSize: '14px', cursor: 'pointer', background: activeView === 'history' ? 'rgba(20, 184, 166, 0.1)' : 'transparent', border: 'none' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                History
              </motion.button>

              <div style={{ margin: 'auto' }} /> 

              <motion.button onClick={() => handleNavigation('settings')} whileTap={{ scale: 0.96 }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', borderRadius: '12px', textAlign: 'left', color: activeView === 'settings' ? '#14b8a6' : '#888', fontWeight: activeView === 'settings' ? 600 : 500, fontSize: '14px', cursor: 'pointer', background: activeView === 'settings' ? 'rgba(20, 184, 166, 0.1)' : 'transparent', border: 'none' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                System Settings
              </motion.button>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}