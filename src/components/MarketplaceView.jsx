import React from 'react';
import { motion } from 'framer-motion';

export default function MarketplaceView() {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} style={{ flex: 1, background: 'var(--surface-main)', borderRadius: '24px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', padding: '40px', textAlign: 'center' }}>
      
      <div style={{ padding: '24px 48px', background: 'rgba(124, 58, 237, 0.1)', border: '1px dashed var(--primary-accent)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: 'var(--primary-accent)' }}>DukeVanta Marketplace</h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '400px' }}>Discover new agents, tools, and models curated by the community.</p>
        <div style={{ marginTop: '12px', padding: '8px 24px', background: 'var(--primary-accent)', borderRadius: '100px', fontWeight: 600, letterSpacing: '1px', fontSize: '14px' }}>
          OPENS SOON
        </div>
      </div>

    </motion.div>
  );
}
