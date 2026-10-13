/**
 * PaymentModal.jsx — record a full or partial payment against an invoice.
 */
import React, { useState } from 'react';
import { t } from '../../../../theme';
import Modal, { ModalActions } from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField } from '../../../../components/form/Fields';
import { useFinance } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { PAYMENT_METHODS, today } from '../../constants';
import { ErrorText, formatRWF } from '../../components/ui';

export default function PaymentModal({ invoice, onClose }) {
  const { changed, notify } = useFinance();
  const [form, setForm] = useState({ amount: String(invoice.outstanding || ''), payment_date: today(), payment_method: '', reference: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    const amount = parseFloat(form.amount);
    if (!amount || !form.payment_date) { setError('Amount and date are required.'); return; }
    if (amount > Number(invoice.outstanding)) { setError(`That's more than the ${formatRWF(invoice.outstanding)} outstanding.`); return; }
    setSaving(true); setError('');
    try {
      await financeApi.payInvoice(invoice.id, { ...form, amount });
      notify(`Payment of ${formatRWF(amount)} recorded`);
      changed();
      onClose();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title="Record Payment" width={480}>
      <p style={{ color: t.textSecondary, fontSize: 13, margin: '0 0 14px' }}>
        {invoice.invoice_number} · {invoice.contact_name} — outstanding <b style={{ color: t.text }}>{formatRWF(invoice.outstanding)}</b>
      </p>
      <ErrorText>{error}</ErrorText>
      <FormGrid>
        <Field label="Amount (RWF) *" type="number" min="0" value={form.amount} onChange={set('amount')} />
        <Field label="Payment date *" type="date" value={form.payment_date} onChange={set('payment_date')} />
        <SelectField label="Payment method" value={form.payment_method} onChange={set('payment_method')} options={PAYMENT_METHODS} placeholder="— Select —" />
        <Field label="Reference" value={form.reference} onChange={set('reference')} placeholder="Receipt #" />
      </FormGrid>
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Record payment'}</Button>
      </ModalActions>
    </Modal>
  );
}
