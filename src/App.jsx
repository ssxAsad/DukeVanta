import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatView from './components/ChatView';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('chat'); 
  const [chatTopic, setChatTopic] = useState('New Interactive Session'); 

  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([
    { id: 'h1', topic: 'Designing UI Framework', preview: 'Let us swap the neon borders for a cleaner glass effect...' },
    { id: 'h2', topic: 'Local LLM Optimization', preview: 'Can you help me set up the cloudflared tunnel?' },
    { id: 'h3', topic: 'MediaPipe Integration', preview: 'I need to track the coordinates for the pushup counter.' }
  ]);

  const [isLocalMode, setIsLocalMode] = useState(true);
  const [selectedApi, setSelectedApi] = useState('Groq');
  const [apiKey, setApiKey] = useState('');
  
  // THE GLOBAL MODEL STATES
  const [selectedModel, setSelectedModel] = useState(null); 
  const [selectedVisionModel, setSelectedVisionModel] = useState(null); 

  const handleNavigation = (view) => {
    if (view === 'new') {
      setMessages([]); 
      setChatTopic('New Interactive Session');
      setActiveView('chat');
    } else if (view === 'history') {
      setActiveView('history');
    } else if (view === 'settings') {
      setActiveView('settings');
    }
    setIsSidebarOpen(false); 
  };

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
                selectedModel={selectedModel} setSelectedModel={setSelectedModel}
                selectedVisionModel={selectedVisionModel} setSelectedVisionModel={setSelectedVisionModel}
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
                messages={messages} setMessages={setMessages} 
                selectedModel={selectedModel} 
                selectedVisionModel={selectedVisionModel} 
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}