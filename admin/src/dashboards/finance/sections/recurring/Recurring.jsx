/**
 * Recurring.jsx — templates for repeating income/expenses (rent, salaries,
 * subscriptions). "Run now" creates the next transaction from a template.
 */
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { DataTable } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { useFinance, useFinanceData } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { Panel, Loading, ErrorText, Money, RowActions, fmtDate } from '../../components/ui';
import RecurringModal from './RecurringModal';

export default function Recurring() {
  const { changed, notify } = useFinance();
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(null);
  const { data, loading, error } = useFinanceData(() => financeApi.recurring());

  const run = async (r) => {
    setBusy(r.id);
    try {
      const txn = await financeApi.runRecurring(r.id);
      notify(`Created ${txn?.txn_ref || 'transaction'} from "${r.description}"`);
      changed();
    } catch (e) { alert(e.message); }
    setBusy(null);
  };

  const stop = async (r) => {
    if (!window.confirm(`Stop the recurring "${r.description}"? Past transactions are kept.`)) return;
    setBusy(r.id);
    try { await financeApi.deleteRecurring(r.id); notify('Recurring template stopped'); changed(); }
    catch (e) { alert(e.message); }
    setBusy(null);
  };

  const columns = [
    { key: 'description', label: 'Description', render: (r) => <span style={{ fontWeight: 500 }}>{r.description}</span> },
    { key: 'txn_type', label: 'Type' },
    { key: 'frequency', label: 'Every' },
    { key: 'next_run_date', label: 'Next run', render: (r) => fmtDate(r.next_run_date) },
    { key: 'category_name', label: 'Account', render: (r) => r.category_name || '—' },
    { key: 'amount', label: 'Amount', render: (r) => <Money value={r.amount} type={r.txn_type} /> },
    {
      key: 'actions', label: '', render: (r) => (
        <RowActions>
          <Button size="sm" variant="success" disabled={busy === r.id} onClick={() => run(r)}>Run now</Button>
          <Button size="sm" variant="danger" disabled={busy === r.id} onClick={() => stop(r)}>Stop</Button>
        </RowActions>
      ),
    },
  ];

  return (
    <Panel title="Recurring transactions" actions={<Button icon={Plus} onClick={() => setCreating(true)}>New template</Button>}>
      <ErrorText>{error}</ErrorText>
      {loading ? <Loading /> : <DataTable columns={columns} rows={data || []} emptyText="No recurring templates yet." />}
      {creating && <RecurringModal onClose={() => setCreating(false)} />}
    </Panel>
  );
}
