/**
 * TransactionModal.jsx — record (or edit a draft) income / expense.
 * Warns before saving something that looks like a duplicate (same type,
 * amount and date), same as the original app.
 */
import React, { useState } from 'react';
import Modal, { ModalActions } from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField, TextAreaField } from '../../../../components/form/Fields';
import { useFinance } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { PAYMENT_METHODS, today } from '../../constants';
import { ErrorText } from '../../components/ui';

const blank = { txn_date: today(), description: '', amount: '', category_account_id: '', bank_account_id: '', payment_method: '', contact_id: '', external_ref: '', notes: '', status: 'draft' };

function fromTxn(tx) {
  const str = (v) => (v == null ? '' : String(v));
  return {
    txn_date: tx.txn_date ? String(tx.txn_date).slice(0, 10) : today(),
    description: tx.description || '', amount: str(tx.amount),
    category_account_id: str(tx.category_account_id), bank_account_id: str(tx.bank_account_id),
    payment_method: tx.payment_method || '', contact_id: str(tx.contact_id),
    external_ref: tx.external_ref || '', notes: tx.notes || '', status: tx.status || 'draft',
  };
}

export default function TransactionModal({ txnType: initialType, editing, onClose }) {
  const { accounts, bankAccounts, contacts, changed, notify } = useFinance();
  const [txnType, setTxnType] = useState(initialType || 'income');
  const [form, setForm] = useState(editing ? fromTxn(editing) : blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const categoryOpts = accounts
    .filter((a) => a.account_type === txnType)
    .map((a) => ({ value: String(a.id), label: `${a.code} — ${a.name}` }));

  const save = async () => {
    if (!form.description.trim() || !form.amount) { setError('Description and amount are required.'); return; }
    setSaving(true); setError('');
    try {
      if (!editing) {
        const dup = await financeApi.checkDuplicate(txnType, form.amount, form.txn_date);
        if (dup?.duplicates && !window.confirm(`Possible duplicate:\n${dup.warnings.map((w) => w.message).join('\n')}\n\nSave anyway?`)) {
          setSaving(false); return;
        }
      }
      const body = {
        ...form,
        amount: parseFloat(form.amount),
        category_account_id: form.category_account_id || undefined,
        bank_account_id: form.bank_account_id || undefined,
        payment_method: form.payment_method || undefined,
        contact_id: form.contact_id || undefined,
        external_ref: form.external_ref || undefined,
        notes: form.notes || undefined,
      };
      if (editing) await financeApi.updateTransaction(editing.id, body);
      else await financeApi.createTransaction({ txn_type: txnType, ...body });
      notify(editing ? 'Transaction updated' : `${txnType === 'income' ? 'Income' : 'Expense'} recorded`);
      changed();
      onClose();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title={`${editing ? 'Edit' : 'Record'} ${txnType === 'income' ? 'Income' : 'Expense'}`}>
      <ErrorText>{error}</ErrorText>
      <FormGrid>
        {!editing && (
          <SelectField label="Type" value={txnType} onChange={setTxnType}
            options={[{ value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }]} />
        )}
        <Field label="Date" type="date" value={form.txn_date} onChange={set('txn_date')} />
        <Field label="Description *" value={form.description} onChange={set('description')} placeholder="What is this for?" full />
        <Field label="Amount (RWF) *" type="number" min="0" value={form.amount} onChange={set('amount')} />
        <SelectField label="Category account" value={form.category_account_id} onChange={set('category_account_id')} options={categoryOpts} placeholder="— Select —" />
        <SelectField label="Bank / cash account" value={form.bank_account_id} onChange={set('bank_account_id')}
          options={bankAccounts.map((b) => ({ value: String(b.id), label: b.name }))} placeholder="— Select —" />
        <SelectField label="Payment method" value={form.payment_method} onChange={set('payment_method')} options={PAYMENT_METHODS} placeholder="— Select —" />
        <SelectField label="Contact" value={form.contact_id} onChange={set('contact_id')}
          options={contacts.map((c) => ({ value: String(c.id), label: c.name }))} placeholder="None" />
        <Field label="External reference" value={form.external_ref} onChange={set('external_ref')} placeholder="Receipt / invoice #" />
        {!editing && (
          <SelectField label="Save as" value={form.status} onChange={set('status')}
            options={[{ value: 'draft', label: 'Draft' }, { value: 'pending_approval', label: 'Submit for approval' }]} />
        )}
        <TextAreaField label="Notes" value={form.notes} onChange={set('notes')} rows={2} />
      </FormGrid>
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Save transaction'}</Button>
      </ModalActions>
    </Modal>
  );
}
