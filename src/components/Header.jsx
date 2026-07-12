import React from 'react';
import { motion } from 'framer-motion';
import Logo from './Logo'; 

export default function Header({ setIsSidebarOpen, activeView, isLocalMode, isModelLoaded, gpuData }) {
  const [vramState, setVramState] = React.useState(null);

  React.useEffect(() => {
    let interval;
    if (isModelLoaded && isLocalMode && window.dukeAPI.getVramState) {
      interval = setInterval(async () => {
        const state = await window.dukeAPI.getVramState();
        setVramState(state);
      }, 3000);
    } else {
      setVramState(null);
    }
    return () => clearInterval(interval);
  }, [isModelLoaded, isLocalMode]);

  let statusText = "No Model Loaded";
  let statusColor = "#ef4444"; 

  if (isModelLoaded) {
    statusText = isLocalMode ? "Local LLM" : "Cloud API Active";
    statusColor = "#22c55e"; 
  }

  return (
    <header style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '76px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'transparent', zIndex: 50 }}>
      
      {/* Empty Left Space to balance center */}
      <div style={{ width: '200px' }}></div>

      {/* Control Status Assembly Array (Right) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', zIndex: 10, justifyContent: 'flex-end' }}>
        
        {/* Dynamic Model Selector Button */}
        <button style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--surface-card)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.2s', textAlign: 'left' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-card)'}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}99` }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{gpuData?.gpuName || 'GPU'}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '16px' }}>
              {vramState ? `${(vramState.used / 1024 / 1024 / 1024).toFixed(1)}GB / ${(vramState.total / 1024 / 1024 / 1024).toFixed(1)}GB VRAM` : (gpuData?.vramGB ? gpuData.vramGB + 'GB VRAM' : 'Unknown VRAM')} <span style={{ margin: '0 4px' }}>•</span> <span style={{ color: statusColor }}>{statusText}</span>
            </div>
          </div>
        </button>

      </div>
    </header>
  );
}