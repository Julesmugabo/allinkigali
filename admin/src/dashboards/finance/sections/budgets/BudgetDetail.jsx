/**
 * BudgetDetail.jsx — budget vs actual per account, utilisation, and the
 * approve → activate workflow.
 */
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { DataTable } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { useFinance, useFinanceData } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { FIN } from '../../constants';
import { Panel, Kpi, KpiGrid, Loading, ErrorText, StatusBadge, Money, formatRWF } from '../../components/ui';

export default function BudgetDetail({ id, onBack }) {
  const { changed, notify } = useFinance();
  const [busy, setBusy] = useState(false);
  const { data: b, loading, error } = useFinanceData(() => financeApi.budget(id), [id]);

  const step = async (action) => {
    setBusy(true);
    try {
      if (action === 'approve') await financeApi.approveBudget(id);
      else await financeApi.activateBudget(id);
      notify(action === 'approve' ? 'Budget approved' : 'Budget activated');
      changed();
    } catch (e) { alert(e.message); }
    setBusy(false);
  };

  const back = <Button variant="ghost" icon={ArrowLeft} onClick={onBack}>Back to budgets</Button>;
  if (loading && !b) return <><div style={{ marginBottom: 14 }}>{back}</div><Loading /></>;

  const lines = b?.lines || [];
  const total = lines.reduce((sum, l) => sum + Number(l.approved_amount || 0), 0);
  const actual = lines.reduce((sum, l) => sum + Number(l.actual || 0), 0);
  const pct = total > 0 ? Math.round((actual / total) * 100) : 0;

  const columns = [
    { key: 'account_code', label: 'Code' },
    { key: 'account_name', label: 'Account' },
    { key: 'approved_amount', label: 'Budget', render: (l) => <Money value={l.approved_amount} /> },
    { key: 'actual', label: 'Actual', render: (l) => <Money value={l.actual} /> },
    {
      key: 'variance', label: 'Variance', render: (l) => {
        const v = Number(l.approved_amount) - Number(l.actual);
        return <span style={{ color: v >= 0 ? FIN.income : FIN.expense, fontWeight: 600 }}>{formatRWF(v)}</span>;
      },
    },
    {
      key: 'pct', label: 'Used', render: (l) => {
        const p = Number(l.approved_amount) > 0 ? Math.round((Number(l.actual) / Number(l.approved_amount)) * 100) : 0;
        return <span style={{ color: p > 100 ? FIN.expense : p > 80 ? FIN.warning : FIN.primary, fontWeight: 600 }}>{p}%</span>;
      },
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 14 }}>{back}</div>
      <ErrorText>{error}</ErrorText>
      <KpiGrid>
        <Kpi label="Total budget" value={formatRWF(total)} color={FIN.primary} />
        <Kpi label="Actual spent" value={formatRWF(actual)} color={actual > total ? FIN.expense : FIN.income} />
        <Kpi label="Utilisation" value={`${pct}%`} color={pct > 100 ? FIN.expense : FIN.warning} />
      </KpiGrid>
      <Panel
        title={<>{b?.name} — FY {b?.fiscal_year} <StatusBadge status={b?.status} /></>}
        actions={(
          <>
            {b?.status === 'draft' && <Button variant="success" disabled={busy} onClick={() => step('approve')}>Approve budget</Button>}
            {b?.status === 'approved' && <Button variant="success" disabled={busy} onClick={() => step('activate')}>Activate budget</Button>}
          </>
        )}
      >
        <DataTable columns={columns} rows={lines.map((l, i) => ({ id: i, ...l }))} emptyText="This budget has no lines." />
      </Panel>
    </>
  );
}
