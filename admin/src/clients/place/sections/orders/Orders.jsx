/**
 * Orders.jsx — delivery orders as a board: New → Confirmed → Preparing →
 * Ready → Delivered. Each move notifies the customer.
 */
import React, { useState } from 'react';
import { t } from '../../../../theme';
import Button from '../../../../components/common/Button';
import { Panel } from '../../../../components/ui';
import { useOwner } from '../../OwnerContext';

const STAGES = [
  { key: 'pending', label: 'New', next: 'confirmed', action: 'Accept' },
  { key: 'confirmed', label: 'Confirmed', next: 'preparing', action: 'Start preparing' },
  { key: 'preparing', label: 'Preparing', next: 'ready', action: 'Ready' },
  { key: 'ready', label: 'Ready / on the way', next: 'delivered', action: 'Delivered' },
];

const ago = (d) => { const m = Math.round((Date.now() - new Date(d)) / 60000); return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`; };

function OrderCard({ o, stage, onMove, busy }) {
  return (
    <div style={s.card}>
      <div style={s.head}><b>#{o.code}</b><span style={{ color: t.textMuted, fontSize: 12 }}>{ago(o.createdAt)}</span></div>
      <div style={s.items}>{(o.items || []).map((i, k) => <div key={k}>{i.qty || i.quantity || 1}× {i.name}{i.note ? <span style={{ color: t.warning }}> — “{i.note}”</span> : null}</div>)}</div>
      <div style={s.meta}>{o.customerName || 'Customer'} · <a href={`tel:${o.customerPhone}`}>{o.customerPhone}</a></div>
      <div style={s.meta}>{o.address}</div>
      {o.notes && <div style={{ ...s.meta, color: t.warning }}>Note: {o.notes}</div>}
      <div style={s.total}>{Number(o.total).toLocaleString()} RWF · {String(o.paymentMethod || '').replace(/_/g, ' ')}</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <Button size="sm" variant="success" disabled={busy} onClick={() => onMove(o, stage.next)}>{stage.action}</Button>
        <Button size="sm" variant="danger" disabled={busy} onClick={() => onMove(o, 'cancelled')}>Cancel</Button>
      </div>
    </div>
  );
}

export default function Orders() {
  const { orders, api, changed, notify } = useOwner();
  const [busy, setBusy] = useState(null);
  const [showDone, setShowDone] = useState(false);
  const move = async (o, status) => {
    if (status === 'cancelled' && !window.confirm(`Cancel order #${o.code}? The customer is told it was cancelled.`)) return;
    setBusy(o.id);
    try { await api.setOrderStatus(o.id, status); notify(`Order #${o.code}: ${status} — customer notified`); changed(); }
    catch (e) { alert(e.message); }
    setBusy(null);
  };
  const done = orders.filter((o) => ['delivered', 'cancelled'].includes(o.status));

  return (
    <>
      <div style={s.board}>
        {STAGES.map((st) => {
          const list = orders.filter((o) => o.status === st.key);
          return (
            <div key={st.key} style={s.col}>
              <div style={s.colHead}>{st.label} <span style={s.count}>{list.length}</span></div>
              {list.length ? list.map((o) => <OrderCard key={o.id} o={o} stage={st} onMove={move} busy={busy === o.id} />)
                : <div style={s.empty}>—</div>}
            </div>
          );
        })}
      </div>
      <Panel title={`Finished orders (${done.length})`} actions={<Button size="sm" variant="ghost" onClick={() => setShowDone((v) => !v)}>{showDone ? 'Hide' : 'Show'}</Button>} style={{ marginTop: 20 }}>
        {showDone && done.map((o) => (
          <div key={o.id} style={s.doneRow}>
            <span>#{o.code} · {(o.items || []).length} item(s) · {new Date(o.createdAt).toLocaleString('en-GB')}</span>
            <span style={{ color: o.status === 'delivered' ? t.success : t.danger }}>{o.status} · {Number(o.total).toLocaleString()} RWF</span>
          </div>
        ))}
      </Panel>
    </>
  );
}

const s = {
  board: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14, alignItems: 'start' },
  col: { background: t.bgCard, borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 120 },
  colHead: { color: t.textSecondary, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 },
  count: { background: t.bgHover, color: t.text, borderRadius: 10, padding: '1px 7px', marginLeft: 4 },
  card: { background: t.bg, borderRadius: 10, padding: 12, fontSize: 13, color: t.text },
  head: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  items: { color: t.text, marginBottom: 6, lineHeight: 1.5 },
  meta: { color: t.textSecondary, fontSize: 12 },
  total: { fontWeight: 700, marginTop: 6 },
  empty: { color: t.textMuted, fontSize: 13, textAlign: 'center', padding: 10 },
  doneRow: { display: 'flex', justifyContent: 'space-between', gap: 10, padding: '7px 0', borderBottom: `1px solid ${t.border}`, fontSize: 13, color: t.textSecondary },
};
