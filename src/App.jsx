import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';

// --- COMPONENTS IMPORTS ---
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatView from './components/ChatView';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';

export default function App() {
  // --- SECTION 1: GLOBAL STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('chat'); // 'chat', 'history', or 'settings'
  const [chatTopic, setChatTopic] = useState('New Interactive Session'); 

  // --- SECTION 2: CHAT DATA ---
  const [messages, setMessages] = useState([
    { id: 1, sender: 'agent', text: 'Core intelligence systems initialized. Waiting for input.' }
  ]);
  const [chatHistory, setChatHistory] = useState([
    { id: 'h1', topic: 'Designing UI Framework', preview: 'Core intelligence systems initialized...' },
    { id: 'h2', topic: 'Local LLM Optimization', preview: 'Configuring quantized GGUF weights...' },
    { id: 'h3', topic: 'MediaPipe Integration', preview: 'Testing pose tracking coordinate maps...' }
  ]);

  // --- SECTION 3: CONFIGURATION DATA ---
  const [isLocalMode, setIsLocalMode] = useState(true);
  const [selectedApi, setSelectedApi] = useState('Groq');
  const [apiKey, setApiKey] = useState('');

  // --- SECTION 4: ROUTER LOGIC ---
  const handleNavigation = (view) => {
    if (view === 'new') {
      setMessages([{ id: Date.now(), sender: 'agent', text: 'New secure session started.' }]);
      setChatTopic('New Interactive Session');
      setActiveView('chat');
    } else if (view === 'history') {
      setActiveView('history');
    } else if (view === 'settings') {
      setActiveView('settings');
    }
    setIsSidebarOpen(false); // Close drawer
  };

  // --- SECTION 5: MASTER RENDER ---
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', position: 'relative' }}>
      
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        activeView={activeView} 
        chatTopic={chatTopic} 
        handleNavigation={handleNavigation} 
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', width: '100%' }}>
        <Header 
          setIsSidebarOpen={setIsSidebarOpen} 
          activeView={activeView} 
          isLocalMode={isLocalMode} 
        />

        <div style={{ flex: 1, padding: '90px 40px 40px 40px', overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="wait">
            {activeView === 'settings' && (
              <SettingsView 
                isLocalMode={isLocalMode} setIsLocalMode={setIsLocalMode} 
                selectedApi={selectedApi} setSelectedApi={setSelectedApi} 
                apiKey={apiKey} setApiKey={setApiKey} 
              />
            )}
            {activeView === 'history' && (
              <HistoryView 
                chatHistory={chatHistory} 
                setChatTopic={setChatTopic} 
                setActiveView={setActiveView} 
              />
            )}
            {activeView === 'chat' && (
              <ChatView 
                messages={messages} 
                setMessages={setMessages} 
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}