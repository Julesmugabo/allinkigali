import React from 'react';
import { t } from '../theme';

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={styles.header}>
      <div>
        <h1 style={styles.title}>{title}</h1>
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div style={styles.actions}>{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div style={styles.stat}>
      <div style={{ ...styles.statIcon, background: `${color || t.accent}20`, color: color || t.accent }}>
        {Icon && <Icon size={20} />}
      </div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

export function Card({ children, style }) {
  return <div style={{ ...styles.card, ...style }}>{children}</div>;
}

export function DataTable({ columns, rows, onRowClick, emptyText }) {
  if (!rows.length) {
    return (
      <div style={styles.empty}>{emptyText || 'No data yet.'}</div>
    );
  }
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ ...styles.th, ...(col.width ? { width: col.width } : {}) }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id || i}
              onClick={() => onRowClick?.(row)}
              style={{ ...styles.tr, cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((col) => (
                <td key={col.key} style={styles.td}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Badge({ children, color }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 600,
      background: `${color || t.accent}20`,
      color: color || t.accent,
    }}>
      {children}
    </span>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={styles.tabs}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            ...styles.tab,
            ...(active === tab.key ? styles.tabActive : {}),
          }}
        >
          {tab.label}
          {tab.count != null && (
            <span style={styles.tabCount}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

const styles = {
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    flexWrap: 'wrap', gap: 12, marginBottom: 24,
  },
  title: { color: t.text, fontSize: 24, fontWeight: 700, margin: 0 },
  subtitle: { color: t.textSecondary, fontSize: 14, marginTop: 4 },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  stat: {
    background: t.bgCard, borderRadius: t.radiusLg, padding: 20,
    flex: '1 1 200px', minWidth: 160,
  },
  statIcon: {
    width: 40, height: 40, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: { color: t.text, fontSize: 28, fontWeight: 700 },
  statLabel: { color: t.textSecondary, fontSize: 13, marginTop: 4 },
  card: {
    background: t.bgCard, borderRadius: t.radiusLg, padding: 24,
    boxShadow: t.shadow,
  },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left', padding: '12px 16px',
    color: t.textMuted, fontSize: 12, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.05em',
    borderBottom: `1px solid ${t.border}`,
  },
  tr: { transition: 'background 0.1s' },
  td: {
    padding: '12px 16px', fontSize: 14, color: t.text,
    borderBottom: `1px solid ${t.border}`,
  },
  empty: {
    textAlign: 'center', padding: 40, color: t.textMuted, fontSize: 14,
  },
  tabs: {
    display: 'flex', gap: 4, marginBottom: 20,
    borderBottom: `1px solid ${t.border}`, paddingBottom: 0,
    overflowX: 'auto',
  },
  tab: {
    padding: '10px 16px', background: 'transparent', color: t.textSecondary,
    borderBottom: '2px solid transparent', marginBottom: -1,
    whiteSpace: 'nowrap',
  },
  tabActive: { color: t.accent, borderBottomColor: t.accent },
  tabCount: {
    marginLeft: 6, fontSize: 11, padding: '2px 6px',
    borderRadius: 10, background: t.bgHover, color: t.textSecondary,
  },
};
