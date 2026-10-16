/**
 * DayPicker.jsx — choose which day's articles to list: step a day back or
 * forward, jump to any date, or tap one of the recent days that has
 * articles (with how many). "All days" lists everything at once.
 */
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { t } from '../../../../theme';
import { dayLabel, shiftKey, todayKey } from './articleDays';

const MAX_CHIPS = 12;

export default function DayPicker({ day, onChange, counts, total }) {
  const today = todayKey();
  const all = day === 'all';
  const base = all ? today : day;
  const keys = [...new Set([today, shiftKey(today, -1), ...counts.keys()])].sort().reverse().slice(0, MAX_CHIPS);

  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <div style={s.step}>
          <button style={s.arrow} aria-label="Previous day" title="Previous day" onClick={() => onChange(shiftKey(base, -1))}><ChevronLeft size={18} /></button>
          <div style={s.label}>{all ? 'All days' : dayLabel(day, { long: true })}</div>
          <button style={s.arrow} aria-label="Next day" title="Next day" onClick={() => onChange(shiftKey(base, 1))}><ChevronRight size={18} /></button>
        </div>
        <input type="date" aria-label="Pick a day" value={all ? '' : day} onChange={(e) => e.target.value && onChange(e.target.value)} style={s.date} />
      </div>
      <div style={s.chips}>
        {keys.map((k) => <Chip key={k} on={k === day} label={dayLabel(k)} count={counts.get(k) || 0} onClick={() => onChange(k)} />)}
        <Chip on={all} label="All days" count={total} onClick={() => onChange('all')} />
      </div>
    </div>
  );
}

function Chip({ on, label, count, onClick }) {
  return (
    <button onClick={onClick} style={{ ...s.chip, ...(on ? s.chipOn : count ? null : s.chipEmpty) }}>
      {label}
      <span style={{ ...s.count, ...(on ? s.countOn : null) }}>{count}</span>
    </button>
  );
}

const s = {
  wrap: { marginBottom: 18, paddingBottom: 16, borderBottom: `1px solid ${t.border}` },
  head: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 },
  step: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 },
  arrow: { display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', width: 32, height: 32, borderRadius: 8, background: t.bgHover, color: t.text, padding: 0 },
  label: { color: t.text, fontSize: 17, fontWeight: 700, textAlign: 'center', minWidth: 0 },
  date: { marginLeft: 'auto', width: 'auto' },
  chips: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  chip: { display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 999, background: t.bgCard, color: t.text, border: `1px solid ${t.borderLight}`, fontSize: 13, whiteSpace: 'nowrap' },
  chipOn: { background: t.accent, color: t.onAccent, borderColor: t.accent, fontWeight: 600 },
  chipEmpty: { color: t.textMuted },
  count: { fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: t.bgHover, color: t.textSecondary },
  countOn: { background: 'rgba(255,255,255,0.25)', color: t.onAccent },
};
