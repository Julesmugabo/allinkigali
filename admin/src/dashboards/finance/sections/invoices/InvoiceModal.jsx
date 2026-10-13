/**
 * InvoiceModal.jsx — create a receivable or payable invoice.
 */
import React, { useState } from 'react';
import Modal, { ModalActions } from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField, TextAreaField } from '../../../../components/form/Fields';
import { useFinance } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { today } from '../../constants';
import { ErrorText } from '../../components/ui';

export default function InvoiceModal({ onClose }) {
  const { contacts, changed, notify } = useFinance();
  const [form, setForm] = useState({ invoice_number: '', invoice_type: 'receivable', contact_id: '', invoice_date: today(), due_date: '', total_amount: '', tax_amount: '0', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.invoice_number.trim() || !form.contact_id || !form.due_date || !form.total_amount) {
      setError('Invoice number, contact, due date and amount are required.'); return;
    }
    setSaving(true); setError('');
    try {
      await financeApi.createInvoice({ ...form, total_amount: parseFloat(form.total_amount), tax_amount: parseFloat(form.tax_amount) || 0 });
      notify(`Invoice ${form.invoice_number} created`);
      changed();
      onClose();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title="New Invoice">
      <ErrorText>{error}</ErrorText>
      {contacts.length === 0 && <ErrorText>Add a contact first (Contacts section) — every invoice needs one.</ErrorText>}
      <FormGrid>
        <SelectField label="Type" value={form.invoice_type} onChange={set('invoice_type')}
          options={[{ value: 'receivable', label: 'Receivable (customer owes us)' }, { value: 'payable', label: 'Payable (we owe a supplier)' }]} />
        <Field label="Invoice number *" value={form.invoice_number} onChange={set('invoice_number')} placeholder="INV-001" />
        <SelectField label="Contact *" value={form.contact_id} onChange={set('contact_id')}
          options={contacts.map((c) => ({ value: String(c.id), label: c.name }))} placeholder="— Select —" />
        <Field label="Invoice date" type="date" value={form.invoice_date} onChange={set('invoice_date')} />
        <Field label="Due date *" type="date" value={form.due_date} onChange={set('due_date')} />
        <Field label="Total amount (RWF) *" type="number" min="0" value={form.total_amount} onChange={set('total_amount')} />
        <Field label="Tax amount (RWF)" type="number" min="0" value={form.tax_amount} onChange={set('tax_amount')} />
        <TextAreaField label="Description" value={form.description} onChange={set('description')} rows={2} />
      </FormGrid>
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Create invoice'}</Button>
      </ModalActions>
    </Modal>
  );
}
