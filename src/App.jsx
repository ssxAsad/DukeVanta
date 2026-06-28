import React, { useState, useEffect, useRef } from 'react';
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
  
  const [currentSessionId, setCurrentSessionId] = useState(Date.now().toString());
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);

  const [isLocalMode, setIsLocalMode] = useState(true);
  const [selectedApi, setSelectedApi] = useState('Groq');
  const [apiKey, setApiKey] = useState('');
  
  const [selectedModel, setSelectedModel] = useState(null); 
  const [selectedVisionModel, setSelectedVisionModel] = useState(null); 

  // --- NEW: Prevents saving loop and tracks message count ---
  const prevMsgLength = useRef(0);

  // 1. Initial Load & VRAM Wipe
  useEffect(() => {
    // Whenever VS Code triggers a reload (or the app starts), this instantly flushes the GPU
    window.dukeAPI.resetEngine();

    const loadDB = async () => {
      const dbHistory = await window.dukeAPI.getHistory();
      setChatHistory(dbHistory);
    };
    loadDB();
  }, []);

  // 2. Smart Auto-Save (Instant for new bubbles, debounced for token streams)
  useEffect(() => {
    if (messages.length === 0) {
      prevMsgLength.current = 0;
      return;
    }

    const save = async () => {
      let currentTopic = chatTopic;
      if (currentTopic === 'New Interactive Session') {
        currentTopic = messages[0].text.substring(0, 30) + (messages[0].text.length > 30 ? '...' : '');
        setChatTopic(currentTopic);
      }

      const generatedPreview = messages[messages.length - 1].text.substring(0, 50) + '...';

      const updatedHistory = await window.dukeAPI.saveChat({
        id: currentSessionId,
        topic: currentTopic,
        preview: generatedPreview,
        messages: messages,
        timestamp: Date.now()
      });

      setChatHistory(updatedHistory);
    };

    // If a brand new bubble was added to the UI, save it INSTANTLY
    if (messages.length > prevMsgLength.current) {
      save();
      prevMsgLength.current = messages.length;
    } else {
      // If the AI is just typing inside an existing bubble, debounce to protect the hard drive
      const timeoutId = setTimeout(save, 1000); 
      return () => clearTimeout(timeoutId);
    }
  }, [messages, chatTopic, currentSessionId]);

  const handleNavigation = (view) => {
    if (view === 'new') {
      setCurrentSessionId(Date.now().toString()); 
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

  const loadSession = (session) => {
    setCurrentSessionId(session.id);
    setChatTopic(session.topic);
    setMessages(session.messages);
    setActiveView('chat');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', position: 'relative' }}>
      <Sidebar 
        isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} 
        activeView={activeView} chatTopic={chatTopic} handleNavigation={handleNavigation} 
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', width: '100%' }}>
        <Header setIsSidebarOpen={setIsSidebarOpen} activeView={activeView} isLocalMode={isLocalMode} />

        <div style={{ flex: 1, padding: '90px 40px 40px 40px', overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="wait">
            {activeView === 'settings' && (
              <SettingsView 
                isLocalMode={isLocalMode} setIsLocalMode={setIsLocalMode} 
                selectedApi={selectedApi} setSelectedApi={setSelectedApi} apiKey={apiKey} setApiKey={setApiKey} 
                selectedModel={selectedModel} setSelectedModel={setSelectedModel}
                selectedVisionModel={selectedVisionModel} setSelectedVisionModel={setSelectedVisionModel}
              />
            )}
            {activeView === 'history' && (
              <HistoryView 
                chatHistory={chatHistory} 
                loadSession={loadSession} 
              />
            )}
            {activeView === 'chat' && (
              <ChatView 
                messages={messages} setMessages={setMessages} 
                selectedModel={selectedModel} selectedVisionModel={selectedVisionModel} 
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}