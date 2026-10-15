/**
 * Ticket.jsx — one order on the kitchen/bar screen: the table in big
 * letters, how long it has waited, every dish with its quantity and the
 * guest's note, and Preparing / Ready. On the Kitchen or Bar queue a ticket
 * shows only that station's dishes and says what the other station makes.
 */
import React from 'react';
import { t } from '../../../theme';
import { clock, minutesSince } from '../../common/format';

const OTHER = { kitchen: 'bar', bar: 'kitchen' };
const WORD = { kitchen: 'food', bar: 'drinks' };

export default function Ticket({ order, station, now, busy, onPreparing, onReady }) {
  const items = station === 'all' ? order.items : order.items.filter((i) => i.station === station);
  const elsewhere = station === 'all' ? 0 : order.items.filter((i) => i.station === OTHER[station]).reduce((n, i) => n + i.qty, 0);
  const waited = minutesSince(order.placedAt, now);
  const late = waited >= 20 ? t.danger : waited >= 10 ? t.warning : t.textSecondary;
  const started = order.status === 'preparing';
  return (
    <div style={{ ...s.ticket, borderTopColor: started ? '#FB923C' : t.accent }}>
      <div style={s.head}>
        <span style={s.table}>{order.table}</span>
        <span style={{ ...s.time, color: late }}>{clock(order.placedAt)} · {waited} min</span>
      </div>
      <ul style={s.items}>
        {items.map((i) => (
          <li key={i.id} style={s.item}>
            <span style={s.qty}>{i.qty}×</span>
            <span>
              {i.name}
              {station === 'all' && i.station === 'bar' ? <span style={s.bar}> bar</span> : null}
              {i.notes ? <div style={s.note}>“{i.notes}”</div> : null}
            </span>
          </li>
        ))}
      </ul>
      {elsewhere > 0 && (
        <div style={s.elsewhere}>
          + {elsewhere} {WORD[OTHER[station]]} from the {OTHER[station]}
          {order.readyStations.includes(OTHER[station]) ? ' (ready)' : ''}
        </div>
      )}
      <div style={s.actions}>
        {!started && <button type="button" disabled={busy} onClick={() => onPreparing(order)} style={s.prep}>Preparing</button>}
        <button type="button" disabled={busy} onClick={() => onReady(order)} style={s.ready}>Ready</button>
      </div>
    </div>
  );
}

const s = {
  ticket: { background: t.bgCard, borderRadius: 12, borderTop: '5px solid', padding: 14, display: 'flex', flexDirection: 'column', gap: 10, alignSelf: 'start' },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  table: { fontSize: 22, fontWeight: 900, color: t.text },
  time: { fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' },
  items: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 },
  item: { display: 'flex', gap: 10, fontSize: 17, color: t.text, lineHeight: 1.3 },
  qty: { fontWeight: 900, minWidth: 30, color: t.accent },
  bar: { color: '#A78BFA', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginLeft: 4 },
  note: { color: t.warning, fontSize: 14, fontWeight: 600 },
  elsewhere: { color: t.textMuted, fontSize: 13, borderTop: `1px dashed ${t.borderLight}`, paddingTop: 8 },
  actions: { display: 'flex', gap: 8 },
  prep: { flex: 1, background: 'rgba(251,146,60,0.15)', color: '#FB923C', fontWeight: 800, fontSize: 15, padding: '12px 0' },
  ready: { flex: 1, background: t.success, color: '#052E16', fontWeight: 900, fontSize: 15, padding: '12px 0' },
};
