/**
 * Articles.jsx — articles one day at a time (today first; any day, or all
 * days, from the day picker), with status tabs, search, sort by reads,
 * select-to-archive, and per-row actions. The day and tab live in the
 * address (?day=2026-10-16&tab=pending, or day=all) so other pages can
 * link straight to a list.
 */
import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Star, Zap, Archive, RotateCcw, Trash2, Check, X } from 'lucide-react';
import { t } from '../../../../theme';
import { DataTable, Tabs } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { Panel, Loading, ErrorText, RowActions } from '../../../../components/ui';
import { useNews } from '../../NewsContext';
import { ARTICLE_FILTERS, displayStatus, fmtDate } from '../../constants';
import StatusBadge from '../../components/StatusBadge';
import { articleActions } from './articleActions';
import DayPicker from './DayPicker';
import { articleDay, articleTime, clock, dayLabel, isDayKey, todayKey } from './articleDays';

const match = {
  all: (a) => !a.isArchived,
  published: (a) => a.status === 'published' && !a.isArchived,
  drafts: (a) => displayStatus(a) === 'draft',
  pending: (a) => a.status === 'pending' && !a.isArchived,
  scheduled: (a) => displayStatus(a) === 'scheduled',
  rejected: (a) => a.status === 'rejected' && !a.isArchived,
  archived: (a) => a.isArchived,
};

export default function Articles() {
  const navigate = useNavigate();
  const { articles, loading, error, categoryLabel, changed, notify } = useNews();
  const [params, setParams] = useSearchParams();
  const day = params.get('day') === 'all' ? 'all' : isDayKey(params.get('day')) ? params.get('day') : todayKey();
  const filter = match[params.get('tab')] ? params.get('tab') : 'all';
  const [search, setSearch] = useState('');
  const [byReads, setByReads] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(null);

  const setParam = (key, value) => {
    setParams((cur) => { const next = new URLSearchParams(cur); next.set(key, value); return next; }, { replace: true });
    setSelected(new Set());
  };

  const inDay = (a) => day === 'all' || articleDay(a) === day;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = articles.filter((a) => match[filter](a) && inDay(a));
    if (q) list = list.filter((a) => `${a.title} ${a.source} ${categoryLabel(a.category)}`.toLowerCase().includes(q));
    const newest = (a, b) => new Date(articleTime(b)) - new Date(articleTime(a));
    return [...list].sort(byReads ? (a, b) => (b.views || 0) - (a.views || 0) : newest);
  }, [articles, filter, day, search, byReads, categoryLabel]);

  // How many articles of the open tab each day has, for the day picker.
  const dayCounts = useMemo(() => {
    const counts = new Map();
    articles.filter(match[filter]).forEach((a) => { const k = articleDay(a); if (k) counts.set(k, (counts.get(k) || 0) + 1); });
    return counts;
  }, [articles, filter]);

  const run = async (name, a) => {
    if (name === 'remove' && !window.confirm(`Delete "${a.title}" permanently?`)) return;
    setBusy(a.id);
    try { notify(await articleActions[name](a)); changed(); } catch (e) { alert(e.message); }
    setBusy(null);
  };

  const archiveSelected = async () => {
    if (!window.confirm(`Archive ${selected.size} article(s)? They disappear for readers but can be restored.`)) return;
    try {
      await Promise.all(rows.filter((a) => selected.has(a.id)).map((a) => articleActions.archive(a)));
      notify(`${selected.size} article(s) archived`); setSelected(new Set()); changed();
    } catch (e) { alert(e.message); }
  };

  const toggle = (id) => setSelected((cur) => { const n = new Set(cur); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const tabs = ARTICLE_FILTERS.map((f) => ({ ...f, count: articles.filter((a) => match[f.key](a) && inDay(a)).length }));
  const when = (a) => {
    if (displayStatus(a) === 'scheduled') return `goes live ${day === 'all' ? new Date(a.publishAt).toLocaleString('en-GB') : clock(a.publishAt)}`;
    const at = articleTime(a);
    const word = a.status === 'published' ? '' : 'written ';
    return day === 'all' ? `${word}${fmtDate(at)}` : `${word}${clock(at)}`;
  };

  const columns = [
    { key: 'sel', label: '', width: 30, render: (a) => (a.isArchived ? null : <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggle(a.id)} />) },
    {
      key: 'title', label: 'Article', render: (a) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {a.isFeatured && <Star size={13} color="#F5C518" fill="#F5C518" style={{ marginRight: 5, verticalAlign: -2 }} />}
            {a.isBreaking && <Zap size={13} color={t.danger} fill={t.danger} style={{ marginRight: 5, verticalAlign: -2 }} />}
            {a.title}
          </div>
          <div style={{ color: t.textMuted, fontSize: 12 }}>
            {categoryLabel(a.category)} · {a.source || '—'} · {when(a)}
          </div>
        </div>
      ),
    },
    { key: 'views', label: 'Reads', render: (a) => (a.views || 0).toLocaleString() },
    { key: 'status', label: 'Status', render: (a) => <StatusBadge status={displayStatus(a)} /> },
    {
      key: 'actions', label: '', render: (a) => (
        <RowActions>
          <Button size="sm" variant="info" icon={Pencil} onClick={() => navigate(`/news/write?id=${a.id}`)}>Edit</Button>
          {a.status === 'pending' && <Button size="sm" variant="success" icon={Check} disabled={busy === a.id} onClick={() => run('approve', a)}>Approve</Button>}
          {a.status === 'pending' && <Button size="sm" variant="danger" icon={X} disabled={busy === a.id} onClick={() => run('reject', a)}>Reject</Button>}
          {a.status === 'published' && !a.isArchived && (
            <>
              <Button size="sm" variant="ghost" icon={Star} disabled={busy === a.id} onClick={() => run('feature', a)}>{a.isFeatured ? 'Unfeature' : 'Feature'}</Button>
              <Button size="sm" variant="ghost" icon={Zap} disabled={busy === a.id} onClick={() => run('breaking', a)}>{a.isBreaking ? 'Not breaking' : 'Breaking'}</Button>
            </>
          )}
          {a.isArchived
            ? <Button size="sm" variant="ghost" icon={RotateCcw} disabled={busy === a.id} onClick={() => run('restore', a)}>Restore</Button>
            : <Button size="sm" variant="ghost" icon={Archive} disabled={busy === a.id} onClick={() => run('archive', a)}>Archive</Button>}
          <Button size="sm" variant="danger" icon={Trash2} disabled={busy === a.id} onClick={() => run('remove', a)} />
        </RowActions>
      ),
    },
  ];

  return (
    <Panel title="Articles" actions={<Button icon={Plus} onClick={() => navigate('/news/write')}>New article</Button>}>
      <DayPicker day={day} onChange={(k) => setParam('day', k)} counts={dayCounts} total={articles.filter(match[filter]).length} />
      <Tabs tabs={tabs} active={filter} onChange={(k) => setParam('tab', k)} />
      <div style={s.tools}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={day === 'all' ? 'Search all articles' : 'Search this day'} style={{ flex: 1, minWidth: 200, maxWidth: 380 }} />
        <label style={s.check}><input type="checkbox" checked={byReads} onChange={(e) => setByReads(e.target.checked)} /> Most read first</label>
        {selected.size > 0 && <Button variant="warning" icon={Archive} onClick={archiveSelected}>Archive {selected.size} selected</Button>}
      </div>
      <ErrorText>{error}</ErrorText>
      {loading ? <Loading /> : <DataTable columns={columns} rows={rows} emptyText={day === 'all' ? 'No articles here.' : `Nothing here for ${dayLabel(day)}. Pick another day above.`} />}
    </Panel>
  );
}

const s = {
  tools: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 },
  check: { display: 'flex', gap: 6, alignItems: 'center', color: t.textSecondary, fontSize: 13 },
};
