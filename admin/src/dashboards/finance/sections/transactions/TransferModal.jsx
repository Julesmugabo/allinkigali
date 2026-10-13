/**
 * TransferModal.jsx — move money between two bank / cash accounts.
 * Posts immediately (no income or expense involved).
 */
import React, { useState } from 'react';
import Modal, { ModalActions } from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField, TextAreaField } from '../../../../components/form/Fields';
import { useFinance } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { today } from '../../constants';
import { ErrorText } from '../../components/ui';

export default function TransferModal({ onClose }) {
  const { bankAccounts, changed, notify } = useFinance();
  const [form, setForm] = useState({ txn_date: today(), description: '', amount: '', source_bank_id: '', destination_bank_id: '', reference: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const bankOpts = bankAccounts.map((b) => ({ value: String(b.id), label: b.name }));

  const save = async () => {
    const { description, amount, source_bank_id, destination_bank_id } = form;
    if (!description.trim() || !amount || !source_bank_id || !destination_bank_id) { setError('Description, amount, source and destination are required.'); return; }
    if (source_bank_id === destination_bank_id) { setError('Source and destination must be different accounts.'); return; }
    setSaving(true); setError('');
    try {
      await financeApi.createTransfer({ ...form, amount: parseFloat(amount) });
      notify('Transfer posted');
      changed();
      onClose();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title="Transfer Funds">
      <ErrorText>{error}</ErrorText>
      <FormGrid>
        <Field label="Date" type="date" value={form.txn_date} onChange={set('txn_date')} />
        <Field label="Amount (RWF) *" type="number" min="0" value={form.amount} onChange={set('amount')} />
        <Field label="Description *" value={form.description} onChange={set('description')} placeholder="e.g. Move funds to operations" full />
        <SelectField label="From *" value={form.source_bank_id} onChange={set('source_bank_id')} options={bankOpts} placeholder="— Select —" />
        <SelectField label="To *" value={form.destination_bank_id} onChange={set('destination_bank_id')} options={bankOpts} placeholder="— Select —" />
        <Field label="Reference" value={form.reference} onChange={set('reference')} full />
        <TextAreaField label="Notes" value={form.notes} onChange={set('notes')} rows={2} />
      </FormGrid>
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Posting...' : 'Post transfer'}</Button>
      </ModalActions>
    </Modal>
  );
}
