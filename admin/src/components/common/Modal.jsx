import React from 'react';
import { X } from 'lucide-react';
import { t } from '../../theme';

export default function Modal({ open, onClose, title, width, children }) {
  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: width || 640 }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>{title}</h2>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ModalActions({ children }) {
  return <div style={styles.actions}>{children}</div>;
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(4,44,83,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, padding: 16,
  },
  modal: {
    background: t.bgCard, borderRadius: t.radiusLg, padding: 28,
    width: '100%', maxHeight: '90vh', overflowY: 'auto',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  title: { color: t.text, fontSize: 20, fontWeight: 700, margin: 0 },
  closeBtn: {
    background: 'transparent', color: t.textMuted, padding: 4,
    display: 'flex', alignItems: 'center',
  },
  actions: {
    display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20,
  },
};
