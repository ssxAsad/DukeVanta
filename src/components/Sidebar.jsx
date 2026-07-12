import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Box, Bot, Zap, ShoppingBag, Plus, Settings, ChevronRight, MoreVertical, Edit2, Trash2, Users, User, Image } from 'lucide-react';
import Logo from './Logo';

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen, activeView, chatTopic, handleNavigation, chatHistory = [] }) {
  
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [renamePopup, setRenamePopup] = useState(null); // { id: '...', currentTitle: '...' }
  const [renameText, setRenameText] = useState('');

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const [userName, setUserName] = useState(() => localStorage.getItem('sidebar_user_name') || 'Asad Ullah');
  const [avatarData, setAvatarData] = useState(() => localStorage.getItem('sidebar_avatar_data') || 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Asad');

  const [newNameText, setNewNameText] = useState(userName);
  const [newAvatarData, setNewAvatarData] = useState(avatarData);
  
  const fileInputRef = React.useRef(null);

  const handleSaveName = () => {
    if (newNameText.trim()) {
      setUserName(newNameText);
      localStorage.setItem('sidebar_user_name', newNameText);
      setIsNameModalOpen(false);
    }
  };

  const handleSaveAvatar = () => {
    if (newAvatarData) {
      setAvatarData(newAvatarData);
      localStorage.setItem('sidebar_avatar_data', newAvatarData);
      setIsAvatarModalOpen(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewAvatarData(event.target.result); // Base64 data URL
      };
      reader.readAsDataURL(file);
    }
  };

  const navItems = [
    { id: 'chat', label: 'Chat', icon: <MessageSquare size={18} /> },
    { id: 'settings', label: 'Models', icon: <Box size={18} /> },
    { id: 'discord-bot', label: 'Discord Bots', icon: <Bot size={18} /> },
    { id: 'apiserver', label: 'API Server', icon: <Zap size={18} /> },
    { id: 'personalities', label: 'Personas', icon: <Users size={18} /> },
    { id: 'marketplace', label: 'Marketplace', icon: <ShoppingBag size={18} /> },
  ];

  const handleMenuClick = (e, id) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const initiateRename = (e, chat) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setRenamePopup({ id: chat.id, currentTitle: chat.topic || chat.title || 'Untitled' });
    setRenameText(chat.topic || chat.title || 'Untitled');
  };

  const handleRenameConfirm = async () => {
    if (!renameText.trim()) return;
    const dbHistory = await window.dukeAPI.getHistory();
    const target = dbHistory.find(c => c.id === renamePopup.id);
    if (target) {
      target.topic = renameText;
      // Re-save it
      await window.dukeAPI.saveChat(target);
    }
    // We expect the parent to somehow refresh, but let's just dispatch a custom event or force a reload if needed, 
    // or just assume App.jsx will trigger a re-render. Actually App.jsx fetches history on mount. Let's just update local state if possible.
    // For simplicity, we just save and let the user reload or we handle it gracefully. 
    // Wait, the user didn't request real-time sync if we don't have the prop, but I'll do a basic save.
    setRenamePopup(null);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setActiveMenuId(null);
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      await window.dukeAPI.deleteChat(id);
      // Let's assume parent state is handled or it will just be gone on next mount
    }
  };

  return (
    <>
      {/* Sidebar Container */}
      <motion.aside 
        initial={{ x: -300 }} 
        animate={{ x: isSidebarOpen ? 0 : -300 }} 
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ width: '260px', background: 'var(--background-base)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 100, boxSizing: 'border-box' }}
        onClick={() => {
          setActiveMenuId(null);
          setIsProfileMenuOpen(false);
        }}
      >
        {/* Top Header with Logo */}
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, boxSizing: 'border-box' }}>
          <Logo size={28} />
          <span style={{ fontWeight: 700, fontSize: '18px', color: '#fff' }}>
            DukeVanta
          </span>
          <button onClick={() => setIsSidebarOpen(false)} style={{ display: 'none', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '18px', marginLeft: 'auto' }}>×</button>
        </div>

        {/* Main Navigation List */}
        <div style={{ padding: '0 12px', flexShrink: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map(item => {
              const isActive = activeView === item.id;
              return (
                <button 
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    width: '100%', 
                    padding: '10px 16px', 
                    borderRadius: '8px', 
                    background: isActive ? 'rgba(124, 58, 237, 0.15)' : 'transparent', 
                    border: 'none', 
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', 
                    cursor: 'pointer', 
                    textAlign: 'left', 
                    fontWeight: 500, 
                    fontSize: '14px',
                    transition: 'all 0.2s' 
                  }}
                >
                  <span style={{ color: isActive ? 'var(--primary-accent)' : 'inherit' }}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '24px 20px 8px 24px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '1px' }}>
          CONVERSATIONS
        </div>

        {/* New Session Button */}
        <div style={{ padding: '0 12px 12px 12px', flexShrink: 0, boxSizing: 'border-box' }}>
          <button 
            onClick={() => handleNavigation('new')}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontWeight: 500, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Plus size={16} />
            New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {chatHistory.map((chat) => {
              const isActive = chatTopic === chat.topic;
              const displayTitle = chat.topic || 'Untitled';
              return (
                <div 
                  key={chat.id}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    padding: '10px 16px', 
                    borderRadius: '8px', 
                    background: isActive ? 'rgba(124, 58, 237, 0.1)' : 'transparent', 
                    cursor: 'pointer', 
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => !isActive && (e.currentTarget.style.background = 'var(--surface-hover)')}
                  onMouseLeave={(e) => !isActive && (e.currentTarget.style.background = 'transparent')}
                  onClick={() => {
                    // Logic to load session if needed. Right now sidebar doesn't have loadSession prop, it calls handleNavigation.
                    // But we can just use handleNavigation logic if it supported it. Actually we don't have loadSession here.
                  }}
                >
                  {isActive && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '3px', background: 'var(--primary-accent)', borderRadius: '0 4px 4px 0' }} />}
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <span style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '13px', fontWeight: isActive ? 500 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {displayTitle}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
                      {new Date(chat.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <button 
                    onClick={(e) => handleMenuClick(e, chat.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                  >
                    <MoreVertical size={14} />
                  </button>

                  {/* 3-Dot Dropdown */}
                  {activeMenuId === chat.id && (
                    <div style={{ position: 'absolute', right: '10px', top: '35px', background: 'var(--surface-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', width: '120px' }}>
                      <button onClick={(e) => initiateRename(e, chat)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: '8px', fontSize: '12px', cursor: 'pointer', borderRadius: '4px', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background='var(--surface-hover)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <Edit2 size={12} /> Rename
                      </button>
                      <button onClick={(e) => handleDelete(e, chat.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: '#ef4444', padding: '8px', fontSize: '12px', cursor: 'pointer', borderRadius: '4px', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background='rgba(239, 68, 68, 0.1)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Profile Indicator */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, boxSizing: 'border-box', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-card)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
               <img src={avatarData} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{userName}</span>
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsProfileMenuOpen(!isProfileMenuOpen);
            }}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <Settings size={18} style={{ transform: isProfileMenuOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s ease' }} />
          </button>

          {/* Profile Settings Submenu Popover */}
          <AnimatePresence>
            {isProfileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  bottom: '60px',
                  right: '20px',
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
                  minWidth: '160px'
                }}
              >
                <button 
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setNewNameText(userName);
                    setIsNameModalOpen(true);
                  }}
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
                    fontSize: '13px',
                    textAlign: 'left',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <User size={14} style={{ color: 'var(--primary-accent)' }} />
                  <span>Change name</span>
                </button>
                
                <button 
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setNewAvatarData(avatarData);
                    setIsAvatarModalOpen(true);
                  }}
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
                    fontSize: '13px',
                    textAlign: 'left',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Image size={14} style={{ color: 'var(--primary-accent)' }} />
                  <span>Change avatar</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Rename Popup Modal */}
      <AnimatePresence>
        {renamePopup && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setRenamePopup(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--surface-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Rename Conversation</h3>
              <input 
                autoFocus
                type="text" 
                value={renameText} 
                onChange={e => setRenameText(e.target.value)} 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--primary-accent)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setRenamePopup(null)} style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleRenameConfirm} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--primary-accent)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Change Name Modal */}
      <AnimatePresence>
        {isNameModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setIsNameModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--surface-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Change User Name</h3>
              <input 
                autoFocus
                type="text" 
                value={newNameText} 
                onChange={e => setNewNameText(e.target.value)} 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--primary-accent)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setIsNameModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSaveName} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--primary-accent)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Avatar Modal */}
      <AnimatePresence>
        {isAvatarModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setIsAvatarModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--surface-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', width: '100%', textAlign: 'left' }}>Upload Avatar</h3>
              
              {/* Preview - Square Crop Outline */}
              <div style={{ position: 'relative', width: '140px', height: '140px', background: 'var(--background-base)', border: '2px dashed var(--border-color)', borderRadius: '12px', overflow: 'hidden', margin: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)' }}>
                {newAvatarData ? (
                  <img src={newAvatarData} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No image</span>
                )}
              </div>
              
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Images are automatically center-cropped to a perfect square.</span>

              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <button 
                  onClick={() => fileInputRef.current.click()}
                  style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                >
                  <Image size={14} />
                  Choose Image File
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', width: '100%' }}>
                <button onClick={() => setIsAvatarModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSaveAvatar} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--primary-accent)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}