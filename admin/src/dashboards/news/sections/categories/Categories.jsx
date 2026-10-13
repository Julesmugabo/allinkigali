/**
 * Categories.jsx — the reader app's category tabs: add, rename (applies
 * live in the app), delete when no article uses it.
 */
import React, { useState } from 'react';
import { DataTable } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { Panel, ErrorText, RowActions } from '../../../../components/ui';
import { useNews } from '../../NewsContext';
import { newsApi } from '../../newsApi';
import { slugify } from '../../constants';

export default function Categories() {
  const { categories, articles, changed, notify } = useNews();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [renaming, setRenaming] = useState(null); // { key, label }

  const count = (key) => articles.filter((a) => a.category === key).length;

  const add = async (e) => {
    e.preventDefault();
    const label = name.trim();
    const key = slugify(label);
    if (!label || !key) return;
    if (categories.some((c) => c.key === key)) { setError(`"${label}" already exists.`); return; }
    setError('');
    try { await newsApi.createCategory(key, label); setName(''); notify('Category added'); changed(); }
    catch (err) { setError(err.message); }
  };

  const saveRename = async () => {
    if (!renaming.label.trim()) return;
    try { await newsApi.renameCategory(renaming.key, renaming.label.trim()); setRenaming(null); notify('Category renamed'); changed(); }
    catch (err) { setError(err.message); }
  };

  const remove = async (c) => {
    if (count(c.key)) { setError(`"${c.label}" still has ${count(c.key)} article(s). Move or delete them first.`); return; }
    if (!window.confirm(`Delete the category "${c.label}"?`)) return;
    try { await newsApi.deleteCategory(c.key); notify('Category deleted'); changed(); }
    catch (err) { setError(err.message); }
  };

  const columns = [
    {
      key: 'label', label: 'Category', render: (c) => (renaming?.key === c.key
        ? <input autoFocus value={renaming.label} onChange={(e) => setRenaming({ ...renaming, label: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setRenaming(null); }} />
        : <span style={{ fontWeight: 500 }}>{c.label}</span>),
    },
    { key: 'key', label: 'Key' },
    { key: 'count', label: 'Articles', render: (c) => count(c.key) },
    {
      key: 'a', label: '', render: (c) => (
        <RowActions>
          {renaming?.key === c.key
            ? <><Button size="sm" variant="success" onClick={saveRename}>Save</Button><Button size="sm" variant="ghost" onClick={() => setRenaming(null)}>Cancel</Button></>
            : <Button size="sm" variant="info" onClick={() => setRenaming({ key: c.key, label: c.label })}>Rename</Button>}
          <Button size="sm" variant="danger" onClick={() => remove(c)}>Delete</Button>
        </RowActions>
      ),
    },
  ];

  return (
    <Panel title="Categories">
      <ErrorText>{error}</ErrorText>
      <form onSubmit={add} style={{ display: 'flex', gap: 8, marginBottom: 16, maxWidth: 480 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name, e.g. Ubuzima" style={{ flex: 1 }} />
        <Button type="submit">Add</Button>
      </form>
      <DataTable columns={columns} rows={categories.map((c) => ({ id: c.key, ...c }))} emptyText="No categories yet." />
    </Panel>
  );
}
