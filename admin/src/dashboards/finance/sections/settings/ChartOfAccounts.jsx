/**
 * ChartOfAccounts.jsx — list accounts by type, add new ones, rename or
 * deactivate existing ones (the code and type can't change once used).
 */
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { DataTable, Tabs } from '../../../../components/PageShell';
import Modal, { ModalActions } from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField, TextAreaField, CheckboxField } from '../../../../components/form/Fields';
import { useFinance } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { ACCOUNT_TYPES } from '../../constants';
import { Panel, ErrorText, StatusBadge } from '../../components/ui';

function AccountModal({ account, onClose }) {
  const { changed, notify } = useFinance();
  const [form, setForm] = useState({
    code: account?.code || '', name: account?.name || '', account_type: account?.account_type || 'expense',
    description: account?.description || '', is_active: account ? account.is_active !== false : true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.code.trim() || !form.name.trim()) { setError('Code and name are required.'); return; }
    setSaving(true); setError('');
    try {
      if (account) await financeApi.updateAccount(account.id, { name: form.name, description: form.description, is_active: form.is_active });
      else await financeApi.createAccount({ code: form.code, name: form.name, account_type: form.account_type, description: form.description });
      notify(account ? 'Account updated' : 'Account created');
      changed();
      onClose();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title={account ? `Edit ${account.code}` : 'New Account'} width={520}>
      <ErrorText>{error}</ErrorText>
      <FormGrid>
        <Field label="Code *" value={form.code} onChange={set('code')} disabled={!!account} placeholder="e.g. 5400" />
        <SelectField label="Type" value={form.account_type} onChange={set('account_type')} options={ACCOUNT_TYPES} />
        <Field label="Name *" value={form.name} onChange={set('name')} full />
        <TextAreaField label="Description" value={form.description} onChange={set('description')} rows={2} />
        {account && <CheckboxField label="Active (inactive accounts can't be used on new entries)" checked={form.is_active} onChange={set('is_active')} full />}
      </FormGrid>
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : account ? 'Save changes' : 'Create account'}</Button>
      </ModalActions>
    </Modal>
  );
}

export default function ChartOfAccounts() {
  const { accounts } = useFinance();
  const [type, setType] = useState('all');
  const [editing, setEditing] = useState(null);
  const rows = type === 'all' ? accounts : accounts.filter((a) => a.account_type === type);
  const tabs = [{ key: 'all', label: 'All', count: accounts.length },
    ...ACCOUNT_TYPES.map((tp) => ({ key: tp.value, label: tp.label, count: accounts.filter((a) => a.account_type === tp.value).length }))];

  return (
    <Panel title="Chart of accounts" actions={<Button icon={Plus} onClick={() => setEditing({})}>New account</Button>}>
      <Tabs tabs={tabs} active={type} onChange={setType} />
      <DataTable
        columns={[
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Name' },
          { key: 'account_type', label: 'Type' },
          { key: 'is_active', label: 'Status', render: (a) => <StatusBadge status={a.is_active === false ? 'inactive' : 'active'} /> },
          { key: 'e', label: '', render: (a) => <Button size="sm" variant="info" onClick={() => setEditing(a)}>Edit</Button> },
        ]}
        rows={rows}
        emptyText="No accounts of this type."
      />
      {editing && <AccountModal account={editing.id ? editing : null} onClose={() => setEditing(null)} />}
    </Panel>
  );
}
