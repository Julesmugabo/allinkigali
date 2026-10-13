/**
 * Campaigns.jsx — an advertiser's paid campaigns with budget and dates;
 * draft → active → paused/ended.
 */
import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { DataTable } from '../../../../components/PageShell';
import Modal, { ModalActions } from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField, TextAreaField } from '../../../../components/form/Fields';
import { Loading, ErrorText, RowActions } from '../../../../components/ui';
import { useNews } from '../../NewsContext';
import { newsApi } from '../../newsApi';
import { fmtDate } from '../../constants';
import StatusBadge from '../../components/StatusBadge';

function CampaignModal({ advertisers, onSaved, onClose }) {
  const { notify } = useNews();
  const [form, setForm] = useState({ advertiserId: '', name: '', budget: '', startsAt: '', endsAt: '', notes: '' });
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.advertiserId || !form.name.trim()) { setError('Advertiser and campaign name are required.'); return; }
    if (form.startsAt && form.endsAt && form.endsAt < form.startsAt) { setError('The end date is before the start date.'); return; }
    try {
      await newsApi.createCampaign({
        advertiserId: parseInt(form.advertiserId, 10), name: form.name.trim(),
        budget: form.budget ? parseFloat(form.budget) : null,
        startsAt: form.startsAt || null, endsAt: form.endsAt || null, notes: form.notes || null,
      });
      notify('Campaign created'); onSaved(); onClose();
    } catch (e) { setError(e.message); }
  };

  return (
    <Modal open onClose={onClose} title="New Campaign" width={560}>
      <ErrorText>{error}</ErrorText>
      {advertisers.length === 0 && <ErrorText>Add an advertiser first.</ErrorText>}
      <FormGrid>
        <SelectField label="Advertiser *" value={form.advertiserId} onChange={set('advertiserId')} placeholder="— Select —"
          options={advertisers.map((a) => ({ value: String(a.id), label: a.name }))} />
        <Field label="Campaign name *" value={form.name} onChange={set('name')} />
        <Field label="Budget (RWF)" type="number" min="0" value={form.budget} onChange={set('budget')} />
        <Field label="Starts" type="date" value={form.startsAt} onChange={set('startsAt')} />
        <Field label="Ends" type="date" value={form.endsAt} onChange={set('endsAt')} />
        <TextAreaField label="Notes" value={form.notes} onChange={set('notes')} rows={2} />
      </FormGrid>
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save}>Create campaign</Button>
      </ModalActions>
    </Modal>
  );
}

export default function Campaigns() {
  const { notify } = useNews();
  const [list, setList] = useState(null);
  const [advertisers, setAdvertisers] = useState([]);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const load = () => Promise.all([newsApi.campaigns(), newsApi.advertisers()])
    .then(([c, a]) => { setList(c); setAdvertisers(a); }).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const setStatus = async (c, status) => {
    try { await newsApi.updateCampaign(c.id, { status }); notify(`Campaign ${status}`); load(); } catch (e) { setError(e.message); }
  };
  const remove = async (c) => {
    if (!window.confirm(`Delete the campaign "${c.name}"?`)) return;
    try { await newsApi.deleteCampaign(c.id); notify('Campaign deleted'); load(); } catch (e) { setError(e.message); }
  };

  const columns = [
    { key: 'name', label: 'Campaign', render: (c) => <span style={{ fontWeight: 500 }}>{c.name}</span> },
    { key: 'advertiser_name', label: 'Advertiser' },
    { key: 'budget', label: 'Budget', render: (c) => (c.budget ? `RWF ${Number(c.budget).toLocaleString()}` : '—') },
    { key: 'dates', label: 'Runs', render: (c) => `${fmtDate(c.starts_at)} → ${fmtDate(c.ends_at)}` },
    { key: 'status', label: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    {
      key: 'x', label: '', render: (c) => (
        <RowActions>
          {(c.status === 'draft' || c.status === 'paused') && <Button size="sm" variant="success" onClick={() => setStatus(c, 'active')}>Activate</Button>}
          {c.status === 'active' && <Button size="sm" variant="warning" onClick={() => setStatus(c, 'paused')}>Pause</Button>}
          {c.status !== 'ended' && <Button size="sm" variant="ghost" onClick={() => setStatus(c, 'ended')}>End</Button>}
          <Button size="sm" variant="danger" onClick={() => remove(c)}>Delete</Button>
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 14 }}><Button icon={Plus} onClick={() => setCreating(true)}>New campaign</Button></div>
      <ErrorText>{error}</ErrorText>
      {!list ? <Loading /> : <DataTable columns={columns} rows={list} emptyText="No campaigns yet." />}
      {creating && <CampaignModal advertisers={advertisers} onSaved={load} onClose={() => setCreating(false)} />}
    </>
  );
}
