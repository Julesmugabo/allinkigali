/**
 * TablesPanel.jsx — the tables: add one ("Terrace 2") or several at once
 * (Table 1…10), move a table to a section, rename it, switch it off, print
 * its card, or give it a new code if a card was copied or lost (the old
 * printed code stops working at once).
 */
import React, { useState } from 'react';
import { t } from '../../../theme';
import { Panel, RowActions } from '../../../components/ui';
import { DataTable, Badge } from '../../../components/PageShell';
import Button from '../../../components/common/Button';

export default function TablesPanel({ tables, sections, run, api, onPrint }) {
  const [label, setLabel] = useState('');
  const [count, setCount] = useState(10);
  const [sectionId, setSectionId] = useState('');
  const sectionName = (id) => sections.find((x) => x.id === id)?.name || '—';

  const addOne = (e) => {
    e.preventDefault();
    if (!label.trim()) return;
    run(() => api.addTables({ label: label.trim(), sectionId: sectionId || null }), 'Table added').then((ok) => ok && setLabel(''));
  };
  const addMany = () => run(() => api.addTables({ count: Number(count), sectionId: sectionId || null }), `${count} tables added`);
  const rename = (tb) => {
    const next = window.prompt('New name for this table', tb.label);
    if (next && next.trim() && next.trim() !== tb.label) run(() => api.updateTable(tb.id, { label: next.trim() }), 'Renamed');
  };
  const rotate = (tb) => {
    if (window.confirm(`Give ${tb.label} a new code? The card on the table now stops working — print the new one.`)) run(() => api.rotateTable(tb.id), 'New code made — print the new card');
  };

  const columns = [
    { key: 'label', label: 'Table', render: (tb) => <b style={{ opacity: tb.active ? 1 : 0.5 }}>{tb.label}</b> },
    {
      key: 'section', label: 'Section', render: (tb) => (sections.length ? (
        <select value={tb.sectionId || ''} onChange={(e) => run(() => api.updateTable(tb.id, { sectionId: e.target.value || null }), 'Moved')} style={{ padding: '6px 8px' }}>
          <option value="">No section</option>
          {sections.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      ) : sectionName(tb.sectionId)),
    },
    { key: 'code', label: 'Code to type', render: (tb) => <span style={s.code}>{tb.shortCode}</span> },
    { key: 'active', label: 'Status', render: (tb) => <Badge color={tb.active ? t.success : t.textMuted}>{tb.active ? 'in use' : 'switched off'}</Badge> },
    {
      key: 'a', label: '', render: (tb) => (
        <RowActions>
          {tb.active && <Button size="sm" variant="info" onClick={() => onPrint([tb])}>Print card</Button>}
          <Button size="sm" variant="ghost" onClick={() => rename(tb)}>Rename</Button>
          {tb.active && <Button size="sm" variant="warning" onClick={() => rotate(tb)}>New code</Button>}
          <Button size="sm" variant={tb.active ? 'danger' : 'success'} onClick={() => run(() => api.updateTable(tb.id, { active: !tb.active }), tb.active ? 'Switched off' : 'Back in use')}>
            {tb.active ? 'Switch off' : 'Switch on'}
          </Button>
        </RowActions>
      ),
    },
  ];

  return (
    <Panel title="2 · Tables">
      <div style={s.adders}>
        <form onSubmit={addOne} style={s.adder}>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Table name, e.g. Terrace 2" maxLength={30} style={{ flex: 1, minWidth: 170 }} />
          <Button type="submit" variant="info">Add table</Button>
        </form>
        <div style={s.adder}>
          <span style={s.muted}>or add</span>
          <input type="number" min={1} max={50} value={count} onChange={(e) => setCount(Math.min(50, Math.max(1, Number(e.target.value) || 1)))} style={{ width: 76 }} />
          <Button variant="info" onClick={addMany}>tables at once</Button>
        </div>
        {sections.length > 0 && (
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={{ minWidth: 150 }}>
            <option value="">…with no section</option>
            {sections.map((x) => <option key={x.id} value={x.id}>…in {x.name}</option>)}
          </select>
        )}
      </div>
      <DataTable columns={columns} rows={tables} emptyText="No tables yet. Add them above — it takes a minute." />
    </Panel>
  );
}

const s = {
  adders: { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 16 },
  adder: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  muted: { color: t.textMuted, fontSize: 13 },
  code: { fontFamily: 'ui-monospace, Consolas, monospace', fontWeight: 700, letterSpacing: 1.5, color: t.text, background: 'rgba(55,138,221,0.22)', borderRadius: 6, padding: '2px 8px' },
};
