/**
 * ShiftBar.jsx — the strip on top of a service screen: whether it's live,
 * the screen's filters (children), and "Start shift" — one tap that turns
 * the sound on and keeps the screen awake. On a phone the filters become one
 * row you can swipe, under "Live" and "Start shift".
 */
import React, { useState } from 'react';
import { Play, Volume2 } from 'lucide-react';
import { t } from '../../../theme';
import useNarrow from '../../common/useNarrow';
import { startShift, shiftStarted } from './shift';

export default function ShiftBar({ live, children }) {
  const narrow = useNarrow();
  const [on, setOn] = useState(shiftStarted());
  const start = async () => { await startShift(); setOn(shiftStarted()); };
  return (
    <div style={s.bar}>
      <span style={s.live}>
        <span style={{ ...s.dot, background: live ? t.success : t.warning }} />
        {live ? 'Live' : 'Reconnecting…'}
      </span>
      <div style={{ ...s.filters, ...(narrow ? s.filtersNarrow : {}) }}>{children}</div>
      <span style={{ order: narrow ? 1 : 2, marginLeft: 'auto' }}>
        {on
          ? <span style={s.on}><Volume2 size={15} color={t.lime} /> Sound on</span>
          : <button type="button" onClick={start} style={s.start}><Play size={15} /> Start shift</button>}
      </span>
    </div>
  );
}

// A filter chip for the bar: <Chip on={…} onClick={…}>Needs you · 3</Chip>
export function Chip({ on, onClick, children, color = t.accent }) {
  return (
    <button type="button" onClick={onClick} style={{ ...s.chip, ...(on ? { background: `${color}2E`, color: t.text, borderColor: color } : {}) }}>
      {children}
    </button>
  );
}

const s = {
  bar: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: t.bgCard, borderRadius: t.radiusLg, padding: '10px 14px', marginBottom: 16 },
  live: { display: 'inline-flex', alignItems: 'center', gap: 7, color: t.textSecondary, fontSize: 13, fontWeight: 600, order: 0 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  filters: { display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1, order: 1 },
  filtersNarrow: { flexWrap: 'nowrap', overflowX: 'auto', flexBasis: '100%', order: 2, paddingBottom: 2 },
  on: { display: 'inline-flex', alignItems: 'center', gap: 6, color: t.text, fontSize: 13, fontWeight: 600 },
  start: { display: 'inline-flex', alignItems: 'center', gap: 6, background: t.lime, color: t.onAccent, fontWeight: 800, padding: '8px 16px' },
  chip: { flex: 'none', whiteSpace: 'nowrap', background: 'transparent', color: t.textSecondary, border: `1px solid ${t.borderLight}`, borderRadius: 20, padding: '5px 12px', fontSize: 13, fontWeight: 600 },
};
