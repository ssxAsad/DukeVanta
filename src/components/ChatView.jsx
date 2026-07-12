import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share, Star, MoreHorizontal, Copy, Play, Package, Bot, Zap, Plus, Globe, Code, Mic, Send, Image } from 'lucide-react';
import PowerInput from './PowerInput';
import Logo from './Logo';

export default function ChatView({ messages, setMessages, selectedModel, selectedVisionModel }) {
  const [input, setInput] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const [isMicHovered, setIsMicHovered] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const copyTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (copyErr) {
        console.error('Fallback copy failed', copyErr);
      }
      document.body.removeChild(textArea);
    }
    
    setCopiedMessageId(id);
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedMessageId(null);
    }, 800);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  const handleSend = async (e) => {
    e?.preventDefault();
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
    let hasStartedGenerating = false; 

    try {
      window.dukeAPI.onChatStream((chunk) => {
        if (!hasStartedGenerating) {
          const trimmed = chunk.trimStart();
          if (!trimmed) return; 
          
          hasStartedGenerating = true;
          setIsThinking(false);
          setMessages(prev => [...prev, { id: agentMsgId, sender: 'agent', text: trimmed }]);
        } else {
          setMessages(prev => prev.map(msg => 
            msg.id === agentMsgId ? { ...msg, text: msg.text + chunk } : msg
          ));
        }
      });

      await window.dukeAPI.startChat({ prompt: currentInput });
      setIsThinking(false); 

    } catch (error) {
      setIsThinking(false);
      setMessages(prev => {
        const messageExists = prev.some(msg => msg.id === agentMsgId);
        const errorText = `\n\n[Inference Error: Could not connect to local engine. Ensure IPC bridge is active.]`;
        if (messageExists) {
           return prev.map(msg => msg.id === agentMsgId ? { ...msg, text: msg.text + errorText } : msg);
        } else {
           return [...prev, { id: agentMsgId, sender: 'agent', text: errorText.trimStart() }];
        }
      });
    }
  };

  const agentBubbleStyle = {
    borderRadius: '12px', 
    background: 'var(--surface-card)',
    border: '1px solid var(--border-color)',
    padding: '16px 20px',
    fontSize: '15px',
    lineHeight: '1.6',
    color: 'var(--text-primary)',
    width: '100%'
  };

  return (
    <motion.div 
      key="chat"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'transparent', height: '100%', position: 'relative' }}
    >
      {/* Top Header of Chat */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px 16px 24px', borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Getting started with DukeVanta</h2>
        <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)' }}>
          <Share size={20} style={{ cursor: 'pointer' }} />
          <Star size={20} style={{ cursor: 'pointer' }} />
          <MoreHorizontal size={20} style={{ cursor: 'pointer' }} />
        </div>
      </div>

      <div style={{ flex: 1, padding: '24px 10%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <AnimatePresence>
          {messages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            return (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '800px', margin: '0 auto', gap: '8px' }}
              >
                {isUser ? (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                       <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>10:42 AM</span>
                       <div style={{ padding: '12px 20px', borderRadius: '16px', background: 'var(--primary-accent)', color: '#fff', fontSize: '15px', lineHeight: '1.5' }}>
                         {msg.text}
                       </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, maxWidth: '700px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                         <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>DukeVanta</span>
                         <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>10:42 AM</span>
                       </div>
                       <div style={{ ...agentBubbleStyle, whiteSpace: 'pre-wrap' }}>
                         {msg.text}
                       </div>
                       
                       {/* Agent Actions Row */}
                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                             <button 
                               onClick={() => handleCopy(msg.text, msg.id)} 
                               style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} 
                               onMouseEnter={e => e.currentTarget.style.background='var(--surface-hover)'} 
                               onMouseLeave={e => e.currentTarget.style.background='transparent'}
                             >
                               <Copy size={16} />
                             </button>
                             <AnimatePresence>
                               {copiedMessageId === msg.id && (
                                 <motion.div
                                   initial={{ opacity: 0, y: 5, scale: 0.95, x: '-50%' }}
                                   animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                                   exit={{ opacity: 0, y: 5, scale: 0.95, x: '-50%' }}
                                   style={{
                                     position: 'absolute',
                                     bottom: '36px',
                                     left: '50%',
                                     background: 'rgba(23, 23, 23, 0.95)',
                                     border: '1px solid var(--border-color)',
                                     color: 'var(--text-primary)',
                                     padding: '6px 12px',
                                     borderRadius: '8px',
                                     fontSize: '12px',
                                     whiteSpace: 'nowrap',
                                     zIndex: 300,
                                     pointerEvents: 'none',
                                     boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                   }}
                                 >
                                   Text copied
                                   <div style={{
                                     position: 'absolute',
                                     bottom: '-5px',
                                     left: '50%',
                                     transform: 'translateX(-50%) rotate(45deg)',
                                     width: '8px',
                                     height: '8px',
                                     background: 'rgba(23, 23, 23, 0.95)',
                                     borderRight: '1px solid var(--border-color)',
                                     borderBottom: '1px solid var(--border-color)',
                                   }} />
                                 </motion.div>
                               )}
                             </AnimatePresence>
                          </div>
                       </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}

          {isThinking && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
               <div style={{ ...agentBubbleStyle, maxWidth: '700px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="fire-letter-loop" style={{ color: 'var(--text-secondary)' }}>Processing weights...</span>
               </div>
             </motion.div>
          )}
        </AnimatePresence>

        {messages.length === 0 && !isThinking && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: 'auto', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setInput("How to load a model")}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Package size={20} color="#f59e0b" />
                 <span style={{ fontSize: '14px', fontWeight: 600 }}>How to load a model</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Step-by-step guide</span>
            </div>

            <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setInput("Create a Discord bot")}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Bot size={20} color="#3b82f6" />
                 <span style={{ fontSize: '14px', fontWeight: 600 }}>Create a Discord bot</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Connect and configure</span>
            </div>

            <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setInput("Start API server")}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Zap size={20} color="#eab308" />
                 <span style={{ fontSize: '14px', fontWeight: 600 }}>Start API server</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Enable local inference</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} style={{ height: '20px' }} />
      </div>

      <div style={{ padding: '0 10% 24px 10%' }}>
        <motion.div 
          animate={isInputFocused ? { borderColor: 'var(--primary-accent)', boxShadow: '0 0 0 1px var(--primary-accent)' } : { borderColor: 'var(--border-color)', boxShadow: 'none' }}
          style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface-card)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'visible', transition: 'all 0.2s', maxWidth: '800px', margin: '0 auto', position: 'relative' }}
        >
          <div style={{ padding: '12px 16px' }}>
             <PowerInput 
               value={input} onChange={setInput} onSubmit={handleSend} 
               onFocus={() => setIsInputFocused(true)} onBlur={() => setIsInputFocused(false)}
             />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px 12px 16px' }}>
            <div style={{ display: 'flex', gap: '12px', color: 'var(--text-secondary)' }}>
              <button 
                onClick={() => setIsSubMenuOpen(!isSubMenuOpen)}
                style={{ 
                  background: isSubMenuOpen ? 'var(--primary-accent)' : 'rgba(255,255,255,0.05)', 
                  border: '1px solid var(--border-color)', 
                  color: 'var(--text-primary)', 
                  borderRadius: '50%', 
                  width: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Plus size={16} style={{ transform: isSubMenuOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div 
                style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
                onMouseEnter={() => setIsMicHovered(true)}
                onMouseLeave={() => setIsMicHovered(false)}
              >
                <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mic size={20} />
                </button>
                <AnimatePresence>
                  {isMicHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.95, x: '-50%' }}
                      animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                      exit={{ opacity: 0, y: 5, scale: 0.95, x: '-50%' }}
                      style={{
                        position: 'absolute',
                        bottom: '36px',
                        left: '50%',
                        background: 'rgba(23, 23, 23, 0.95)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        zIndex: 300,
                        pointerEvents: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                      }}
                    >
                      Will be available soon!
                      <div style={{
                        position: 'absolute',
                        bottom: '-5px',
                        left: '50%',
                        transform: 'translateX(-50%) rotate(45deg)',
                        width: '8px',
                        height: '8px',
                        background: 'rgba(23, 23, 23, 0.95)',
                        borderRight: '1px solid var(--border-color)',
                        borderBottom: '1px solid var(--border-color)',
                      }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <button 
                onClick={handleSend}
                disabled={isThinking || !input.trim()}
                style={{ background: 'var(--primary-accent)', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: (isThinking || !input.trim()) ? 'not-allowed' : 'pointer', fontWeight: 500, opacity: (isThinking || !input.trim()) ? 0.5 : 1, transition: 'all 0.2s' }}
              >
                <Send size={16} />
                Send
              </button>
            </div>
          </div>

          {/* Submenu Popover */}
          <AnimatePresence>
            {isSubMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  bottom: '52px',
                  left: '16px',
                  background: 'rgba(23, 23, 23, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  zIndex: 200,
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                  minWidth: '180px'
                }}
              >
                <button 
                  onClick={() => setIsSubMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textAlign: 'left',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Image size={16} style={{ color: 'var(--primary-accent)' }} />
                  <span>Add photos & files</span>
                </button>
                
                <button 
                  onClick={() => setIsSubMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textAlign: 'left',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Globe size={16} style={{ color: 'var(--primary-accent)' }} />
                  <span>Web search</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}