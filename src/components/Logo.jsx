import React from 'react';
import { motion } from 'framer-motion';
// Import the image directly from the assets folder
import logoImg from '../assets/dv.png'; 

export default function Logo({ size = 42 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }} 
      animate={{ opacity: 1, y: 0 }}
      style={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none'
      }}
    >
      {/* Actual Image Logo with Hover Glow Effect */}
      <motion.img
        src={logoImg}
        alt="Logo"
        whileHover={{ 
          scale: 1.08, 
          filter: 'drop-shadow(0 0 12px rgba(124, 92, 250, 0.8))' 
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        style={{
          width: size,
          height: size,
          objectFit: 'contain', 
          // A subtle default drop shadow so it pops against the dark background
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' 
        }}
      />
    </motion.div>
  );
}