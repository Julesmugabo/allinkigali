/**
 * OrderBlock.jsx — one order inside a table card: when, its status, the
 * dishes with notes, and the waiter's next step:
 *   first order from a new phone → Guest is seated / Nobody there
 *   new                          → Accept
 *   accepted, preparing, ready   → Served
 * The waiter can also cancel an order until it's served (the guest only
 * until the kitchen starts it).
 */
import React from 'react';
import { t } from '../../../theme';
import Button from '../../../components/common/Button';
import { clock, rwf } from '../../common/format';
import { ORDER, partReady } from './tableState';

const STATION_WORD = { bar: 'Drinks', kitchen: 'Food' };

export default function OrderBlock({ order, busy, onAction }) {
  const st = ORDER[order.status] || ORDER.placed;
  const done = ['served', 'cancelled', 'rejected'].includes(order.status);
  const act = (action, confirmText) => () => {
    if (confirmText && !window.confirm(confirmText)) return;
    onAction(order, action);
  };
  return (
    <div style={{ ...s.block, opacity: done ? 0.6 : 1 }}>
      <div style={s.head}>
        <span style={s.status}><span style={{ ...s.dot, background: st.color }} />{st.label}</span>
        <span style={s.when}>{clock(order.placedAt)} · {rwf(order.total)}</span>
      </div>
      {partReady(order) && (
        <div style={s.part}>{order.readyStations.map((x) => STATION_WORD[x] || x).join(' & ')} ready — collect now</div>
      )}
      <ul style={s.items}>
        {order.items.map((i) => (
          <li key={i.id} style={s.item}>
            <b>{i.qty}×</b> {i.name}
            {i.notes ? <div style={s.note}>“{i.notes}”</div> : null}
          </li>
        ))}
      </ul>
      {!done && (
        <div style={s.actions}>
          {order.status === 'needs_confirm' && <>
            <div style={s.hint}>First order from a new phone. Is someone really seated here?</div>
            <Button size="sm" variant="success" disabled={busy} onClick={act('confirm')}>Guest is seated</Button>
            <Button size="sm" variant="danger" disabled={busy} onClick={act('reject', 'Nobody at this table? The order is dropped and this phone can\'t order here again.')}>Nobody there</Button>
          </>}
          {order.status === 'placed' && <Button size="sm" variant="primary" disabled={busy} onClick={act('accept')}>Accept</Button>}
          {['accepted', 'preparing', 'ready'].includes(order.status) && (
            <Button size="sm" variant={order.status === 'ready' ? 'success' : 'ghost'} disabled={busy} onClick={act('served')}>Served</Button>
          )}
          {order.status !== 'needs_confirm' && (
            <Button size="sm" variant="ghost" disabled={busy} onClick={act('cancel', 'Cancel this order? The guest will see it was cancelled.')} style={{ color: t.textMuted }}>Cancel</Button>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  block: { borderTop: `1px solid ${t.borderLight}`, padding: '10px 0' },
  head: { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' },
  status: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: t.text },
  dot: { width: 8, height: 8, borderRadius: 4, flex: 'none' },
  when: { color: t.textMuted, fontSize: 12, whiteSpace: 'nowrap' },
  part: { marginTop: 6, background: 'rgba(55,138,221,0.22)', color: t.text, fontSize: 12.5, fontWeight: 700, borderRadius: 6, padding: '4px 8px' },
  items: { listStyle: 'none', margin: '6px 0 0', display: 'flex', flexDirection: 'column', gap: 3 },
  item: { fontSize: 14, color: t.text },
  note: { color: t.text, fontSize: 12.5, marginLeft: 22, background: 'rgba(245,197,24,0.22)', borderRadius: 4, padding: '1px 6px', display: 'inline-block' },
  actions: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, alignItems: 'center' },
  hint: { width: '100%', color: t.textSecondary, fontSize: 12 },
};
