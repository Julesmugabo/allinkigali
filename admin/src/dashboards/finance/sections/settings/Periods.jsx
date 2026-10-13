/**
 * Periods.jsx — accounting periods. Locking a period stops anyone creating
 * or editing transactions dated inside it; unlocking needs a reason (kept
 * in the audit trail).
 */
import React, { useState } from 'react';
import { DataTable } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { useFinance, useFinanceData } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { Panel, Loading, ErrorText, StatusBadge, fmtDate } from '../../components/ui';

export default function Periods() {
  const { changed, notify } = useFinance();
  const { data, loading, error } = useFinanceData(() => financeApi.periods());
  const [form, setForm] = useState({ name: '', period_start: '', period_end: '' });
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(null);

  const create = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.period_start || !form.period_end) { setFormError('Name, start and end are required.'); return; }
    setFormError('');
    try { await financeApi.createPeriod(form); setForm({ name: '', period_start: '', period_end: '' }); notify('Period added'); changed(); }
    catch (err) { setFormError(err.message); }
  };

  const toggle = async (p) => {
    let reason;
    if (p.status === 'locked') {
      reason = window.prompt(`Unlock ${p.name}? Transactions in it can then be changed again.\nReason (kept in the audit trail):`);
      if (!reason) return;
    } else if (!window.confirm(`Lock ${p.name}? No one will be able to add or change transactions dated in it.`)) {
      return;
    }
    setBusy(p.id);
    try {
      if (p.status === 'locked') await financeApi.unlockPeriod(p.id, reason);
      else await financeApi.lockPeriod(p.id);
      notify(`${p.name} ${p.status === 'locked' ? 'unlocked' : 'locked'}`);
      changed();
    } catch (err) { alert(err.message); }
    setBusy(null);
  };

  return (
    <Panel title="Accounting periods">
      <ErrorText>{error || formError}</ErrorText>
      <form onSubmit={create} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. November 2026" style={{ flex: 2, minWidth: 160 }} />
        <input type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} />
        <input type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} />
        <Button type="submit">Add period</Button>
      </form>
      {loading ? <Loading /> : (
        <DataTable
          columns={[
            { key: 'name', label: 'Period' },
            { key: 'period_start', label: 'From', render: (p) => fmtDate(p.period_start) },
            { key: 'period_end', label: 'To', render: (p) => fmtDate(p.period_end) },
            { key: 'status', label: 'Status', render: (p) => <StatusBadge status={p.status} /> },
            {
              key: 'a', label: '', render: (p) => (
                <Button size="sm" variant={p.status === 'locked' ? 'warning' : 'danger'} disabled={busy === p.id} onClick={() => toggle(p)}>
                  {p.status === 'locked' ? 'Unlock' : 'Lock'}
                </Button>
              ),
            },
          ]}
          rows={data || []}
          emptyText="No periods defined."
        />
      )}
    </Panel>
  );
}
