/**
 * ui.jsx — finance-specific display atoms (money, dates, status colours).
 * Generic pieces (Panel, Kpi, Loading, ...) live in components/ui and are
 * re-exported here so finance sections keep one import.
 */
import React from 'react';
import { t } from '../../../theme';
import { Badge } from '../../../components/PageShell';
import { FIN, STATUS_COLOR } from '../constants';

export { Panel, KpiGrid, Kpi, Loading, ErrorText, RowActions, Muted } from '../../../components/ui';

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
