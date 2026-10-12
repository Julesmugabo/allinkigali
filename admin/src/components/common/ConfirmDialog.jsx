import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { t } from '../../theme';
import Modal, { ModalActions } from './Modal';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel, danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title || 'Confirm'} width={420}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <AlertTriangle size={20} color={danger ? t.danger : t.warning} style={{ marginTop: 2, flexShrink: 0 }} />
        <p style={{ color: t.textSecondary, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
          {message}
        </p>
      </div>
      <ModalActions>
        <button onClick={onClose} style={{ background: t.bgHover, color: t.text }}>Cancel</button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          style={{ background: danger ? t.danger : t.accent, color: '#fff', fontWeight: 600 }}
        >
          {confirmLabel || 'Confirm'}
        </button>
      </ModalActions>
    </Modal>
  );
}
