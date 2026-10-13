/**
 * Stories.jsx — live stories group articles about one ongoing event into a
 * developing-coverage thread. End a story when coverage stops.
 */
import React, { useState } from 'react';
import { DataTable } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { Panel, ErrorText, RowActions } from '../../../../components/ui';
import { useNews } from '../../NewsContext';
import { newsApi } from '../../newsApi';
import { fmtDate } from '../../constants';
import StatusBadge from '../../components/StatusBadge';

export default function Stories() {
  const { stories, articles, changed, notify } = useNews();
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const updates = (id) => articles.filter((a) => a.storyId === id).length;

  const add = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try { await newsApi.createStory(title.trim()); setTitle(''); notify('Live story started'); changed(); }
    catch (err) { setError(err.message); }
  };
  const toggle = async (st) => {
    try { await newsApi.updateStory(st.id, { isLive: !st.isLive }); notify(st.isLive ? 'Story ended' : 'Story is live again'); changed(); }
    catch (err) { setError(err.message); }
  };
  const remove = async (st) => {
    if (!window.confirm(`Delete "${st.title}"? Its articles stay; they just stop being grouped.`)) return;
    try { await newsApi.deleteStory(st.id); notify('Story deleted'); changed(); }
    catch (err) { setError(err.message); }
  };

  const columns = [
    { key: 'title', label: 'Story', render: (st) => <span style={{ fontWeight: 500 }}>{st.title}</span> },
    { key: 'updates', label: 'Updates', render: (st) => updates(st.id) },
    { key: 'createdAt', label: 'Started', render: (st) => fmtDate(st.createdAt) },
    { key: 'isLive', label: 'Status', render: (st) => <StatusBadge status={st.isLive ? 'live' : 'ended'} /> },
    {
      key: 'a', label: '', render: (st) => (
        <RowActions>
          <Button size="sm" variant={st.isLive ? 'warning' : 'success'} onClick={() => toggle(st)}>{st.isLive ? 'End' : 'Reopen'}</Button>
          <Button size="sm" variant="danger" onClick={() => remove(st)}>Delete</Button>
        </RowActions>
      ),
    },
  ];

  return (
    <Panel title="Live stories">
      <ErrorText>{error}</ErrorText>
      <form onSubmit={add} style={{ display: 'flex', gap: 8, marginBottom: 16, maxWidth: 560 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Story headline, e.g. Amatora 2026" style={{ flex: 1 }} />
        <Button type="submit">Start story</Button>
      </form>
      <DataTable columns={columns} rows={stories} emptyText="No live stories yet. Start one, then attach articles to it from the editor." />
    </Panel>
  );
}
