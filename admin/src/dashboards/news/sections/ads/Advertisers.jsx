/**
 * Advertisers.jsx — companies that buy ads (campaigns attach to them).
 */
import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { DataTable } from '../../../../components/PageShell';
import Modal, { ModalActions } from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, TextAreaField } from '../../../../components/form/Fields';
import MediaUpload from '../../../../components/form/MediaUpload';
import { Loading, ErrorText, RowActions } from '../../../../components/ui';
import { useNews } from '../../NewsContext';
import { newsApi } from '../../newsApi';

function AdvertiserModal({ advertiser, onSaved, onClose }) {
  const { notify } = useNews();
  const [form, setForm] = useState({
    name: advertiser?.name || '', contact: advertiser?.contact || '', email: advertiser?.email || '',
    phone: advertiser?.phone || '', logoUrl: advertiser?.logo_url || '', notes: advertiser?.notes || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try {
      if (advertiser) await newsApi.updateAdvertiser(advertiser.id, form);
      else await newsApi.createAdvertiser(form);
      notify(advertiser ? 'Advertiser updated' : 'Advertiser added'); onSaved(); onClose();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title={advertiser ? 'Edit Advertiser' : 'Add Advertiser'} width={580}>
      <ErrorText>{error}</ErrorText>
      <FormGrid>
        <Field label="Company / advertiser *" value={form.name} onChange={set('name')} full />
        <Field label="Contact person" value={form.contact} onChange={set('contact')} />
        <Field label="Phone" value={form.phone} onChange={set('phone')} />
        <Field label="Email" type="email" value={form.email} onChange={set('email')} full />
        <MediaUpload label="Logo" value={form.logoUrl} onChange={set('logoUrl')} />
        <TextAreaField label="Notes" value={form.notes} onChange={set('notes')} rows={2} />
      </FormGrid>
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
      </ModalActions>
    </Modal>
  );
}

export default function Advertisers() {
  const { notify } = useNews();
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const load = () => newsApi.advertisers().then(setList).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const remove = async (adv) => {
    if (!window.confirm(`Delete ${adv.name}? Their campaigns are removed too.`)) return;
    try { await newsApi.deleteAdvertiser(adv.id); notify('Advertiser deleted'); load(); } catch (e) { setError(e.message); }
  };

  const columns = [
    { key: 'name', label: 'Advertiser', render: (a) => <span style={{ fontWeight: 500 }}>{a.name}</span> },
    { key: 'contact', label: 'Contact', render: (a) => [a.contact, a.phone].filter(Boolean).join(' · ') || '—' },
    { key: 'email', label: 'Email', render: (a) => a.email || '—' },
    {
      key: 'x', label: '', render: (a) => (
        <RowActions>
          <Button size="sm" variant="info" onClick={() => setEditing(a)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => remove(a)}>Delete</Button>
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 14 }}><Button icon={Plus} onClick={() => setEditing({})}>Add advertiser</Button></div>
      <ErrorText>{error}</ErrorText>
      {!list ? <Loading /> : <DataTable columns={columns} rows={list} emptyText="No advertisers yet." />}
      {editing && <AdvertiserModal advertiser={editing.id ? editing : null} onSaved={load} onClose={() => setEditing(null)} />}
    </>
  );
}
