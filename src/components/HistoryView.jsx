import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HistoryView({ chatHistory, loadSession, deleteHistory }) {
  // --- NEW: Track which session is pending deletion ---
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleDeleteConfirm = () => {
    if (confirmDeleteId) {
      deleteHistory(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  return (
    <motion.div key="history" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}
      style={{ flex: 1, background: 'rgba(15, 15, 20, 0.8)', backdropFilter: 'blur(32px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', padding: '40px', display: 'flex', flexDirection: 'column', boxShadow: '0 16px 40px rgba(0,0,0,0.8)', overflowY: 'auto', position: 'relative' }}
    >
      {/* --- NEW: Deletion Confirmation Modal --- */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '24px' }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              style={{ background: 'rgba(20, 20, 25, 0.95)', border: '1px solid rgba(255,255,255,0.1)', padding: '32px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 24px 48px rgba(0,0,0,0.8)', maxWidth: '400px', textAlign: 'center' }}
            >
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#ececec', fontSize: '20px', fontWeight: 600 }}>Delete Chat?</h3>
                <p style={{ margin: 0, color: '#888', fontSize: '14px', lineHeight: '1.5' }}>This action cannot be undone. Are you sure you want to permanently delete this session from your database?</p>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <motion.button 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setConfirmDeleteId(null)} 
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#ececec', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: 500, transition: 'background 0.2s' }}
                >
                  Cancel
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleDeleteConfirm} 
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
                >
                  Yes, Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 6px 0', color: '#ececec' }}>Chat Archives</h1>
          <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>Access and reload active environment contexts stored locally within your database directories.</p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
          {chatHistory.length === 0 && (
             <div style={{ padding: '24px', textAlign: 'center', color: '#555', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
               No chat history found. Start a new session!
             </div>
          )}

          {chatHistory.map((session) => (
            <motion.div 
              key={session.id} 
              whileHover={{ scale: 1.01, backgroundColor: 'rgba(20, 184, 166, 0.05)', borderColor: 'rgba(20, 184, 166, 0.3)' }}
              onClick={() => loadSession(session)} 
              style={{ padding: '20px', borderRadius: '16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color 0.2s, background-color 0.2s' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflow: 'hidden' }}>
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#ececec', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.topic}</span>
                <span style={{ fontSize: '13px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '20px' }}>{session.preview}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* --- NEW: History Delete Button --- */}
                <motion.button
                  whileHover={{ scale: 1.15, color: '#ef4444' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation(); 
                    setConfirmDeleteId(session.id);
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </motion.button>

                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}