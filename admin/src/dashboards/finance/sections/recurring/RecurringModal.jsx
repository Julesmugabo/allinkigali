/**
 * RecurringModal.jsx — new recurring template.
 */
import React, { useState } from 'react';
import Modal, { ModalActions } from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField, CheckboxField } from '../../../../components/form/Fields';
import { useFinance } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { PAYMENT_METHODS } from '../../constants';
import { ErrorText } from '../../components/ui';

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function RecurringModal({ onClose }) {
  const { accounts, bankAccounts, contacts, changed, notify } = useFinance();
  const [form, setForm] = useState({ txn_type: 'expense', description: '', amount: '', frequency: 'monthly', next_run_date: '', end_date: '', category_account_id: '', bank_account_id: '', contact_id: '', payment_method: '', auto_post: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.description.trim() || !form.amount || !form.next_run_date) { setError('Description, amount and next run date are required.'); return; }
    setSaving(true); setError('');
    try {
      const body = { ...form, amount: parseFloat(form.amount) };
      ['end_date', 'category_account_id', 'bank_account_id', 'contact_id', 'payment_method'].forEach((k) => { if (!body[k]) body[k] = null; });
      await financeApi.createRecurring(body);
      notify('Recurring template created');
      changed();
      onClose();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title="New Recurring Template">
      <ErrorText>{error}</ErrorText>
      <FormGrid>
        <SelectField label="Type" value={form.txn_type} onChange={set('txn_type')}
          options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]} />
        <Field label="Amount (RWF) *" type="number" min="0" value={form.amount} onChange={set('amount')} />
        <Field label="Description *" value={form.description} onChange={set('description')} placeholder="e.g. Office rent" full />
        <SelectField label="Frequency" value={form.frequency} onChange={set('frequency')} options={FREQUENCIES} />
        <Field label="Next run date *" type="date" value={form.next_run_date} onChange={set('next_run_date')} />
        <Field label="End date" type="date" value={form.end_date} onChange={set('end_date')} hint="Leave empty to repeat indefinitely" />
        <SelectField label="Category account" value={form.category_account_id} onChange={set('category_account_id')}
          options={accounts.filter((a) => a.account_type === form.txn_type).map((a) => ({ value: String(a.id), label: `${a.code} — ${a.name}` }))} placeholder="— Select —" />
        <SelectField label="Bank / cash account" value={form.bank_account_id} onChange={set('bank_account_id')}
          options={bankAccounts.map((b) => ({ value: String(b.id), label: b.name }))} placeholder="— Select —" />
        <SelectField label="Contact" value={form.contact_id} onChange={set('contact_id')}
          options={contacts.map((c) => ({ value: String(c.id), label: c.name }))} placeholder="None" />
        <SelectField label="Payment method" value={form.payment_method} onChange={set('payment_method')} options={PAYMENT_METHODS} placeholder="— Select —" />
        <CheckboxField label="Post automatically (skip approval)" checked={form.auto_post} onChange={set('auto_post')} full />
      </FormGrid>
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Create template'}</Button>
      </ModalActions>
    </Modal>
  );
}
