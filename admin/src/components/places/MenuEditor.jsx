/**
 * MenuEditor.jsx — a place's menu, grouped by category: add, edit, mark
 * sold out / available, delete. Shared by the platform admin and the owner
 * dashboard; the caller supplies the save/delete functions.
 *   kind: 'restaurant' | 'coffeeshop' (coffee items also have brew method + origin)
 */
import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { t } from '../../theme';
import { DataTable, Badge } from '../PageShell';
import Modal, { ModalActions } from '../common/Modal';
import Button from '../common/Button';
import { FormGrid, Field, SelectField, TextAreaField } from '../form/Fields';
import MediaUpload from '../form/MediaUpload';
import { ErrorText, RowActions } from '../ui';

const CATEGORIES = {
  restaurant: ['Starters', 'Salads', 'Soups', 'Main', 'Mains', 'Pasta', 'Pizza', 'Burgers', 'Sandwiches', 'Sides', 'Desserts', 'Drinks', 'Breakfast', 'Brunch', 'Specials', 'Other'],
  coffeeshop: ['Espresso drinks', 'Filter & brewed', 'Cold drinks', 'Tea', 'Pastries', 'Food', 'Other'],
};

function ItemModal({ kind, item, onSave, onClose }) {
  const [form, setForm] = useState({
    category: item?.category || CATEGORIES[kind][kind === 'restaurant' ? 3 : 0], name: item?.name || '', description: item?.description || '',
    price: item?.price != null ? String(item.price) : '', photoUrl: item?.photo_url || item?.photoUrl || '',
    brewMethod: item?.brew_method || '', origin: item?.origin || '', available: item ? item.available !== false : true,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const save = async () => {
    if (!form.name.trim() || form.price === '') { setError('Name and price are required.'); return; }
    setSaving(true); setError('');
    try { await onSave(item, { ...form, price: Number(form.price) }); onClose(); } catch (e) { setError(e.message); }
    setSaving(false);
  };
  const cats = CATEGORIES[kind].includes(form.category) ? CATEGORIES[kind] : [form.category, ...CATEGORIES[kind]];
  return (
    <Modal open onClose={onClose} title={item ? 'Edit menu item' : 'Add menu item'} width={560}>
      <ErrorText>{error}</ErrorText>
      <FormGrid>
        <Field label="Name *" value={form.name} onChange={set('name')} />
        <Field label="Price (RWF) *" type="number" min="0" value={form.price} onChange={set('price')} />
        <SelectField label="Category" value={form.category} onChange={set('category')} options={cats.map((c) => ({ value: c, label: c }))} />
        {kind === 'coffeeshop' && <Field label="Brew method" value={form.brewMethod} onChange={set('brewMethod')} />}
        {kind === 'coffeeshop' && <Field label="Bean origin" value={form.origin} onChange={set('origin')} />}
        <TextAreaField label="Description" value={form.description} onChange={set('description')} rows={2} />
        <MediaUpload label="Photo" value={form.photoUrl} onChange={set('photoUrl')} />
      </FormGrid>
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
      </ModalActions>
    </Modal>
  );
}

export default function MenuEditor({ kind, items, onSave, onDelete, onToggle }) {
  const [editing, setEditing] = useState(null);
  const sorted = useMemo(() => [...items].sort((a, b) => String(a.category).localeCompare(String(b.category)) || String(a.name).localeCompare(String(b.name))), [items]);
  const columns = [
    { key: 'category', label: 'Category' },
    {
      key: 'name', label: 'Item', render: (i) => (
        <div>
          <div style={{ fontWeight: 500 }}>{i.name}</div>
          {(i.description || i.brew_method) && <div style={{ color: t.textMuted, fontSize: 12 }}>{[i.brew_method, i.origin, i.description].filter(Boolean).join(' · ')}</div>}
        </div>
      ),
    },
    { key: 'price', label: 'Price', render: (i) => `${Number(i.price).toLocaleString()} RWF` },
    { key: 'available', label: 'Status', render: (i) => <button onClick={() => onToggle(i)} style={{ background: 'transparent', padding: 0 }}><Badge color={i.available !== false ? t.success : t.danger}>{i.available !== false ? 'Available' : 'Sold out'}</Badge></button> },
    {
      key: 'a', label: '', render: (i) => (
        <RowActions>
          <Button size="sm" variant="info" onClick={() => setEditing(i)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => { if (window.confirm(`Remove ${i.name} from the menu?`)) onDelete(i); }}>Delete</Button>
        </RowActions>
      ),
    },
  ];
  return (
    <>
      <div style={{ marginBottom: 12 }}><Button icon={Plus} onClick={() => setEditing({})}>Add item</Button></div>
      <DataTable columns={columns} rows={sorted} emptyText="No menu items yet." />
      {editing && <ItemModal kind={kind} item={editing.id ? editing : null} onSave={onSave} onClose={() => setEditing(null)} />}
    </>
  );
}
