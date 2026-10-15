/**
 * CloseTable.jsx — "Paid & close table": the total, how the guests paid
 * (cash, MoMo, card), then the table is free again and the takings land in
 * the sales report.
 */
import React, { useState } from 'react';
import { t } from '../../../theme';
import Modal, { ModalActions } from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { rwf } from '../../common/format';
import { liveOrders } from './tableState';

const METHODS = [['cash', 'Cash'], ['momo', 'MoMo'], ['card', 'Card']];

export default function CloseTable({ table, onCancel, onConfirm }) {
  const [method, setMethod] = useState('cash');
  const [busy, setBusy] = useState(false);
  if (!table) return null;
  const s = table.session;
  const orders = liveOrders(s);
  const unserved = orders.filter((o) => o.status !== 'served' && o.status !== 'needs_confirm').length;
  const unconfirmed = orders.filter((o) => o.status === 'needs_confirm').length;
  const confirm = async () => {
    setBusy(true);
    try { await onConfirm(table, method); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onCancel} title={`Close ${table.label}`} width={420}>
      <div style={s2.total}>{rwf(s.total)}</div>
      <div style={s2.sub}>{orders.length} order{orders.length === 1 ? '' : 's'} on this table</div>
      {unserved > 0 && <div style={s2.warn}>{unserved} order{unserved === 1 ? ' is' : 's are'} not marked served yet.</div>}
      {unconfirmed > 0 && <div style={s2.warn}>{unconfirmed} unconfirmed order{unconfirmed === 1 ? '' : 's'} will be dropped (not charged).</div>}
      <div style={s2.label}>Paid with</div>
      <div style={s2.methods}>
        {METHODS.map(([k, label]) => (
          <button key={k} type="button" onClick={() => setMethod(k)} style={{ ...s2.method, ...(method === k ? s2.methodOn : {}) }}>{label}</button>
        ))}
      </div>
      <ModalActions>
        <Button variant="ghost" onClick={onCancel}>Back</Button>
        <Button variant="success" disabled={busy} onClick={confirm}>{busy ? 'Closing…' : 'Paid — close table'}</Button>
      </ModalActions>
    </Modal>
  );
}

const s2 = {
  total: { fontSize: 32, fontWeight: 800, color: t.text },
  sub: { color: t.textSecondary, fontSize: 13, marginBottom: 12 },
  warn: { background: 'rgba(251,191,36,0.12)', color: t.warning, borderRadius: 8, padding: '8px 10px', fontSize: 13, marginBottom: 8 },
  label: { color: t.textSecondary, fontSize: 13, margin: '14px 0 8px' },
  methods: { display: 'flex', gap: 8 },
  method: { flex: 1, background: t.bg, color: t.textSecondary, border: `1px solid ${t.borderLight}`, fontWeight: 700 },
  methodOn: { background: 'rgba(74,222,128,0.15)', color: t.success, borderColor: t.success },
};
