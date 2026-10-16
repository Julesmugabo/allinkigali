/**
 * Overview.jsx — the whole platform at a glance, today's news (see
 * NewsToday.jsx), and a list of everything waiting on someone (with a link
 * straight to it).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { t } from '../../../../theme';
import { Panel, Kpi, KpiGrid, Loading, fmtNum } from '../../../../components/ui';
import { directorApi } from '../../directorApi';
import NewsToday from './NewsToday';

const safe = (p, fallback) => p.catch(() => fallback);

export default function Overview({ notify }) {
  const navigate = useNavigate();
  const [d, setD] = useState(null);
  const load = useCallback(() => {
    Promise.all([
      safe(directorApi.articles(), []), safe(directorApi.places(), []), safe(directorApi.applications(), []),
      safe(directorApi.shops(), []), safe(directorApi.shopRequests(), []), safe(directorApi.team(), []), safe(directorApi.finance(), null),
      safe(directorApi.categories(), []),
    ]).then(([articles, places, applications, shops, requests, team, finance, categories]) => setD({ articles, places, applications, shops, requests, team, finance, categories }));
  }, []);
  useEffect(load, [load]);
  if (!d) return <Loading />;
  const categoryLabel = (key) => d.categories.find((c) => c.key === key)?.label || key;

  const pendingArticles = d.articles.filter((a) => a.status === 'pending' && !a.isArchived).length;
  const waitingApps = d.applications.filter((a) => a.status === 'pending').length;
  const unverified = d.shops.filter((s) => !s.verified).length;
  const newRequests = d.requests.filter((r) => r.status === 'new').length;
  const cards = d.finance?.cards || {};
  const attention = [
    pendingArticles && { text: `${pendingArticles} article(s) waiting for approval`, to: '/news/articles?tab=pending&day=all' },
    waitingApps && { text: `${waitingApps} business application(s) to review`, to: '/sellers/applications' },
    unverified && { text: `${unverified} marketplace shop(s) not verified yet`, to: '/overview/marketplace' },
    newRequests && { text: `${newRequests} new customer request(s) to shops`, to: '/overview/marketplace' },
  ].filter(Boolean);

  return (
    <>
      <KpiGrid>
        <Kpi label="Articles published" value={d.articles.filter((a) => a.status === 'published' && !a.isArchived).length} hint={`${fmtNum(d.articles.reduce((s, a) => s + (a.views || 0), 0))} reads`} onClick={() => navigate('/news')} />
        <Kpi label="Restaurants" value={d.places.filter((p) => p.type === 'restaurant').length} color="#FB923C" onClick={() => navigate('/restaurants')} />
        <Kpi label="Coffee shops" value={d.places.filter((p) => p.type === 'coffeeshop').length} color="#F5C518" onClick={() => navigate('/coffee-shops')} />
        <Kpi label="Marketplace shops" value={d.shops.length} hint={`${d.shops.length - unverified} verified`} color={t.success} onClick={() => navigate('/overview/marketplace')} />
        <Kpi label="Staff with access" value={d.team.length} onClick={() => navigate('/overview/team')} />
      </KpiGrid>
      {d.finance && (
        <KpiGrid>
          <Kpi label="Cash & bank" value={`RWF ${fmtNum(cards.cashBank)}`} color="#378ADD" onClick={() => navigate('/finance')} />
          <Kpi label="Income this month" value={`RWF ${fmtNum(cards.income)}`} color={t.success} />
          <Kpi label="Expenses this month" value={`RWF ${fmtNum(cards.expenses)}`} color={t.danger} />
          <Kpi label="Owed to us" value={`RWF ${fmtNum(cards.receivables)}`} color={t.warning} />
        </KpiGrid>
      )}
      <NewsToday articles={d.articles} categoryLabel={categoryLabel} onChanged={load} notify={notify} />
      <Panel title="Needs attention">
        {attention.length ? attention.map((a) => (
          <button key={a.text} onClick={() => navigate(a.to)} style={s.row}><AlertCircle size={15} color={t.warning} /> {a.text}</button>
        )) : <div style={s.clear}><CheckCircle2 size={18} color={t.success} /> All caught up — nothing waiting anywhere.</div>}
      </Panel>
    </>
  );
}

const s = {
  row: { display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', color: t.text, fontSize: 14, padding: '8px 0', width: '100%', textAlign: 'left', borderBottom: `1px solid ${t.border}`, borderRadius: 0 },
  clear: { display: 'flex', alignItems: 'center', gap: 8, color: t.textSecondary, fontSize: 14 },
};
