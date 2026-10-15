/**
 * Analytics.jsx — reads by publish day, top articles, and reads per
 * category and per author.
 */
import React, { useEffect, useState } from 'react';
import { t } from '../../../../theme';
import { Panel, Kpi, KpiGrid, Loading, ErrorText, fmtNum } from '../../../../components/ui';
import { useNews } from '../../NewsContext';
import { newsApi } from '../../newsApi';
import { fmtDate } from '../../constants';
import BarList from '../../../../components/ui/BarList';

const RANGES = [7, 30, 90];

export default function Analytics() {
  const { articles, categoryLabel } = useNews();
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    setData(null);
    Promise.all([newsApi.viewsByDay(days), newsApi.topArticles(10), newsApi.byCategory(), newsApi.byAuthor()])
      .then(([byDay, top, cats, auths]) => live && setData({ byDay, top, cats, auths }))
      .catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, [days]);

  const published = articles.filter((a) => a.status === 'published' && !a.isArchived);
  return (
    <>
      <KpiGrid>
        <Kpi label="Total reads" value={fmtNum(articles.reduce((sum, a) => sum + (a.views || 0), 0))} />
        <Kpi label="Published articles" value={published.length} color={t.success} />
        <Kpi label="Average reads per article" value={fmtNum(published.length ? Math.round(published.reduce((s2, a) => s2 + (a.views || 0), 0) / published.length) : 0)} color="#E6B92E" />
      </KpiGrid>
      <ErrorText>{error}</ErrorText>
      <div style={s.chips}>
        {RANGES.map((d) => (
          <button key={d} onClick={() => setDays(d)} style={{ ...s.chip, ...(days === d ? s.chipOn : {}) }}>Last {d} days</button>
        ))}
      </div>
      {!data ? <Loading /> : (
        <>
          <Panel title={`Reads of articles published per day (last ${days} days)`}>
            <BarList rows={data.byDay.map((d) => ({ key: d.day, label: fmtDate(d.day), value: Number(d.views || 0) }))} empty="No articles published in this range." />
          </Panel>
          <Panel title="Top articles">
            <BarList rows={data.top.map((a) => ({ key: a.id, label: a.title, value: Number(a.views || 0) }))} />
          </Panel>
          <div style={s.two}>
            <Panel title="By category" style={{ marginBottom: 0 }}>
              <BarList color="#2DD4BF" rows={data.cats.map((c) => ({ key: c.category, label: `${categoryLabel(c.category)} (${c.articles})`, value: Number(c.total_views || 0) }))} />
            </Panel>
            <Panel title="By author" style={{ marginBottom: 0 }}>
              <BarList color="#E6B92E" empty="Put bylines on articles to see author performance."
                rows={data.auths.map((a) => ({ key: a.id, label: `${a.name} (${a.articles})`, value: Number(a.total_views || 0) }))} />
            </Panel>
          </div>
        </>
      )}
    </>
  );
}

const s = {
  chips: { display: 'flex', gap: 6, marginBottom: 16 },
  chip: { padding: '6px 12px', borderRadius: 20, fontSize: 13, background: t.bgCard, color: t.textSecondary },
  chipOn: { background: t.bgActive, color: t.inkAccent },
  two: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 },
};
