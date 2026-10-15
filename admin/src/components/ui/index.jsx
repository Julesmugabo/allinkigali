/**
 * ui/index.jsx — display atoms shared by every dashboard:
 * Panel, KpiGrid/Kpi, Loading, ErrorText, RowActions, Muted, Toast, fmtNum.
 */
import React from 'react';
import { t } from '../../theme';

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

// With ink set (client dashboard) the number stays dark and a bar on the left carries the colour.
export function Kpi({ label, value, color = t.accent, onClick, hint }) {
  const bar = t.inkStatus ? { borderLeft: `4px solid ${color}` } : {};
  return (
    <div onClick={onClick} style={{ ...s.kpi, ...bar, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={s.kpiLabel}>{label}</div>
      <div style={{ ...s.kpiValue, color: t.inkStatus || color }}>{value}</div>
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

/** Bottom-right confirmation. `toast` is { text } or null. */
export function Toast({ toast }) {
  if (!toast) return null;
  return <div style={s.toast}>{toast.text}</div>;
}

export const fmtNum = (n) => Number(n || 0).toLocaleString('en-US');

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
  error: { background: 'rgba(248,113,113,0.12)', color: t.inkStatus || t.danger, borderLeft: t.inkStatus ? `3px solid ${t.danger}` : undefined, padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 },
  toast: {
    position: 'fixed', bottom: 24, right: 24, zIndex: 300,
    background: t.success, color: t.inkStatus || '#052E16', fontWeight: 600, fontSize: 14,
    padding: '12px 18px', borderRadius: 10, boxShadow: t.shadowLg,
  },
};
