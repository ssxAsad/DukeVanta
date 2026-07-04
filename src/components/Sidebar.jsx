import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen, activeView, chatTopic, handleNavigation }) {
  
  const navItems = [
    { id: 'chat', label: 'Current Session' },
    { id: 'history', label: 'Recent Chats' },
    { id: 'personalities', label: 'Personas' },
    { id: 'settings', label: 'System Settings' },
    { id: 'discord-bot', label: 'Tools' }
  ];

  return (
    <>
      {/* Mobile/Overlay Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 90, backdropFilter: 'blur(4px)' }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside 
        initial={{ x: -300 }} 
        animate={{ x: isSidebarOpen ? 0 : -300 }} 
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ width: '280px', background: '#0a0a0c', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 100, boxShadow: isSidebarOpen ? '20px 0 50px rgba(0,0,0,0.5)' : 'none', boxSizing: 'border-box' }}
      >
        {/* Top Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, boxSizing: 'border-box' }}>
          <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '1px', color: '#fff' }}>
            DUKE<span style={{ color: '#7c5cfa' }}>VANTA</span>
          </span>
          <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>

        {/* New Session Button */}
        <div style={{ padding: '24px 24px 12px 24px', flexShrink: 0, boxSizing: 'border-box' }}>
          <button 
            onClick={() => handleNavigation('new')}
            style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(124, 92, 250, 0.1)', color: '#7c5cfa', border: '1px solid rgba(124, 92, 250, 0.3)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
          >
            Initialize New Thread
          </button>
        </div>

        {/* Flat Navigation List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {navItems.map(item => {
              const isActive = activeView === item.id;
              return (
                <button 
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    width: '100%', 
                    padding: '12px 16px', 
                    borderRadius: '10px', 
                    background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent', 
                    border: 'none', 
                    color: isActive ? '#fff' : '#888', 
                    cursor: 'pointer', 
                    textAlign: 'left', 
                    fontWeight: 500, 
                    transition: 'all 0.2s' 
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Status / Topic Indicator */}
        <div style={{ padding: '20px 24px 28px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)', flexShrink: 0, boxSizing: 'border-box' }}>
          <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Active Context</div>
          <div style={{ fontSize: '13px', color: '#ececec', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {activeView === 'chat' ? chatTopic : 'System Interface'}
          </div>
        </div>
      </motion.aside>
    </>
  );
}