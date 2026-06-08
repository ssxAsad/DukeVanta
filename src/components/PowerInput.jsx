import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FLAME_COLORS = ['#FF3800', '#FF5300', '#FF7300', '#FF9600', '#FFB600', '#FFFFFF'];
const MAX_PARTICLES = 70; // Slightly raised cap to handle typing + deleting combos

export default function PowerInput({ value, onChange, onSubmit }) {
  const [particles, setParticles] = useState([]);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [shockwave, setShockwave] = useState(false);
  
  const measureRef = useRef(null);
  const inputRef = useRef(null);
  
  const lastExplosionTime = useRef(0);
  const shockwaveTimeout = useRef(null);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    
    // DETECT TYPING: If the text gets longer, spawn ignition sparks
    if (newValue.length > value.length && inputRef.current && measureRef.current) {
      const cursorPosition = inputRef.current.selectionStart;
      measureRef.current.textContent = newValue.substring(0, cursorPosition);
      const xPosition = measureRef.current.offsetWidth - scrollLeft;
      
      spawnIgnition(xPosition);
    }
    
    onChange(newValue);
  };

  const handleKeyDown = (e) => {
    // DETECT DELETION: Heavy explosion and shockwave
    if (e.key === 'Backspace' && value.length > 0 && inputRef.current) {
      const now = Date.now();
      
      if (now - lastExplosionTime.current > 50) {
        const cursorPosition = inputRef.current.selectionStart;
        
        if (cursorPosition > 0) {
          const textToMeasure = value.substring(0, cursorPosition);
          if (measureRef.current) {
            measureRef.current.textContent = textToMeasure;
            const xPosition = measureRef.current.offsetWidth - scrollLeft;
            
            spawnExplosion(xPosition);
            lastExplosionTime.current = now;

            setShockwave(true);
            if (shockwaveTimeout.current) clearTimeout(shockwaveTimeout.current);
            shockwaveTimeout.current = setTimeout(() => setShockwave(false), 120);
          }
        }
      }
    }
  };

  const handleScroll = (e) => setScrollLeft(e.target.scrollLeft);

  // IGNITION: Small upward sparks for typing a new letter
  const spawnIgnition = (xPosition) => {
    const charCenter = xPosition - 4; 
    const particleCount = 4; // Low density for performance while fast-typing
    
    const newParticles = Array.from({ length: particleCount }).map(() => {
      // Force angles to point strictly upwards (between PI and 2PI)
      const angle = Math.PI + (Math.random() * Math.PI); 
      const velocity = Math.random() * 25 + 5; 

      return {
        id: Math.random().toString(36).substr(2, 9),
        startX: charCenter,
        endX: charCenter + Math.cos(angle) * velocity,
        endY: Math.sin(angle) * velocity, 
        color: FLAME_COLORS[Math.floor(Math.random() * FLAME_COLORS.length)],
        length: Math.random() * 6 + 2, 
        thickness: Math.random() * 1.5 + 0.5, 
        rotation: angle * (180 / Math.PI), 
      };
    });

    commitParticles(newParticles, 300); // Shorter lifespan for typing sparks
  };

  // EXPLOSION: Massive omnidirectional blast for deleting a letter
  const spawnExplosion = (xPosition) => {
    const charCenter = xPosition - 4; 
    const particleCount = particles.length > 30 ? 8 : 16; 
    
    const newParticles = Array.from({ length: particleCount }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 50 + 20; 
      const isUpward = Math.sin(angle) < 0; 

      return {
        id: Math.random().toString(36).substr(2, 9),
        startX: charCenter,
        endX: charCenter + Math.cos(angle) * velocity,
        endY: (Math.sin(angle) * velocity) - (isUpward ? 12 : 0), 
        color: FLAME_COLORS[Math.floor(Math.random() * FLAME_COLORS.length)],
        length: Math.random() * 12 + 4, 
        thickness: Math.random() * 1.5 + 0.5, 
        rotation: angle * (180 / Math.PI), 
      };
    });

    commitParticles(newParticles, 400);
  };

  // Shared function to inject particles into the DOM safely
  const commitParticles = (newParticles, lifespan) => {
    setParticles(prev => {
      const updatedParticles = [...prev, ...newParticles];
      return updatedParticles.slice(-MAX_PARTICLES);
    });

    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, lifespan); 
  };

  return (
    <motion.div 
      animate={shockwave ? { x: [-3, 3, -1, 1, 0], y: [-1, 2, -1, 1, 0] } : { x: 0, y: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}
    >
      {/* 1. HIDDEN MEASUREMENT NODE (Strict font-sync prevents cursor desync) */}
      <span 
        ref={measureRef} 
        style={{ 
          position: 'absolute', opacity: 0, pointerEvents: 'none', whiteSpace: 'pre', 
          fontFamily: 'inherit', fontSize: '15px', fontWeight: 500, letterSpacing: 'normal' 
        }}
      />

      {/* 2. CUSTOM PLACEHOLDER */}
      {!value && (
        <div style={{ position: 'absolute', left: 0, pointerEvents: 'none', color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 500 }}>
          Ask DukeVanta to execute a task...
        </div>
      )}

      {/* 3. GHOST TEXT MASK (Fire Appearance Engine) */}
      <div style={{ position: 'absolute', left: 0, right: 0, height: '100%', overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ 
          position: 'absolute', left: 0, top: '50%', display: 'flex', alignItems: 'center', 
          color: 'transparent', whiteSpace: 'pre', fontFamily: 'inherit', fontSize: '15px', fontWeight: 500, letterSpacing: 'normal',
          transform: `translate(-${scrollLeft}px, -50%)` 
        }}>
          {value.split('').map((char, i) => (
            <span key={`${i}-${char}`} className="fire-letter">
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </div>
      </div>

      {/* 4. ACTUAL INPUT (Z-Index bumped to force cursor to top layer) */}
      <input 
        ref={inputRef}
        type="text" 
        value={value} 
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        spellCheck="false"
        style={{ 
          flex: 1, border: 'none', background: 'transparent', 
          color: 'transparent', caretColor: 'var(--text-primary)', 
          fontFamily: 'inherit', fontSize: '15px', fontWeight: 500, letterSpacing: 'normal', 
          outline: 'none', width: '100%',
          position: 'relative', zIndex: 20 
        }}
      />

      {/* 5. KINETIC SPARK CANVAS */}
      <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: 0, pointerEvents: 'none', zIndex: 100, overflow: 'visible' }}>
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: p.startX, y: 0, scaleX: 0.5, opacity: 1, rotate: p.rotation }}
              animate={{ x: p.endX, y: p.endY, scaleX: [1, 1.5, 0], opacity: [1, 0.8, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 + Math.random() * 0.2, ease: "easeOut" }}
              style={{ 
                position: 'absolute', width: p.length, height: p.thickness, 
                backgroundColor: p.color, borderRadius: '100px',
                boxShadow: `0 0 8px ${p.color}, 0 0 16px ${p.color}`, 
                transformOrigin: 'center center', mixBlendMode: 'screen' 
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}