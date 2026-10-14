/**
 * Clients.jsx — every restaurant and coffee shop in one list, with the way
 * into each one's own dashboard (to work on the client's behalf).
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { t } from '../../../../theme';
import { DataTable, Tabs, Badge } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { Panel, Loading, ErrorText, RowActions } from '../../../../components/ui';
import { useSellers } from '../../SellersContext';

export default function Clients() {
  const navigate = useNavigate();
  const { places, loading, error } = useSellers();
  const [kind, setKind] = useState('all');
  const [search, setSearch] = useState('');
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return places
      .filter((p) => kind === 'all' || p.type === kind)
      .filter((p) => !q || `${p.name} ${p.location} ${p.district}`.toLowerCase().includes(q));
  }, [places, kind, search]);
  const tabs = [
    { key: 'all', label: 'All', count: places.length },
    { key: 'restaurant', label: 'Restaurants', count: places.filter((p) => p.type === 'restaurant').length },
    { key: 'coffeeshop', label: 'Coffee shops', count: places.filter((p) => p.type === 'coffeeshop').length },
  ];
  const base = (p) => (p.type === 'restaurant' ? '/restaurants' : '/coffee-shops');

  const columns = [
    {
      key: 'name', label: 'Client', render: (p) => (
        <div>
          <div style={{ fontWeight: 500 }}>{p.name}</div>
          <div style={{ color: t.textMuted, fontSize: 12 }}>{p.type === 'restaurant' ? 'Restaurant' : 'Coffee shop'} · {[p.location, p.district].filter(Boolean).join(', ') || '—'}</div>
        </div>
      ),
    },
    { key: 'phone', label: 'Phone', render: (p) => (p.phone ? <a href={`tel:${p.phone}`}>{p.phone}</a> : '—') },
    {
      key: 'state', label: 'State', render: (p) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Badge color={/^open/i.test(p.open_status || '') ? t.success : t.danger}>{/^open/i.test(p.open_status || '') ? 'open' : 'closed'}</Badge>
          {p.is_active === false && <Badge color={t.textMuted}>hidden</Badge>}
          {p.delivery_enabled && <Badge color="#60A5FA">delivery</Badge>}
        </div>
      ),
    },
    {
      key: 'x', label: '', render: (p) => (
        <RowActions>
          <Button size="sm" variant="info" icon={ExternalLink} onClick={() => navigate(`/clients/${p.type}/${p.id}`)}>Open dashboard</Button>
          <Button size="sm" variant="ghost" onClick={() => navigate(`${base(p)}/add?id=${p.id}`)}>Edit listing</Button>
        </RowActions>
      ),
    },
  ];

  return (
    <Panel title="Clients">
      <Tabs tabs={tabs} active={kind} onChange={setKind} />
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, location or district" style={{ maxWidth: 360, width: '100%', marginBottom: 14 }} />
      <ErrorText>{error}</ErrorText>
      {loading ? <Loading /> : <DataTable columns={columns} rows={rows} emptyText="No clients match." />}
    </Panel>
  );
}
