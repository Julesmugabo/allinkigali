/**
 * Budgets.jsx — list of budgets; opening one shows budget vs actual.
 */
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { DataTable } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { useFinance, useFinanceData } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { Panel, Loading, ErrorText, StatusBadge } from '../../components/ui';
import BudgetDetail from './BudgetDetail';
import BudgetModal from './BudgetModal';

export default function Budgets() {
  const { departments } = useFinance();
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);
  const { data, loading, error } = useFinanceData(() => financeApi.budgets());

  if (openId) return <BudgetDetail id={openId} onBack={() => setOpenId(null)} />;

  const deptName = (id) => departments.find((d) => String(d.id) === String(id))?.name || 'All departments';
  const columns = [
    { key: 'name', label: 'Budget', render: (r) => <span style={{ fontWeight: 500 }}>{r.name}</span> },
    { key: 'fiscal_year', label: 'Fiscal year' },
    { key: 'department_id', label: 'Department', render: (r) => deptName(r.department_id) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'open', label: '', render: (r) => <Button size="sm" variant="info" onClick={() => setOpenId(r.id)}>Budget vs actual</Button> },
  ];

  return (
    <Panel title="Budgets" actions={<Button icon={Plus} onClick={() => setCreating(true)}>New budget</Button>}>
      <ErrorText>{error}</ErrorText>
      {loading ? <Loading /> : <DataTable columns={columns} rows={data || []} emptyText="No budgets yet." />}
      {creating && <BudgetModal onClose={() => setCreating(false)} />}
    </Panel>
  );
}
