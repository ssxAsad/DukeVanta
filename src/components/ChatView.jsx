import React, { useState, useRef, useEffect } from 'react'; // Added useRef and useEffect
import { motion, AnimatePresence } from 'framer-motion';
import PowerInput from './PowerInput';

const ThinkingFireText = ({ text }) => {
  return (
    <span style={{ display: 'inline-block', wordBreak: 'break-word' }}>
      {Array.from(text).map((char, i) => (
        <span key={`${i}-${char}`} className="fire-letter-loop" style={{ animationDelay: `${i * 0.15}s`, display: 'inline-block' }}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
};

export default function ChatView({ messages, setMessages, selectedModel, selectedVisionModel }) {
  const [input, setInput] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  
  // --- NEW: Auto-scroll anchor point ---
  const messagesEndRef = useRef(null);

  // Automatically pull the view to the bottom whenever messages change or isThinking toggles
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;
    
    if (!selectedModel) {
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        sender: 'agent', 
        text: 'System alert: No local GGUF core model loaded. Please map your weights in Settings.' 
      }]);
      return;
    }

    const currentInput = input;
    const userMsgId = Date.now();
    
    setMessages(prev => [...prev, { id: userMsgId, sender: 'user', text: currentInput }]);
    setInput('');
    setIsThinking(true); 

    const agentMsgId = Date.now() + 1;

    try {
      window.dukeAPI.onChatStream((chunk) => {
        setIsThinking(false);
        setMessages(prev => {
          const messageExists = prev.some(msg => msg.id === agentMsgId);
          if (messageExists) {
            return prev.map(msg => msg.id === agentMsgId ? { ...msg, text: msg.text + chunk } : msg);
          } else {
            return [...prev, { id: agentMsgId, sender: 'agent', text: chunk }];
          }
        });
      });

      await window.dukeAPI.startChat({
        prompt: currentInput
      });

    } catch (error) {
      setIsThinking(false);
      setMessages(prev => {
        const messageExists = prev.some(msg => msg.id === agentMsgId);
        const errorText = `\n\n[Inference Error: Could not connect to local engine. Ensure IPC bridge is active.]`;
        if (messageExists) {
           return prev.map(msg => msg.id === agentMsgId ? { ...msg, text: msg.text + errorText } : msg);
        } else {
           return [...prev, { id: agentMsgId, sender: 'agent', text: errorText }];
        }
      });
    }
  };

  const agentBubbleStyle = {
    borderRadius: '24px 24px 24px 4px', 
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 2px 8px rgba(255, 255, 255, 0.05)',
  };

  return (
    <motion.div 
      key="chat"
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}
      style={{ flex: 1, background: 'var(--glass-surface)', backdropFilter: 'blur(32px)', borderRadius: '24px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', overflow: 'hidden' }}
    >
      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', flex: 1 }}>
        <AnimatePresence>
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}
              >
                <div style={{
                  maxWidth: '75%', padding: '16px 20px', fontSize: '15px', lineHeight: '1.6', fontWeight: 500, color: 'white', position: 'relative',
                  whiteSpace: 'pre-wrap', 
                  ...(isUser ? {
                    borderRadius: '24px 24px 4px 24px', background: 'linear-gradient(135deg, var(--primary-accent), #5A35E6)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 2px 4px rgba(255,255,255,0.2)', border: 'none',
                  } : agentBubbleStyle)
                }}>
                  {msg.text}
                </div>
              </motion.div>
            );
          })}

          {isThinking && (
            <motion.div 
              key="thinking-bubble"
              initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 250, damping: 25 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
            >
              <div style={{ maxWidth: '75%', padding: '16px 20px', fontSize: '15px', lineHeight: '1.6', fontWeight: 600, color: 'var(--primary-accent)', position: 'relative', ...agentBubbleStyle }}>
                <ThinkingFireText text="Processing weights..." />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* --- NEW: The invisible anchor div that we scroll to --- */}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '24px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--glass-border)' }}>
        <motion.form 
          onSubmit={handleSend} 
          animate={isInputFocused ? {
            boxShadow: ['0 0 8px rgba(124, 92, 250, 0.4), inset 0 0 4px rgba(124, 92, 250, 0.2)', '0 0 16px rgba(124, 92, 250, 0.8), inset 0 0 8px rgba(124, 92, 250, 0.4)', '0 0 8px rgba(124, 92, 250, 0.4), inset 0 0 4px rgba(124, 92, 250, 0.2)'],
            borderColor: ['rgba(124, 92, 250, 0.6)', 'rgba(124, 92, 250, 1)', 'rgba(124, 92, 250, 0.6)']
          } : {
            boxShadow: '0 0 0px transparent, inset 0 0 0px transparent', borderColor: 'var(--glass-border)'
          }}
          transition={isInputFocused ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : { duration: 0.3 }}
          style={{ display: 'flex', gap: '12px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', padding: '8px 8px 8px 20px', borderRadius: '16px', transition: 'background 0.3s' }}
        >
          <PowerInput 
            value={input} onChange={setInput} onSubmit={handleSend} 
            onFocus={() => setIsInputFocused(true)} onBlur={() => setIsInputFocused(false)}
          />
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" disabled={isThinking} 
            style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-purple))', color: 'white', fontWeight: 600, fontSize: '14px', cursor: isThinking ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', opacity: isThinking ? 0.5 : 1 }}
          >
            Send
          </motion.button>
        </motion.form>
      </div>
    </motion.div>
  );
}