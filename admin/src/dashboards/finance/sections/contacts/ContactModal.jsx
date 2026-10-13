/**
 * ContactModal.jsx — add or edit a finance contact.
 */
import React, { useState } from 'react';
import Modal, { ModalActions } from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField } from '../../../../components/form/Fields';
import { useFinance } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { CONTACT_TYPES } from '../../constants';
import { ErrorText } from '../../components/ui';

export default function ContactModal({ contact, onClose }) {
  const { changed, notify } = useFinance();
  const [form, setForm] = useState({
    name: contact?.name || '', contact_type: contact?.contact_type || 'supplier',
    email: contact?.email || '', phone: contact?.phone || '',
    payment_terms_days: String(contact?.payment_terms_days ?? 30),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try {
      const body = { ...form, payment_terms_days: parseInt(form.payment_terms_days, 10) || 30 };
      if (contact) await financeApi.updateContact(contact.id, { ...contact, ...body });
      else await financeApi.createContact(body);
      notify(contact ? 'Contact updated' : 'Contact added');
      changed();
      onClose();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title={contact ? 'Edit Contact' : 'Add Contact'} width={520}>
      <ErrorText>{error}</ErrorText>
      <FormGrid>
        <Field label="Name *" value={form.name} onChange={set('name')} full />
        <SelectField label="Type" value={form.contact_type} onChange={set('contact_type')} options={CONTACT_TYPES} />
        <Field label="Payment terms (days)" type="number" min="0" value={form.payment_terms_days} onChange={set('payment_terms_days')} />
        <Field label="Email" type="email" value={form.email} onChange={set('email')} />
        <Field label="Phone" value={form.phone} onChange={set('phone')} placeholder="+250..." />
      </FormGrid>
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : contact ? 'Save changes' : 'Add contact'}</Button>
      </ModalActions>
    </Modal>
  );
}
