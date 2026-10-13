/**
 * BarList.jsx — labelled horizontal bars (value relative to the largest).
 */
import React from 'react';
import { t } from '../../../theme';
import { fmtNum } from '../../../components/ui';

export default function BarList({ rows, color = t.accent, empty = 'No data yet.' }) {
  if (!rows.length) return <div style={{ color: t.textMuted, fontSize: 13, padding: '12px 0' }}>{empty}</div>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map((r) => (
        <div key={r.key} style={s.row}>
          <span style={s.label} title={r.label}>{r.label}</span>
          <div style={s.track}><div style={{ ...s.fill, width: `${(r.value / max) * 100}%`, background: color }} /></div>
          <span style={s.value}>{fmtNum(r.value)}</span>
        </div>
      ))}
    </div>
  );
}

const s = {
  row: { display: 'grid', gridTemplateColumns: 'minmax(100px, 220px) 1fr 70px', gap: 10, alignItems: 'center' },
  label: { color: t.textSecondary, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  track: { height: 10, background: t.bg, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  value: { color: t.text, fontWeight: 600, fontSize: 13, textAlign: 'right' },
};
