/**
 * Articles.jsx — every article: status tabs, search, sort by reads,
 * select-to-archive, and per-row actions.
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Star, Zap, Archive, RotateCcw, Trash2, Check, X } from 'lucide-react';
import { t } from '../../../../theme';
import { DataTable, Tabs } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { Panel, Loading, ErrorText, RowActions } from '../../../../components/ui';
import { useNews } from '../../NewsContext';
import { ARTICLE_FILTERS, displayStatus, fmtDate } from '../../constants';
import StatusBadge from '../../components/StatusBadge';
import { articleActions } from './articleActions';

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
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [byReads, setByReads] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = articles.filter(match[filter]);
    if (q) list = list.filter((a) => `${a.title} ${a.source} ${categoryLabel(a.category)}`.toLowerCase().includes(q));
    return byReads ? [...list].sort((a, b) => (b.views || 0) - (a.views || 0)) : list;
  }, [articles, filter, search, byReads, categoryLabel]);

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
  const tabs = ARTICLE_FILTERS.map((f) => ({ ...f, count: articles.filter(match[f.key]).length }));

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
            {categoryLabel(a.category)} · {a.source || '—'} · {displayStatus(a) === 'scheduled' ? `goes live ${new Date(a.publishAt).toLocaleString('en-GB')}` : fmtDate(a.publishedAt)}
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
      <Tabs tabs={tabs} active={filter} onChange={(k) => { setFilter(k); setSelected(new Set()); }} />
      <div style={s.tools}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search headline, source or category" style={{ flex: 1, minWidth: 200, maxWidth: 380 }} />
        <label style={s.check}><input type="checkbox" checked={byReads} onChange={(e) => setByReads(e.target.checked)} /> Most read first</label>
        {selected.size > 0 && <Button variant="warning" icon={Archive} onClick={archiveSelected}>Archive {selected.size} selected</Button>}
      </div>
      <ErrorText>{error}</ErrorText>
      {loading ? <Loading /> : <DataTable columns={columns} rows={rows} emptyText="No articles here." />}
    </Panel>
  );
}

const s = {
  tools: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 },
  check: { display: 'flex', gap: 6, alignItems: 'center', color: t.textSecondary, fontSize: 13 },
};
