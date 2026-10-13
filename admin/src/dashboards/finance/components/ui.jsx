/**
 * ui.jsx — small display atoms used across finance sections:
 * Money, StatusBadge, Panel, Kpi/KpiGrid, Loading, ErrorText, RowActions.
 */
import React from 'react';
import { t } from '../../../theme';
import { Badge } from '../../../components/PageShell';
import { FIN, STATUS_COLOR } from '../constants';

export function formatRWF(n) {
  const v = Number(n);
  if (n == null || Number.isNaN(v)) return 'RWF 0';
  return `${v < 0 ? '-' : ''}RWF ${Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function Money({ value, type, sign, bold }) {
  const color = type === 'income' ? FIN.income : type === 'expense' ? FIN.expense : t.text;
  const prefix = sign ? (type === 'income' ? '+' : type === 'expense' ? '-' : '') : '';
  return <span style={{ color, fontWeight: bold ? 700 : 600, whiteSpace: 'nowrap' }}>{prefix}{formatRWF(value)}</span>;
}

export function StatusBadge({ status }) {
  if (!status) return null;
  return <Badge color={STATUS_COLOR[status] || t.textSecondary}>{String(status).replace(/_/g, ' ')}</Badge>;
}

export function Panel({ title, actions, children, style }) {
  return (
    <div style={{ ...s.panel, ...style }}>
      {(title || actions) && (
        <div style={s.panelHead}>
          {title && <h3 style={s.panelTitle}>{title}</h3>}
          {actions && <div style={s.actions}>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function KpiGrid({ children }) {
  return <div style={s.kpiGrid}>{children}</div>;
}

export function Kpi({ label, value, color = FIN.primary, onClick, hint }) {
  return (
    <div onClick={onClick} style={{ ...s.kpi, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={s.kpiLabel}>{label}</div>
      <div style={{ ...s.kpiValue, color }}>{value}</div>
      {hint && <div style={s.kpiHint}>{hint}</div>}
    </div>
  );
}

export function Loading({ text = 'Loading...' }) {
  return <div style={s.muted}>{text}</div>;
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <div style={s.error}>{children}</div>;
}

export function RowActions({ children }) {
  return <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{children}</div>;
}

export function Muted({ children }) {
  return <span style={{ color: t.textMuted, fontSize: 12 }}>{children}</span>;
}

const s = {
  panel: { background: t.bgCard, borderRadius: t.radiusLg, padding: 20, marginBottom: 20 },
  panelHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 },
  panelTitle: { color: t.text, fontSize: 16, fontWeight: 600, margin: 0 },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14, marginBottom: 20 },
  kpi: { background: t.bgCard, borderRadius: t.radiusLg, padding: 18 },
  kpiLabel: { color: t.textSecondary, fontSize: 13, marginBottom: 8 },
  kpiValue: { fontSize: 20, fontWeight: 700 },
  kpiHint: { color: t.textMuted, fontSize: 12, marginTop: 4 },
  muted: { color: t.textMuted, fontSize: 14, padding: '24px 0', textAlign: 'center' },
  error: { background: 'rgba(248,113,113,0.12)', color: t.danger, padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 },
};
