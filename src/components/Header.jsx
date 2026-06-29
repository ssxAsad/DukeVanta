import React from 'react';
import { motion } from 'framer-motion';

export default function Header({ setIsSidebarOpen, activeView, isLocalMode, isModelLoaded, isApiServerActive, setIsApiServerActive }) {
  
  const handleServerToggle = async () => {
    const nextState = !isApiServerActive;
    setIsApiServerActive(nextState);
    await window.dukeAPI.toggleApiServer(nextState);
  };

  // Dynamic evaluation of real-time engine states
  let statusText = "No Model Loaded";
  let statusColor = "#ef4444"; // Warning Red

  if (isModelLoaded) {
    statusText = isLocalMode ? "Local LLM" : "Cloud API Active";
    statusColor = "#14b8a6"; // Premium Teal
  }

  return (
    <header style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', background: 'linear-gradient(to bottom, #050505 60%, transparent)', borderBottom: '1px solid rgba(255,255,255,0.02)', zIndex: 50 }}>
      
      {/* Sidebar Trigger */}
      <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'transparent', border: 'none', color: '#ececec', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>

      {/* Control Status Assembly Array */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
        
        {/* API Server Switch Container */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#ececec', fontWeight: 600, letterSpacing: '0.5px' }}>
            API SERVER
          </span>
          <div 
            onClick={handleServerToggle}
            style={{ width: '40px', height: '22px', backgroundColor: isApiServerActive ? 'rgba(124, 92, 250, 0.15)' : 'rgba(255,255,255,0.05)', borderRadius: '100px', border: isApiServerActive ? '1px solid rgba(124, 92, 250, 0.5)' : '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 2px', transition: 'all 0.2s ease-in-out' }}
          >
            <motion.div 
              animate={{ x: isApiServerActive ? 20 : 0 }} // FIXED: Slides perfectly to the right edge
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: isApiServerActive ? '#7c5cfa' : '#555', boxShadow: isApiServerActive ? '0 0 10px rgba(124, 92, 250, 0.8)' : 'none' }}
            />
          </div>
        </div>

        {/* Separator Line */}
        <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

        {/* Dynamic VRAM Status Dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '6px 14px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.03)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusColor, boxShadow: `0 0 10px ${statusColor}`, transition: 'all 0.3s ease' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#ececec', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {statusText}
          </span>
        </div>

      </div>
    </header>
  );
}