/**
 * Newsroom.jsx — today at a glance: reads, published today, waiting for
 * approval, trending; editorial alerts; quick actions; most-read articles.
 */
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Plus } from 'lucide-react';
import { t } from '../../../../theme';
import Button from '../../../../components/common/Button';
import { Panel, Kpi, KpiGrid, Loading, ErrorText, fmtNum } from '../../../../components/ui';
import { useNews } from '../../NewsContext';
import { fmtDate } from '../../constants';

const hoursSince = (d) => (d ? (Date.now() - new Date(d).getTime()) / 3600000 : 0);

export default function Newsroom() {
  const navigate = useNavigate();
  const { articles, stories, loading, error, categoryLabel } = useNews();

  const view = useMemo(() => {
    const today = new Date().toDateString();
    const live = articles.filter((a) => !a.isArchived);
    const pending = live.filter((a) => a.status === 'pending');
    const alerts = [];
    const stalePending = pending.filter((a) => hoursSince(a.publishedAt) > 4).length;
    if (stalePending) alerts.push(`${stalePending} article(s) waiting for approval for over 4 hours`);
    const staleBreaking = live.filter((a) => a.isBreaking && hoursSince(a.publishedAt) > 6).length;
    if (staleBreaking) alerts.push(`${staleBreaking} breaking flag(s) older than 6 hours — consider removing them`);
    const quietStories = stories.filter((st) => st.isLive).filter((st) => {
      const latest = Math.max(0, ...articles.filter((a) => a.storyId === st.id).map((a) => new Date(a.publishedAt).getTime()));
      return !latest || hoursSince(latest) > 3;
    }).length;
    if (quietStories) alerts.push(`${quietStories} live stor${quietStories > 1 ? 'ies have' : 'y has'} had no update in 3+ hours`);
    return {
      reads: articles.reduce((sum, a) => sum + (a.views || 0), 0),
      publishedToday: live.filter((a) => a.status === 'published' && new Date(a.publishedAt).toDateString() === today).length,
      pending: pending.length,
      trending: live.filter((a) => a.isTrending).length,
      alerts,
      top: live.filter((a) => a.status === 'published').sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 8),
    };
  }, [articles, stories]);

  if (loading) return <Loading />;
  const go = (p) => navigate(`/news/${p}`);

  return (
    <>
      <ErrorText>{error}</ErrorText>
      <KpiGrid>
        <Kpi label="Total reads" value={fmtNum(view.reads)} />
        <Kpi label="Published today" value={view.publishedToday} color={t.success} />
        <Kpi label="Waiting for approval" value={view.pending} color={t.warning} onClick={() => go('articles')} />
        <Kpi label="Trending now" value={view.trending} color="#E6B92E" />
      </KpiGrid>

      <div style={s.two}>
        <Panel title="Editorial alerts" style={{ marginBottom: 0 }}>
          {view.alerts.length ? view.alerts.map((a) => (
            <div key={a} style={s.alert}><AlertCircle size={15} color={t.warning} /> {a}</div>
          )) : <div style={s.clear}><CheckCircle2 size={18} color={t.success} /> All clear</div>}
        </Panel>
        <Panel title="Quick actions" style={{ marginBottom: 0 }}>
          <div style={s.quick}>
            <Button icon={Plus} onClick={() => go('write')}>New article</Button>
            <Button variant="warning" onClick={() => go('articles')}>Review pending</Button>
            <Button variant="info" onClick={() => go('stories')}>Live stories</Button>
            <Button variant="info" onClick={() => go('app-ads')}>Ads</Button>
          </div>
        </Panel>
      </div>

      <Panel title="Most read" style={{ marginTop: 20 }}>
        {view.top.length === 0 ? <div style={s.clear}>No published articles yet.</div> : view.top.map((a, i) => (
          <div key={a.id} style={s.topRow} onClick={() => navigate(`/news/write?id=${a.id}`)}>
            <span style={s.rank}>{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: t.text, fontWeight: 500 }}>{a.title}</div>
              <div style={{ color: t.textMuted, fontSize: 12 }}>{categoryLabel(a.category)} · {fmtDate(a.publishedAt)}</div>
            </div>
            <span style={{ color: t.inkAccent, fontWeight: 700 }}>{fmtNum(a.views)}</span>
          </div>
        ))}
      </Panel>
    </>
  );
}

const s = {
  two: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 },
  alert: { display: 'flex', alignItems: 'center', gap: 8, color: t.text, fontSize: 14, padding: '6px 0' },
  clear: { display: 'flex', alignItems: 'center', gap: 8, color: t.textSecondary, fontSize: 14 },
  quick: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  topRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${t.border}`, cursor: 'pointer' },
  rank: { color: t.textMuted, fontWeight: 800, fontSize: 18, width: 26 },
};
