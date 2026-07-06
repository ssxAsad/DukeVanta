import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ActiveDownloadTracker({ downloadTracker, handleCancelDownload }) {
  return (
    <AnimatePresence>
      {downloadTracker.active && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          style={{ overflow: 'hidden' }}
        >
          <div style={{ background: 'rgba(20, 184, 166, 0.05)', border: '1px solid rgba(20, 184, 166, 0.3)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Top Row: File Info & Cancel */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#14b8a6', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Active Network Download
                </span>
                <span style={{ fontSize: '14px', color: '#ececec', fontWeight: 500 }}>
                  {downloadTracker.file}
                </span>
              </div>
              <button 
                onClick={handleCancelDownload}
                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '12px', transition: 'all 0.2s' }}
              >
                Terminate
              </button>
            </div>

            {/* Middle Row: Progress Bar */}
            <div style={{ height: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
              <motion.div 
                style={{ height: '100%', background: 'linear-gradient(90deg, #14b8a6, #06b6d4)', width: `${downloadTracker.percent}%` }} 
                transition={{ ease: "linear", duration: 0.5 }} 
              />
            </div>

            {/* Bottom Row: Metrics */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888', fontWeight: 500 }}>
              <span>{downloadTracker.percent.toFixed(1)}%</span>
              <span>{downloadTracker.downloadedMB} MB / {downloadTracker.totalMB} MB</span>
              <span style={{ color: '#14b8a6' }}>{downloadTracker.speed} MB/s</span>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}