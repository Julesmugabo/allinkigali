/**
 * Applications.jsx — businesses asking to be listed. Approving creates the
 * listing, makes the applicant its owner, and notifies them; declining
 * sends them the reason.
 */
import React, { useState } from 'react';
import { t } from '../../../../theme';
import { DataTable, Tabs, Badge } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { Panel, Loading, ErrorText, RowActions } from '../../../../components/ui';
import { useSellers } from '../../SellersContext';
import { sellersApi } from '../../sellersApi';

const COLORS = { pending: '#FBBF24', approved: '#34D399', declined: '#F87171' };

export default function Applications() {
  const { applications, loading, error, changed, notify } = useSellers();
  const [tab, setTab] = useState('pending');
  const [busy, setBusy] = useState(null);
  const rows = applications.filter((a) => tab === 'all' || a.status === tab);
  const tabs = ['pending', 'approved', 'declined', 'all'].map((k) => ({
    key: k, label: k === 'pending' ? 'Waiting' : k[0].toUpperCase() + k.slice(1),
    count: k === 'all' ? applications.length : applications.filter((a) => a.status === k).length,
  }));

  const approve = async (a) => {
    if (!window.confirm(`Approve ${a.business_name}? It goes live in the app and ${a.email} becomes its owner.`)) return;
    setBusy(a.id);
    try { await sellersApi.approve(a.id); notify(`${a.business_name} approved — the owner has been notified`); changed(); } catch (e) { alert(e.message); }
    setBusy(null);
  };
  const decline = async (a) => {
    const reason = window.prompt(`Decline ${a.business_name}?\nReason (sent to the applicant):`);
    if (reason === null) return;
    setBusy(a.id);
    try { await sellersApi.decline(a.id, reason.trim()); notify(`${a.business_name} declined — the applicant has been told`); changed(); } catch (e) { alert(e.message); }
    setBusy(null);
  };

  const columns = [
    {
      key: 'business', label: 'Business', render: (a) => (
        <div>
          <div style={{ fontWeight: 500 }}>{a.business_name}</div>
          <div style={{ color: t.textMuted, fontSize: 12 }}>{a.type === 'restaurant' ? 'Restaurant' : 'Coffee shop'} · {[a.location, a.district].filter(Boolean).join(', ')}</div>
        </div>
      ),
    },
    {
      key: 'contact', label: 'Applicant', render: (a) => (
        <div style={{ fontSize: 13 }}>
          <div>{[a.first_name, a.last_name].filter(Boolean).join(' ') || '—'}</div>
          <div style={{ color: t.textMuted }}><a href={`tel:${a.phone}`}>{a.phone}</a> · {a.email}</div>
        </div>
      ),
    },
    { key: 'notes', label: 'Notes', render: (a) => <span style={{ fontSize: 12, color: t.textSecondary }}>{a.status === 'declined' && a.decline_reason ? `Declined: ${a.decline_reason}` : a.notes || '—'}</span> },
    { key: 'created_at', label: 'Applied', render: (a) => new Date(a.created_at).toLocaleDateString('en-GB') },
    { key: 'status', label: 'Status', render: (a) => <Badge color={COLORS[a.status]}>{a.status}</Badge> },
    {
      key: 'x', label: '', render: (a) => (a.status === 'pending' ? (
        <RowActions>
          <Button size="sm" variant="success" disabled={busy === a.id} onClick={() => approve(a)}>Approve</Button>
          <Button size="sm" variant="danger" disabled={busy === a.id} onClick={() => decline(a)}>Decline</Button>
        </RowActions>
      ) : null),
    },
  ];

  return (
    <Panel title="Listing applications">
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      <ErrorText>{error}</ErrorText>
      {loading ? <Loading /> : <DataTable columns={columns} rows={rows} emptyText={tab === 'pending' ? 'No applications waiting.' : 'Nothing here.'} />}
    </Panel>
  );
}
