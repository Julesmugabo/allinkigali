/**
 * PlacesList.jsx — every listing with quick switches (open/closed, shown to
 * readers or hidden, delivery) and Edit / Open dashboard / Delete.
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ExternalLink } from 'lucide-react';
import { t } from '../../../../theme';
import { DataTable } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { Panel, Loading, ErrorText, RowActions } from '../../../../components/ui';
import { usePlaces } from '../../PlacesContext';
import { placesApi } from '../../placesApi';
import { isOpen } from '../overview/Overview';
import DeliveryCell from './DeliveryCell';

function Switch({ on, onClick, onLabel, offLabel, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...s.switch, ...(on ? s.on : s.off) }}>{on ? onLabel : offLabel}</button>
  );
}

export default function PlacesList() {
  const navigate = useNavigate();
  const { type, places, loading, error, changed, notify } = usePlaces();
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? places.filter((p) => `${p.name} ${p.location} ${p.district}`.toLowerCase().includes(q)) : places;
  }, [places, search]);

  const quick = async (p, body, msg) => {
    setBusy(p.id);
    try { await placesApi.quick(type, p.id, body); notify(msg); changed(); } catch (e) { alert(e.message); }
    setBusy(null);
  };
  const remove = async (p) => {
    if (!window.confirm(`Delete ${p.name} permanently? Its photos and menu go too. To just take it out of the app, switch it to "Hidden" instead.`)) return;
    try { await placesApi.remove(type, p.id); notify(`${p.name} deleted`); changed(); } catch (e) { alert(e.message); }
  };

  const columns = [
    {
      key: 'name', label: type.one, render: (p) => (
        <div>
          <div style={{ fontWeight: 500 }}>{p.name}</div>
          <div style={{ color: t.textMuted, fontSize: 12 }}>{[p.location, p.district].filter(Boolean).join(' · ') || '—'}</div>
        </div>
      ),
    },
    { key: 'rating', label: 'Rating', render: (p) => (p.rating ? `★ ${Number(p.rating).toFixed(1)}` : '—') },
    { key: 'open', label: 'Now', render: (p) => <Switch on={isOpen(p)} onLabel="Open" offLabel="Closed" disabled={busy === p.id} onClick={() => quick(p, { open_status: isOpen(p) ? 'Closed' : 'Open now' }, `${p.name} marked ${isOpen(p) ? 'closed' : 'open'}`)} /> },
    { key: 'shown', label: 'In the app', render: (p) => <Switch on={p.is_active !== false} onLabel="Shown" offLabel="Hidden" disabled={busy === p.id} onClick={() => quick(p, { is_active: p.is_active === false }, p.is_active === false ? `${p.name} is visible again` : `${p.name} hidden from the app`)} /> },
    { key: 'delivery', label: 'Delivery', render: (p) => <DeliveryCell place={p} disabled={busy === p.id} onSave={(body, msg) => quick(p, body, msg)} /> },
    {
      key: 'a', label: '', render: (p) => (
        <RowActions>
          <Button size="sm" variant="info" onClick={() => navigate(`${type.base}/add?id=${p.id}`)}>Edit</Button>
          <Button size="sm" variant="ghost" icon={ExternalLink} onClick={() => navigate(`/clients/${type.key}/${p.id}`)}>Open dashboard</Button>
          <Button size="sm" variant="danger" onClick={() => remove(p)}>Delete</Button>
        </RowActions>
      ),
    },
  ];

  return (
    <Panel title={`${type.title} (${places.length})`} actions={<Button icon={Plus} onClick={() => navigate(`${type.base}/add`)}>Add {type.one.toLowerCase()}</Button>}>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, location or district" style={{ maxWidth: 360, width: '100%', marginBottom: 14 }} />
      <ErrorText>{error}</ErrorText>
      {loading ? <Loading /> : <DataTable columns={columns} rows={rows} emptyText={`No ${type.title.toLowerCase()} yet.`} />}
    </Panel>
  );
}

const s = {
  switch: { padding: '4px 10px', fontSize: 12, fontWeight: 600, borderRadius: 20, minWidth: 68 },
  on: { background: `${t.success}20`, color: t.success },
  off: { background: t.bgHover, color: t.textSecondary },
};
