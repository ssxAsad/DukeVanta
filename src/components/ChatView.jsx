import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatView({ messages, setMessages }) {
  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMsgId = Date.now();
    setMessages(prev => [...prev, { id: userMsgId, sender: 'user', text: input }]);
    setInput('');

    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1,
        sender: 'agent', 
        text: 'Executing localized query across systems...' 
      }]);
    }, 800);
  };

  return (
    <motion.div 
      key="chat"
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}
      style={{ flex: 1, background: 'var(--glass-surface)', backdropFilter: 'blur(32px)', borderRadius: '24px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', overflow: 'hidden' }}
    >
      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1 }}>
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 250, damping: 25 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%', padding: '16px 20px',
                borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                fontSize: '15px', lineHeight: '1.6', fontWeight: 500,
                background: msg.sender === 'user' ? 'linear-gradient(135deg, var(--primary-accent), var(--secondary-purple))' : 'rgba(255,255,255,0.04)',
                border: msg.sender === 'user' ? 'none' : '1px solid var(--glass-border)',
                color: 'white',
                boxShadow: msg.sender === 'user' ? '0 8px 20px rgba(124, 92, 250, 0.3)' : '0 4px 12px rgba(0,0,0,0.2)'
              }}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div style={{ padding: '24px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--glass-border)' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', padding: '8px 8px 8px 20px', borderRadius: '16px' }}>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask DukeVanta to execute a task..."
            style={{ flex: 1, border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 500, outline: 'none' }}
          />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit"
            style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-purple))', color: 'white', fontWeight: 600, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(124, 92, 250, 0.4)' }}>
            Send
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}