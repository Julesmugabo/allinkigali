/**
 * BankAccounts.jsx — bank, mobile-money and cash accounts with balances.
 */
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { DataTable } from '../../../../components/PageShell';
import Modal, { ModalActions } from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField } from '../../../../components/form/Fields';
import { useFinance } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { Panel, ErrorText, Money } from '../../components/ui';

const KINDS = [
  { value: 'bank', label: 'Bank' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'cash', label: 'Cash' },
];

function BankModal({ onClose }) {
  const { changed, notify } = useFinance();
  const [form, setForm] = useState({ name: '', account_type: 'bank', bank_name: '', account_number: '', currency: 'RWF' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try { await financeApi.createBankAccount(form); notify('Account added'); changed(); onClose(); }
    catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title="New Bank / Cash Account" width={520}>
      <ErrorText>{error}</ErrorText>
      <FormGrid>
        <Field label="Name *" value={form.name} onChange={set('name')} placeholder="e.g. BK Operations" full />
        <SelectField label="Kind" value={form.account_type} onChange={set('account_type')} options={KINDS} />
        <Field label="Currency" value={form.currency} onChange={set('currency')} />
        <Field label="Bank / provider" value={form.bank_name} onChange={set('bank_name')} />
        <Field label="Account number" value={form.account_number} onChange={set('account_number')} />
      </FormGrid>
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Add account'}</Button>
      </ModalActions>
    </Modal>
  );
}

export default function BankAccounts() {
  const { bankAccounts } = useFinance();
  const [adding, setAdding] = useState(false);
  return (
    <Panel title="Bank & cash accounts" actions={<Button icon={Plus} onClick={() => setAdding(true)}>New account</Button>}>
      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'account_type', label: 'Kind', render: (b) => String(b.account_type || '').replace(/_/g, ' ') },
          { key: 'bank_name', label: 'Provider', render: (b) => b.bank_name || '—' },
          { key: 'account_number', label: 'Number', render: (b) => b.account_number || '—' },
          { key: 'current_balance', label: 'Balance', render: (b) => <Money value={b.current_balance} /> },
        ]}
        rows={bankAccounts}
        emptyText="No bank or cash accounts yet."
      />
      {adding && <BankModal onClose={() => setAdding(false)} />}
    </Panel>
  );
}
