/**
 * Invoices.jsx — receivables (customers owe us) and payables (we owe
 * suppliers): list, create, and record payments against what's outstanding.
 */
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { DataTable, Tabs } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { useFinanceData } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { FIN } from '../../constants';
import { Panel, Loading, ErrorText, StatusBadge, Money, fmtDate } from '../../components/ui';
import InvoiceModal from './InvoiceModal';
import PaymentModal from './PaymentModal';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'receivable', label: 'Receivable' },
  { key: 'payable', label: 'Payable' },
];

export default function Invoices() {
  const [tab, setTab] = useState('all');
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(null);
  const { data, loading, error } = useFinanceData(
    () => financeApi.invoices(tab === 'all' ? {} : { type: tab }),
    [tab]
  );

  const columns = [
    { key: 'invoice_number', label: 'Invoice #', render: (r) => <span style={{ color: '#91D51F' }}>{r.invoice_number}</span> },
    { key: 'invoice_type', label: 'Type' },
    { key: 'contact_name', label: 'Contact', render: (r) => r.contact_name || '—' },
    { key: 'due_date', label: 'Due', render: (r) => fmtDate(r.due_date) },
    { key: 'total_amount', label: 'Total', render: (r) => <Money value={r.total_amount} /> },
    {
      key: 'outstanding', label: 'Outstanding', render: (r) => (
        <span style={{ color: Number(r.outstanding) > 0 ? FIN.warning : FIN.income, fontWeight: 600 }}>
          <Money value={r.outstanding} />
        </span>
      ),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', label: '', render: (r) => (Number(r.outstanding) > 0 && r.status !== 'voided'
        ? <Button size="sm" variant="success" onClick={() => setPaying(r)}>Record payment</Button>
        : null),
    },
  ];

  return (
    <Panel title="Invoices" actions={<Button icon={Plus} onClick={() => setCreating(true)}>New invoice</Button>}>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <ErrorText>{error}</ErrorText>
      {loading ? <Loading /> : <DataTable columns={columns} rows={data || []} emptyText="No invoices yet." />}
      {creating && <InvoiceModal onClose={() => setCreating(false)} />}
      {paying && <PaymentModal invoice={paying} onClose={() => setPaying(null)} />}
    </Panel>
  );
}
