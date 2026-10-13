/**
 * Authors.jsx — bylines that can be put on articles: add, edit,
 * deactivate (hidden from the picker) and reactivate.
 */
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { DataTable } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { Panel, RowActions } from '../../../../components/ui';
import { useNews } from '../../NewsContext';
import { newsApi } from '../../newsApi';
import StatusBadge from '../../components/StatusBadge';
import AuthorModal from './AuthorModal';

export default function Authors() {
  const { authors, articles, changed, notify } = useNews();
  const [editing, setEditing] = useState(null); // {} = new, author = edit

  const setActive = async (au, active) => {
    if (!active && !window.confirm(`Deactivate ${au.name}? They won't appear in the byline picker. Past articles keep the byline.`)) return;
    try {
      if (active) await newsApi.updateAuthor(au.id, { isActive: true });
      else await newsApi.deactivateAuthor(au.id);
      notify(active ? 'Author reactivated' : 'Author deactivated'); changed();
    } catch (e) { alert(e.message); }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (a) => <span style={{ fontWeight: 500 }}>{a.name}</span> },
    { key: 'role', label: 'Role' },
    { key: 'email', label: 'Email', render: (a) => a.email || '—' },
    { key: 'articles', label: 'Articles', render: (a) => articles.filter((x) => x.authorId === a.id).length },
    { key: 'is_active', label: 'Status', render: (a) => <StatusBadge status={a.is_active ? 'active' : 'inactive'} /> },
    {
      key: 'x', label: '', render: (a) => (
        <RowActions>
          <Button size="sm" variant="info" onClick={() => setEditing(a)}>Edit</Button>
          {a.is_active
            ? <Button size="sm" variant="danger" onClick={() => setActive(a, false)}>Deactivate</Button>
            : <Button size="sm" variant="success" onClick={() => setActive(a, true)}>Reactivate</Button>}
        </RowActions>
      ),
    },
  ];

  return (
    <Panel title="Authors & bylines" actions={<Button icon={Plus} onClick={() => setEditing({})}>Add author</Button>}>
      <DataTable columns={columns} rows={authors} emptyText="No authors yet — add one to put bylines on articles." />
      {editing && <AuthorModal author={editing.id ? editing : null} onClose={() => setEditing(null)} />}
    </Panel>
  );
}
