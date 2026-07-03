import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import HuggingFaceHub from './HuggingFaceHub';
import LocalArsenal from './LocalArsenal';
import CloudGateway from './CloudGateway';

export default function SettingsView({ 
  isLocalMode, setIsLocalMode, 
  selectedApi, setSelectedApi, apiKey, setApiKey,
  selectedModel, setSelectedModel,
  selectedVisionModel, setSelectedVisionModel,
  gpuData
}) {
  
  // --- PARENT STATE ---
  const [isBooting, setIsBooting] = useState(false);
  const [bootPercent, setBootPercent] = useState(0);
  const [localModels, setLocalModels] = useState([]);
  const [confirmEject, setConfirmEject] = useState(false);
  const [downloadTracker, setDownloadTracker] = useState({ 
    active: false, file: '', percent: 0, speed: 0, downloadedMB: 0, totalMB: 0 
  });

  // --- IPC LISTENERS & INITIALIZATION ---
  useEffect(() => {
    refreshLocalCache();

    window.dukeAPI.onDownloadProgress((data) => {
      setDownloadTracker({
        active: true, file: data.fileName, percent: data.percent, speed: data.speedMBps,
        downloadedMB: data.downloadedMB, totalMB: data.totalMB
      });
    });

    if (window.dukeAPI.onLoadProgress) {
      window.dukeAPI.onLoadProgress((percent) => {
        setBootPercent(percent);
      });
    }
  }, []);

  const refreshLocalCache = async () => {
    const models = await window.dukeAPI.getLocalModels();
    if (Array.isArray(models)) setLocalModels(models);
  };

  // --- ENGINE LOGIC ---
  const handleAction = async (fileDef, isVision = false) => {
    const isDownloaded = localModels.some(m => m.filename === fileDef.filename);

    if (!isDownloaded) {
      try {
        const dlResponse = await window.dukeAPI.downloadModel({ url: fileDef.url, fileName: fileDef.filename });
        setDownloadTracker({ active: false, file: '', percent: 0, speed: 0 });
        if (!dlResponse.success) throw new Error("Download interrupted");
        
        await refreshLocalCache();
        handleLoadLocal({ filename: fileDef.filename, path: dlResponse.path }, isVision);
      } catch (err) {
        alert("Download Failed: " + err.message);
      }
    } else {
      const cachedModel = localModels.find(m => m.filename === fileDef.filename);
      if (cachedModel) handleLoadLocal(cachedModel, isVision);
    }
  };

  const handleLoadLocal = async (modelItem, isVision = false) => {
    setIsBooting(true);
    setBootPercent(0);

    const bootData = {
      modelPath: isVision ? selectedModel?.path : modelItem.path,
      visionPath: isVision ? modelItem.path : selectedVisionModel?.path
    };

    const loadResponse = await window.dukeAPI.loadModel(bootData);

    if (loadResponse.success) {
      const targetObj = { name: modelItem.filename, path: modelItem.path };
      if (isVision) {
        setSelectedVisionModel(targetObj);
      } else {
        setSelectedModel(targetObj);
      }
    } else {
      alert("Engine Initialization Failed: " + loadResponse.error);
    }
    setIsBooting(false);
  };

  const handleEjectConfirm = async () => {
    await window.dukeAPI.resetEngine(); 
    setSelectedModel(null); 
    setSelectedVisionModel(null);
    setBootPercent(0);
    setConfirmEject(false);
  };

  const handleCancelDownload = async () => {
    if (downloadTracker.file) {
      await window.dukeAPI.cancelDownload(downloadTracker.file);
      setDownloadTracker({ active: false, file: '', percent: 0, speed: 0 });
    }
  };

  const handleBrowseCustom = async (isVision = false) => {
    const filePath = await window.dukeAPI.openFileDialog();
    if (!filePath) return;
    handleLoadLocal({ filename: filePath.split('\\').pop().split('/').pop(), path: filePath }, isVision);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} style={{ flex: 1, background: 'rgba(15, 15, 20, 0.8)', backdropFilter: 'blur(32px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', padding: '40px', color: 'white', overflowY: 'auto', position: 'relative' }}>
      
      {/* --- EJECT MODAL --- */}
      <AnimatePresence>
        {confirmEject && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '24px' }}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} style={{ background: 'rgba(20, 20, 25, 0.95)', border: '1px solid rgba(255,255,255,0.1)', padding: '32px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 24px 48px rgba(0,0,0,0.8)', maxWidth: '400px', textAlign: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#ececec', fontSize: '20px', fontWeight: 600 }}>Eject VRAM Weights?</h3>
                <p style={{ margin: 0, color: '#888', fontSize: '14px', lineHeight: '1.5' }}>Are you sure you want to unload the current model? This will free up system VRAM, but you will need to load a model again to chat.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <motion.button onClick={() => setConfirmEject(false)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#ececec', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: 500 }}>Cancel</motion.button>
                <motion.button onClick={handleEjectConfirm} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>Yes, Eject</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontWeight: 600, color: '#ececec', margin: 0 }}>System Core Settings</h2>
        {gpuData && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '12px', color: '#888' }}>Hardware Matrix:</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#14b8a6' }}>{gpuData.gpuName} ({gpuData.vramGB}GB VRAM)</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
        <button onClick={() => setIsLocalMode(true)} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: isLocalMode ? '1px solid rgba(20, 184, 166, 0.6)' : '1px solid rgba(255,255,255,0.05)', background: isLocalMode ? 'rgba(20, 184, 166, 0.1)' : 'transparent', color: 'white', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>Local Neuromorphic Engine</button>
        <button onClick={() => setIsLocalMode(false)} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: !isLocalMode ? '1px solid rgba(20, 184, 166, 0.6)' : '1px solid rgba(255,255,255,0.05)', background: !isLocalMode ? 'rgba(20, 184, 166, 0.1)' : 'transparent', color: 'white', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>Connect to API Providers</button>
      </div>

      {isLocalMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <AnimatePresence>
            {isBooting && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ background: 'rgba(10,10,12,0.95)', border: '1px solid rgba(20, 184, 166, 0.2)', padding: '24px', borderRadius: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                  <span style={{ fontWeight: 600, color: '#14b8a6' }}>Allocating Weights into System VRAM...</span>
                  <span style={{ fontWeight: 700, color: '#fff' }}>{bootPercent}%</span>
                </div>
                <div style={{ height: '8px', background: '#111', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <motion.div style={{ height: '100%', background: 'linear-gradient(90deg, #14b8a6, #06b6d4)', width: `${bootPercent}%` }} transition={{ ease: "easeOut" }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <HuggingFaceHub 
            gpuData={gpuData} localModels={localModels} downloadTracker={downloadTracker} 
            selectedModel={selectedModel} isBooting={isBooting} 
            handleAction={handleAction} handleCancelDownload={handleCancelDownload} 
            handleBrowseCustom={handleBrowseCustom} setConfirmEject={setConfirmEject} 
          />
          
          <LocalArsenal 
            localModels={localModels} refreshLocalCache={refreshLocalCache} 
            handleLoadLocal={handleLoadLocal} isBooting={isBooting} 
          />
        </div>
      ) : (
        <CloudGateway selectedApi={selectedApi} setSelectedApi={setSelectedApi} apiKey={apiKey} setApiKey={setApiKey} />
      )}
    </motion.div>
  );
}