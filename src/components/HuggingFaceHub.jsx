import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HuggingFaceHub({ 
  gpuData, localModels, downloadTracker, selectedModel, isBooting, 
  handleAction, handleCancelDownload, handleBrowseCustom, setConfirmEject 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repoFiles, setRepoFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [llmDropdownOpen, setLlmDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setLlmDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (queryStr) => {
    setSearchQuery(queryStr);
    if (!queryStr.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results = await window.dukeAPI.searchHFModels(queryStr);
    setSearchResults(results || []);
    setIsSearching(false);
  };

  const handleSelectRepo = async (repo) => {
    if (selectedRepo?.id === repo.id) {
      setSelectedRepo(null);
      setRepoFiles([]);
      return;
    }
    setSelectedRepo(repo);
    setIsLoadingFiles(true);
    const files = await window.dukeAPI.getHFModelFiles(repo.id);
    setRepoFiles(files || []);
    setIsLoadingFiles(false);
  };

  const calculateModelSpeedBadge = (sizeGB) => {
    if (!gpuData || !gpuData.compatible) return null;
    const size = parseFloat(sizeGB);
    if (isNaN(size)) return null;
    const requiredVram = size * 1.2;

    if (gpuData.vramGB >= requiredVram) return <span style={{ padding: '2px 8px', background: 'rgba(20, 184, 166, 0.15)', color: '#14b8a6', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>🟢 FAST</span>;
    if (gpuData.vramGB >= requiredVram * 0.5) return <span style={{ padding: '2px 8px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>🟡 MODERATE</span>;
    return <span style={{ padding: '2px 8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>🔴 SLOW (CPU)</span>;
  };

  return (
    <div ref={dropdownRef} style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)', position: 'relative' }}>
      <label style={{ display: 'block', color: '#ececec', fontWeight: 600, fontSize: '15px', marginBottom: '16px' }}>Core Intelligence Explorer (Hugging Face Live Hub)</label>
      
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <input 
          type="text" 
          placeholder="Search models from Hugging Face... (e.g., Llama 3, Qwen, Mistral)" 
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setLlmDropdownOpen(true)}
          style={{ flex: 1, padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.5)', color: 'white', outline: 'none', fontSize: '14px' }}
        />
        <button onClick={() => handleBrowseCustom(false)} style={{ padding: '0 24px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>Browse Disk</button>
      </div>

      {selectedModel && (
        <div style={{ padding: '12px 16px', background: 'rgba(20, 184, 166, 0.05)', border: '1px solid rgba(20, 184, 166, 0.2)', borderRadius: '12px', color: '#14b8a6', fontSize: '13px', fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Loaded Engine: <strong>{selectedModel.name}</strong></span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '11px', background: '#14b8a6', color: '#000', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>ACTIVE</span>
            <button 
              onClick={() => setConfirmEject(true)}
              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              EJECT
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {llmDropdownOpen && (searchQuery || searchResults.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0e0e12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', marginTop: '8px', zIndex: 100, maxHeight: '350px', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            {isSearching && <div style={{ padding: '16px', color: '#888', fontSize: '14px' }}>Querying Hugging Face Repository Hub...</div>}
            {!isSearching && searchResults.length === 0 && <div style={{ padding: '16px', color: '#555', fontSize: '14px' }}>No validated GGUF repositories matches found.</div>}

            {searchResults.map((repo) => (
              <div key={repo.id} onClick={() => handleSelectRepo(repo)} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', background: selectedRepo?.id === repo.id ? 'rgba(255,255,255,0.03)' : 'transparent', transition: 'background 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>{repo.name}</span>
                  <span style={{ fontSize: '12px', color: '#888' }}>⬇ {(repo.downloads / 1000).toFixed(1)}k DLs</span>
                </div>
                <span style={{ fontSize: '12px', color: '#555' }}>Author: {repo.author}</span>

                {selectedRepo?.id === repo.id && (
                  <div style={{ marginTop: '12px', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                    {isLoadingFiles ? (
                      <div style={{ fontSize: '12px', color: '#888', padding: '4px 0' }}>Parsing weight trees...</div>
                    ) : (
                      repoFiles.map(file => {
                        const isDownloaded = localModels.some(m => m.filename === file.filename);
                        return (
                          <div key={file.filename} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '13px', color: '#ddd', fontWeight: 500 }}>{file.filename}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '11px', color: '#666' }}>{file.sizeGB} GB</span>
                                {calculateModelSpeedBadge(file.sizeGB)}
                              </div>
                            </div>
                            
                            {downloadTracker.active && downloadTracker.file === file.filename ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '11px', color: '#14b8a6' }}>{downloadTracker.percent}%</span>
                                <button onClick={handleCancelDownload} style={{ padding: '4px 8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => { handleAction(file, false); setLlmDropdownOpen(false); }} disabled={isBooting} style={{ padding: '6px 14px', background: isDownloaded ? 'rgba(20, 184, 166, 0.1)' : 'rgba(255,255,255,0.05)', border: isDownloaded ? '1px solid #14b8a6' : '1px solid rgba(255,255,255,0.1)', color: isDownloaded ? '#14b8a6' : '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: isBooting ? 'wait' : 'pointer' }}>
                                {isDownloaded ? 'Load Engine' : 'Download & Load'}
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}