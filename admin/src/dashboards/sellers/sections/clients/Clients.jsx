/**
 * Clients.jsx — Sales Partners › Clients › All clients: every restaurant,
 * coffee shop and wedding venue, whether it has an owner login yet, its
 * team, Ku Meza tables and last sign-in. "Open dashboard" looks inside as
 * allinkigali support (read-only until "Make changes"; the client sees it).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, KeyRound } from 'lucide-react';
import { t } from '../../../../theme';
import { DataTable, Tabs } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { Panel, Loading, ErrorText, RowActions } from '../../../../components/ui';
import { openClientDashboard } from '../../../../utils/openClientDashboard';
import { clientsApi, KIND } from './clientsApi';
import TempPassword from './TempPassword';

const fmtDay = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'never');
const EDIT = { restaurant: '/restaurants/add?id=', coffeeshop: '/coffee-shops/add?id=' };

export default function Clients() {
  const navigate = useNavigate();
  const [places, setPlaces] = useState(null);
  const [error, setError] = useState('');
  const [kind, setKind] = useState('all');
  const [search, setSearch] = useState('');
  const [reset, setReset] = useState(null); // { name, password }
  useEffect(() => { clientsApi.places().then(setPlaces).catch((e) => setError(e.message)); }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (places || [])
      .filter((p) => kind === 'all' || p.type === kind)
      .filter((p) => !q || `${p.name} ${p.district || ''} ${p.owners.map((o) => `${o.name} ${o.email}`).join(' ')}`.toLowerCase().includes(q))
      .map((p) => ({ ...p, placeId: p.id, id: `${p.type}:${p.id}` })); // a restaurant and a café can share an id
  }, [places, kind, search]);

  const resetPassword = async (p, owner) => {
    if (!window.confirm(`Give ${owner.name} (${owner.email}) a new temporary password? Their old password stops working, and ${p.name} sees this in its activity list.`)) return;
    try { const r = await clientsApi.resetPassword(owner.id); setReset({ name: owner.name, email: owner.email, password: r.temporaryPassword }); } catch (e) { alert(e.message); }
  };

  if (!places) return error ? <ErrorText>{error}</ErrorText> : <Loading />;
  const count = (k) => places.filter((p) => p.type === k).length;
  const tabs = [{ key: 'all', label: 'All', count: places.length }, ...Object.entries(KIND).map(([key, label]) => ({ key, label: `${label}s`, count: count(key) }))];
  const columns = [
    {
      key: 'name', label: 'Client', render: (p) => (
        <div>
          <div style={{ fontWeight: 500 }}>{p.name}</div>
          <div style={s.muted}>{KIND[p.type]}{p.district ? ` · ${p.district}` : ''}</div>
        </div>
      ),
    },
    {
      key: 'owners', label: 'Owner login', render: (p) => (p.owners.length ? p.owners.map((o) => (
        <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{o.name}<span style={s.muted}> · {o.email || 'no email'}{o.role === 'manager' ? ' · manager' : ''}</span></span>
          {o.email && <button type="button" title="New temporary password" onClick={() => resetPassword(p, o)} style={s.key}><KeyRound size={13} /></button>}
        </div>
      )) : <Button size="sm" variant="warning" onClick={() => navigate(`/sellers/onboard?type=${p.type}&id=${encodeURIComponent(p.placeId)}`)}>Give owner login</Button>),
    },
    { key: 'team', label: 'Team', render: (p) => <span style={s.muted}>{p.team} {p.team === 1 ? 'person' : 'people'}</span> },
    { key: 'kumeza', label: 'Ku Meza', render: (p) => (p.type === 'wedding' ? '—' : <span style={s.muted}>{p.tables ? `${p.tables} tables${p.openTables ? ` · ${p.openTables} busy now` : ''}` : 'not set up'}</span>) },
    { key: 'last', label: 'Last sign-in', render: (p) => <span style={s.muted}>{fmtDay(p.lastLogin)}</span> },
    {
      key: 'x', label: '', render: (p) => (
        <RowActions>
          <Button size="sm" variant="info" icon={ExternalLink} onClick={() => openClientDashboard(p.type, p.placeId)}>Open dashboard</Button>
          {EDIT[p.type] && <Button size="sm" variant="ghost" onClick={() => navigate(`${EDIT[p.type]}${p.placeId}`)}>Edit listing</Button>}
        </RowActions>
      ),
    },
  ];

  return (
    <Panel title="All clients">
      {reset && <TempPassword title={`New password for ${reset.name}`} email={reset.email} password={reset.password} onDone={() => setReset(null)} />}
      <Tabs tabs={tabs} active={kind} onChange={setKind} />
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, district or owner" style={{ maxWidth: 360, width: '100%', marginBottom: 14 }} />
      <DataTable columns={columns} rows={rows} emptyText="No clients match." />
    </Panel>
  );
}

const s = {
  muted: { color: t.textMuted, fontSize: 12, whiteSpace: 'nowrap' },
  key: { background: 'transparent', color: t.textMuted, padding: 4, display: 'inline-flex' },
};
