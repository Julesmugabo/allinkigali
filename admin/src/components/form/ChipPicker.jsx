/**
 * ChipPicker.jsx — pick several values from a fixed list as toggle chips.
 *   options: ['wifi', ...] or [{ value, label }]
 */
import React from 'react';
import { t } from '../../theme';

export default function ChipPicker({ label, options, value = [], onChange, full = true }) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...(full ? { gridColumn: '1 / -1' } : {}) }}>
      {label && <span style={s.label}>{label}</span>}
      <div style={s.row}>
        {opts.map((o) => {
          const on = value.includes(o.value);
          return (
            <button key={o.value} type="button" onClick={() => toggle(o.value)} style={{ ...s.chip, ...(on ? s.on : {}) }}>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  label: { color: t.textSecondary, fontSize: 13, fontWeight: 500 },
  row: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  chip: { padding: '5px 11px', borderRadius: 20, fontSize: 12, background: 'transparent', color: t.textSecondary, border: `1px solid ${t.borderLight}` },
  on: { background: t.accent, color: t.bg, borderColor: t.accent, fontWeight: 600 },
};
