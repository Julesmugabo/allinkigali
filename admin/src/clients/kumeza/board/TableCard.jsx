/**
 * TableCard.jsx — one table on the waiter board, coloured by its state:
 * the guests' calls (call a waiter, the bill), every order of the running
 * tab with the next step, the total, and "Paid & close table".
 */
import React from 'react';
import { BellRing, Receipt } from 'lucide-react';
import { t } from '../../../theme';
import Button from '../../../components/common/Button';
import { ago, rwf } from '../../common/format';
import { STATE, tableState } from './tableState';
import OrderBlock from './OrderBlock';

const REQUEST = { call_waiter: { icon: BellRing, text: 'Calling a waiter' }, bill: { icon: Receipt, text: 'Asks for the bill' } };

export default function TableCard({ table, now, busy, onOrder, onRequest, onClose }) {
  const state = STATE[tableState(table)];
  const s = table.session;
  const toConfirm = (s?.orders || []).filter((o) => o.status === 'needs_confirm').reduce((n, o) => n + o.total, 0);
  return (
    <div style={{ ...st.card, borderColor: state.urgent ? state.color : t.borderLight, boxShadow: state.urgent ? `0 0 0 1px ${state.color}55, 0 0 18px ${state.color}22` : 'none' }}>
      <div style={st.head}>
        <div>
          <div style={st.label}>{table.label}</div>
          {table.section ? <div style={st.section}>{table.section}</div> : null}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ ...st.state, background: `${state.color}33` }}><span style={{ ...st.dot, background: state.color }} />{state.label}</div>
          {s ? <div style={st.since}>seated {ago(s.openedAt, now)}</div> : null}
        </div>
      </div>

      {s?.requests.map((r) => {
        const R = REQUEST[r.type];
        return (
          <div key={r.id} style={st.request}>
            <R.icon size={16} color={t.danger} />
            <span style={{ flex: 1 }}>{R.text} · {ago(r.at, now)}</span>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => onRequest(r)}>On my way</Button>
          </div>
        );
      })}

      {s?.orders.map((o) => <OrderBlock key={o.id} order={o} busy={busy} onAction={onOrder} />)}

      {s && (
        <div style={st.foot}>
          <div>
            <div style={st.totalLabel}>Table total</div>
            <div style={st.total}>{rwf(s.total)}</div>
            {toConfirm > 0 && <div style={st.toConfirm}>+ {rwf(toConfirm)} once you confirm</div>}
          </div>
          <Button variant={s.billRequested ? 'success' : 'ghost'} disabled={busy} onClick={() => onClose(table)} style={{ padding: '9px 14px' }}>Paid &amp; close</Button>
        </div>
      )}
    </div>
  );
}

const st = {
  card: { background: t.bgCard, border: '2px solid', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 6, alignSelf: 'start' },
  head: { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' },
  label: { fontSize: 19, fontWeight: 800, color: t.text },
  section: { color: t.textMuted, fontSize: 12, marginTop: 2 },
  state: { display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 800, color: t.text },
  dot: { width: 8, height: 8, borderRadius: 4 },
  since: { color: t.textMuted, fontSize: 11.5, marginTop: 4 },
  request: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(229,72,77,0.10)', color: t.text, borderRadius: 8, padding: '6px 8px', fontSize: 13.5, fontWeight: 700 },
  foot: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, borderTop: `1px solid ${t.borderLight}`, paddingTop: 10, marginTop: 2 },
  totalLabel: { color: t.textMuted, fontSize: 11.5 },
  total: { fontSize: 16, fontWeight: 800, color: t.text },
  toConfirm: { color: t.textSecondary, fontSize: 11.5, marginTop: 2 },
};
