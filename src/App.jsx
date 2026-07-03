import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatView from './components/ChatView';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';
import PersonalityView from './components/PersonalityView';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('chat'); 
  const [chatTopic, setChatTopic] = useState('New Interactive Session'); 
  
  const [currentSessionId, setCurrentSessionId] = useState(Date.now().toString());
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);

  const [personalities, setPersonalities] = useState([]);
  const [activePersonality, setActivePersonality] = useState(null);

  const [isLocalMode, setIsLocalMode] = useState(true);
  const [isModelLoaded, setIsModelLoaded] = useState(false); 
  const [isApiServerActive, setIsApiServerActive] = useState(false); 
  const [gpuData, setGpuData] = useState(null);

  const [selectedApi, setSelectedApi] = useState('Groq');
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState(null); 
  const [selectedVisionModel, setSelectedVisionModel] = useState(null); 

  const prevMsgLength = useRef(0);

  useEffect(() => {
    window.dukeAPI.resetEngine();

    const initializeApp = async () => {
      const dbHistory = await window.dukeAPI.getHistory();
      setChatHistory(dbHistory || []);
      
      const dbPersonalities = await window.dukeAPI.getPersonalities();
      if (dbPersonalities && dbPersonalities.length > 0) {
        setPersonalities(dbPersonalities);
        setActivePersonality(dbPersonalities[0]); 
      }
      
      const hwInfo = await window.dukeAPI.scanHardware();
      setGpuData(hwInfo);
    };
    
    initializeApp();
  }, []);

  useEffect(() => {
    if (activePersonality) {
      window.dukeAPI.setEnginePersonality(activePersonality.systemPrompt);
    }
  }, [activePersonality, selectedModel]);

  useEffect(() => {
    setIsModelLoaded(!!selectedModel);
  }, [selectedModel]);

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

    if (messages.length > prevMsgLength.current) {
      save();
      prevMsgLength.current = messages.length;
    } else {
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
      
      // FIX: Force C++ Engine to wipe its VRAM history so the new chat doesn't bleed
      if (activePersonality) {
         window.dukeAPI.setEnginePersonality(activePersonality.systemPrompt);
      }
    } else {
      setActiveView(view);
    }
    setIsSidebarOpen(false); 
  };

  const loadSession = (session) => {
    setCurrentSessionId(session.id);
    setChatTopic(session.topic);
    setMessages(session.messages);
    setActiveView('chat');
  };

  const selectPersonality = (persona) => {
    setActivePersonality(persona);
    handleNavigation('new'); 
  };

  const deletePersonality = async (id) => {
    const updatedPersonalities = await window.dukeAPI.deletePersonality(id);
    setPersonalities(updatedPersonalities);
    if (activePersonality?.id === id) {
      setActivePersonality(updatedPersonalities.find(p => p.id === 'p_default') || updatedPersonalities[0]);
    }
  };

  const deleteHistory = async (id) => {
    const updatedHistory = await window.dukeAPI.deleteChat(id);
    setChatHistory(updatedHistory);
    if (currentSessionId === id) handleNavigation('new');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', position: 'relative', background: '#050505' }}>
      <Sidebar 
        isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} 
        activeView={activeView} chatTopic={chatTopic} handleNavigation={handleNavigation} 
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', width: '100%' }}>
        <Header 
          setIsSidebarOpen={setIsSidebarOpen} 
          activeView={activeView} 
          isLocalMode={isLocalMode} 
          isModelLoaded={isModelLoaded}
          isApiServerActive={isApiServerActive}
          setIsApiServerActive={setIsApiServerActive}
        />

        <div style={{ flex: 1, padding: '90px 40px 40px 40px', overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="wait">
            {activeView === 'settings' && (
              <SettingsView 
                isLocalMode={isLocalMode} setIsLocalMode={setIsLocalMode} 
                selectedApi={selectedApi} setSelectedApi={setSelectedApi} apiKey={apiKey} setApiKey={setApiKey} 
                selectedModel={selectedModel} setSelectedModel={setSelectedModel}
                selectedVisionModel={selectedVisionModel} setSelectedVisionModel={setSelectedVisionModel}
                setIsModelLoaded={setIsModelLoaded}
                gpuData={gpuData} 
              />
            )}
            {activeView === 'history' && <HistoryView chatHistory={chatHistory} loadSession={loadSession} deleteHistory={deleteHistory} />}
            {activeView === 'personalities' && <PersonalityView personalities={personalities} setPersonalities={setPersonalities} activePersonality={activePersonality} selectPersonality={selectPersonality} deletePersonality={deletePersonality} />}
            {activeView === 'chat' && <ChatView messages={messages} setMessages={setMessages} selectedModel={selectedModel} selectedVisionModel={selectedVisionModel} />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}