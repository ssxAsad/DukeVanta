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
  const [selectedApi, setSelectedApi] = useState('Groq');
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState(null); 
  const [selectedVisionModel, setSelectedVisionModel] = useState(null); 

  const prevMsgLength = useRef(0);

  useEffect(() => {
    window.dukeAPI.resetEngine();

    const loadDB = async () => {
      const dbHistory = await window.dukeAPI.getHistory();
      setChatHistory(dbHistory);
      
      const dbPersonalities = await window.dukeAPI.getPersonalities();
      setPersonalities(dbPersonalities);
      setActivePersonality(dbPersonalities[0]); 
    };
    loadDB();
  }, []);

  useEffect(() => {
    if (activePersonality) {
      window.dukeAPI.setEnginePersonality(activePersonality.systemPrompt);
    }
  }, [activePersonality]);

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
      const defaultPersona = updatedPersonalities.find(p => p.id === 'p_default');
      setActivePersonality(defaultPersona);
    }
  };

  const deleteHistory = async (id) => {
    const updatedHistory = await window.dukeAPI.deleteChat(id);
    setChatHistory(updatedHistory);
    
    if (currentSessionId === id) {
      handleNavigation('new');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', position: 'relative', background: '#050505' }}>
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
              <HistoryView chatHistory={chatHistory} loadSession={loadSession} deleteHistory={deleteHistory} />
            )}
            {activeView === 'personalities' && (
              <PersonalityView 
                personalities={personalities} 
                setPersonalities={setPersonalities}
                activePersonality={activePersonality}
                selectPersonality={selectPersonality}
                deletePersonality={deletePersonality} 
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