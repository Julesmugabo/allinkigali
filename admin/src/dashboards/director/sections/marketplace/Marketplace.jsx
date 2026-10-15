/**
 * Marketplace.jsx — the shop sellers in the app's marketplace: verify
 * them (a trust badge), remove fake ones, and see who gets seen and asked.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { t } from '../../../../theme';
import { DataTable, Tabs, Badge } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { Panel, Kpi, KpiGrid, Loading, ErrorText, RowActions, fmtNum } from '../../../../components/ui';
import BarList from '../../../../components/ui/BarList';
import { directorApi } from '../../directorApi';

export default function Marketplace({ notify }) {
  const [shops, setShops] = useState(null);
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState('all');
  const [error, setError] = useState('');
  const load = () => Promise.all([directorApi.shops(), directorApi.shopRequests().catch(() => [])])
    .then(([s, r]) => { setShops(s); setRequests(r); }).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const reqCount = useMemo(() => {
    const m = {};
    requests.forEach((r) => { m[r.businessId] = (m[r.businessId] || 0) + 1; });
    return m;
  }, [requests]);

  if (!shops) return error ? <ErrorText>{error}</ErrorText> : <Loading />;

  const act = async (fn, msg) => { try { await fn(); notify(msg); load(); } catch (e) { alert(e.message); } };
  const rows = shops.filter((s) => tab === 'all' || (tab === 'unverified' ? !s.verified : tab === 'verified' ? s.verified : !s.views));
  const byCategory = {};
  shops.forEach((s) => { byCategory[s.category || 'other'] = (byCategory[s.category || 'other'] || 0) + 1; });

  const columns = [
    { key: 'name', label: 'Shop', render: (s) => <div><div style={{ fontWeight: 500 }}>{s.name}</div><div style={{ color: t.textMuted, fontSize: 12 }}>{[s.category, s.location].filter(Boolean).join(' · ')}</div></div> },
    { key: 'phone', label: 'Phone', render: (s) => (s.phone ? <a href={`tel:${s.phone}`}>{s.phone}</a> : '—') },
    { key: 'views', label: 'Views', render: (s) => fmtNum(s.views) },
    { key: 'requests', label: 'Requests', render: (s) => reqCount[s.id] || 0 },
    { key: 'verified', label: 'Status', render: (s) => <Badge color={s.verified ? t.success : t.warning}>{s.verified ? 'verified' : 'not verified'}</Badge> },
    {
      key: 'x', label: '', render: (s) => (
        <RowActions>
          {s.verified
            ? <Button size="sm" variant="ghost" onClick={() => act(() => directorApi.unverifyShop(s.id), `${s.name} is no longer verified`)}>Unverify</Button>
            : <Button size="sm" variant="success" onClick={() => act(() => directorApi.verifyShop(s.id), `${s.name} verified`)}>Verify</Button>}
          <Button size="sm" variant="danger" onClick={() => window.confirm(`Delete ${s.name} from the marketplace?`) && act(() => directorApi.deleteShop(s.id), `${s.name} deleted`)}>Delete</Button>
        </RowActions>
      ),
    },
  ];
  const tabs = [
    { key: 'all', label: 'All', count: shops.length },
    { key: 'unverified', label: 'Not verified', count: shops.filter((s) => !s.verified).length },
    { key: 'verified', label: 'Verified', count: shops.filter((s) => s.verified).length },
    { key: 'unseen', label: 'Never viewed', count: shops.filter((s) => !s.views).length },
  ];

  return (
    <>
      <KpiGrid>
        <Kpi label="Shops" value={shops.length} />
        <Kpi label="Not verified" value={shops.filter((s) => !s.verified).length} color={t.warning} />
        <Kpi label="Profile views" value={fmtNum(shops.reduce((s, b) => s + (b.views || 0), 0))} color="#378ADD" />
        <Kpi label="Customer requests" value={requests.length} hint={`${requests.filter((r) => r.status === 'new').length} new`} color={t.success} />
      </KpiGrid>
      <Panel title="Shops">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
        <DataTable columns={columns} rows={rows} emptyText="No shops here." />
      </Panel>
      <Panel title="Shops by category">
        <BarList rows={Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ key: k, label: k, value: v }))} empty="No shops yet." />
      </Panel>
    </>
  );
}
