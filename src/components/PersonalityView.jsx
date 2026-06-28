import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PersonalityView({ personalities, setPersonalities, activePersonality, selectPersonality, deletePersonality }) {
  const [isImporting, setIsImporting] = useState(false);
  
  // Track which personality card is pending deletion
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleImport = async () => {
    setIsImporting(true);
    const result = await window.dukeAPI.importPersonality();
    
    if (result && !result.error) {
      setPersonalities(result);
    } else if (result && result.error) {
      alert(`Import Failed: ${result.error}\n\nEnsure your JSON file contains "name", "description", and "systemPrompt".`);
    }
    setIsImporting(false);
  };

  const handleDeleteConfirm = () => {
    if (confirmDeleteId) {
      deletePersonality(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  return (
    <motion.div key="personalities" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}
      style={{ flex: 1, background: 'rgba(15, 15, 20, 0.8)', backdropFilter: 'blur(32px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', padding: '40px', display: 'flex', flexDirection: 'column', boxShadow: '0 16px 40px rgba(0,0,0,0.8)', overflowY: 'auto', position: 'relative' }}
    >
      {/* Deletion Confirmation Modal Overlay */}
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
                <h3 style={{ margin: '0 0 8px 0', color: '#ececec', fontSize: '20px', fontWeight: 600 }}>Delete Persona Card?</h3>
                <p style={{ margin: 0, color: '#888', fontSize: '14px', lineHeight: '1.5' }}>Are you sure you want to permanently remove this identity card from your database configuration directories?</p>
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

      <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 6px 0', color: '#ececec' }}>Identity Matrix</h1>
            <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>Import and swap AI persona cards to alter the core instructions and behavior of the local model.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleImport}
            disabled={isImporting}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#ececec', fontWeight: 500, fontSize: '14px', cursor: isImporting ? 'wait' : 'pointer', transition: 'all 0.2s' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            {isImporting ? 'Reading...' : 'Import Card (JSON)'}
          </motion.button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {personalities.map((persona) => {
            const isActive = activePersonality?.id === persona.id;

            return (
              <motion.div 
                key={persona.id} 
                whileHover={{ y: -4, borderColor: isActive ? '#14b8a6' : 'rgba(255,255,255,0.15)' }}
                onClick={() => selectPersonality(persona)}
                style={{ 
                  padding: '24px', 
                  borderRadius: '16px', 
                  background: isActive ? 'linear-gradient(135deg, rgba(20, 184, 166, 0.08), rgba(167, 139, 250, 0.03))' : 'rgba(0,0,0,0.3)', 
                  border: isActive ? '1px solid rgba(20, 184, 166, 0.6)' : '1px solid rgba(255,255,255,0.05)', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#ececec', marginBottom: '8px' }}>{persona.name}</h3>
                    {isActive && (
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', background: '#14b8a6', color: '#050505', padding: '4px 8px', borderRadius: '4px', fontWeight: 700 }}>Active</span>
                    )}
                  </div>
                  
                  {persona.id !== 'p_default' && (
                    <motion.button
                      whileHover={{ scale: 1.15, color: '#ef4444' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation(); 
                        setConfirmDeleteId(persona.id); // Triggers confirmation overlay instead of instant deletion
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </motion.button>
                  )}
                </div>
                
                <p style={{ margin: 0, fontSize: '14px', color: '#888', lineHeight: '1.5' }}>{persona.description}</p>
                
                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>System Prompt</span>
                  <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    "{persona.systemPrompt}"
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </motion.div>
  );
}