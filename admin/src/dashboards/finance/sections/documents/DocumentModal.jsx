/**
 * DocumentModal.jsx — attach a document by link (Google Drive, Dropbox,
 * or an uploaded file's URL) and optionally tie it to an invoice/project.
 */
import React, { useState } from 'react';
import Modal, { ModalActions } from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField, TextAreaField } from '../../../../components/form/Fields';
import { useFinance, useFinanceData } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { ErrorText } from '../../components/ui';

export default function DocumentModal({ onClose }) {
  const { projects, changed, notify } = useFinance();
  const { data: invoices } = useFinanceData(() => financeApi.invoices());
  const [form, setForm] = useState({ file_name: '', file_url: '', file_type: '', description: '', invoice_id: '', project_id: '', transaction_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.file_name.trim() || !form.file_url.trim()) { setError('File name and link are required.'); return; }
    if (!/^https?:\/\//i.test(form.file_url.trim())) { setError('The link must start with http:// or https://'); return; }
    setSaving(true); setError('');
    try {
      await financeApi.createDocument({
        ...form,
        invoice_id: form.invoice_id || null,
        project_id: form.project_id || null,
        transaction_id: form.transaction_id || null,
      });
      notify('Document added');
      changed();
      onClose();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title="Add Document">
      <ErrorText>{error}</ErrorText>
      <FormGrid>
        <Field label="File name *" value={form.file_name} onChange={set('file_name')} placeholder="receipt-oct-2026.pdf" />
        <Field label="File type" value={form.file_type} onChange={set('file_type')} placeholder="pdf, image, spreadsheet" />
        <Field label="Link *" value={form.file_url} onChange={set('file_url')} placeholder="https://drive.google.com/..." full />
        <SelectField label="Link to invoice" value={form.invoice_id} onChange={set('invoice_id')}
          options={(invoices || []).map((i) => ({ value: String(i.id), label: `${i.invoice_number} — ${i.contact_name || ''}` }))} placeholder="None" />
        <SelectField label="Link to project" value={form.project_id} onChange={set('project_id')}
          options={projects.map((p) => ({ value: String(p.id), label: `${p.code} — ${p.name}` }))} placeholder="None" />
        <Field label="Link to transaction (ID)" value={form.transaction_id} onChange={set('transaction_id')} placeholder="Optional" />
        <TextAreaField label="Description" value={form.description} onChange={set('description')} rows={2} />
      </FormGrid>
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Add document'}</Button>
      </ModalActions>
    </Modal>
  );
}
