/**
 * SectionsPanel.jsx — the room's sections (Inside, Terrace, VIP…). Optional:
 * they group tables on the waiter board, and a waiter can be given a section
 * in Team › Staff so their board opens on it.
 */
import React, { useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { t } from '../../../theme';
import { Panel } from '../../../components/ui';
import Button from '../../../components/common/Button';

export default function SectionsPanel({ sections, run, api }) {
  const [name, setName] = useState('');
  const add = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    run(() => api.addSection(name.trim()), 'Section added').then((ok) => ok && setName(''));
  };
  const rename = (sec) => {
    const next = window.prompt('New name for this section', sec.name);
    if (next && next.trim() && next.trim() !== sec.name) run(() => api.renameSection(sec.id, next.trim()), 'Renamed');
  };
  const remove = (sec) => {
    if (window.confirm(`Remove the section "${sec.name}"? Its tables stay, without a section.`)) run(() => api.deleteSection(sec.id), 'Section removed');
  };
  return (
    <Panel title="1 · Sections (optional)">
      <div style={s.row}>
        {sections.map((sec) => (
          <span key={sec.id} style={s.chip}>
            {sec.name}
            <button type="button" onClick={() => rename(sec)} style={s.icon} aria-label={`Rename ${sec.name}`}><Pencil size={13} /></button>
            <button type="button" onClick={() => remove(sec)} style={s.icon} aria-label={`Remove ${sec.name}`}><X size={14} /></button>
          </span>
        ))}
        {!sections.length && <span style={s.muted}>No sections. Fine for a small place — or add e.g. "Inside" and "Terrace".</span>}
      </div>
      <form onSubmit={add} style={s.add}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Terrace" maxLength={40} style={{ flex: 1, minWidth: 160 }} />
        <Button type="submit" variant="info">Add section</Button>
      </form>
    </Panel>
  );
}

const s = {
  row: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 4, background: t.bg, border: `1px solid ${t.borderLight}`, borderRadius: 20, padding: '4px 6px 4px 12px', fontSize: 14, fontWeight: 600 },
  icon: { background: 'transparent', color: t.textMuted, padding: 4, display: 'inline-flex' },
  muted: { color: t.textMuted, fontSize: 13 },
  add: { display: 'flex', gap: 8, flexWrap: 'wrap' },
};
