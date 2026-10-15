/**
 * PeriodPicker.jsx — This Month / Last Month / Quarter / Year / Custom.
 * Writes straight into FinanceContext, so every section follows it.
 */
import React from 'react';
import { t } from '../../../theme';
import { useFinance } from '../FinanceContext';
import { PERIOD_OPTIONS } from '../constants';

export default function PeriodPicker() {
  const { period, setPeriod, customFrom, setCustomFrom, customTo, setCustomTo, range } = useFinance();
  return (
    <div style={s.wrap}>
      <div style={s.chips}>
        {PERIOD_OPTIONS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            style={{ ...s.chip, ...(period === p.key ? s.chipActive : {}) }}
          >
            {p.label}
          </button>
        ))}
      </div>
      {period === 'custom' ? (
        <div style={s.custom}>
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
          <span style={{ color: t.textMuted }}>→</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
        </div>
      ) : (
        <span style={s.range}>{range.from} → {range.to}</span>
      )}
    </div>
  );
}

const s = {
  wrap: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 },
  chips: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  chip: { padding: '6px 12px', borderRadius: 20, fontSize: 13, background: t.bgCard, color: t.textSecondary },
  chipActive: { background: t.bgActive, color: t.inkAccent },
  custom: { display: 'flex', alignItems: 'center', gap: 8 },
  range: { color: t.textMuted, fontSize: 12 },
};
