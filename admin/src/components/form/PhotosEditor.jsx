/**
 * PhotosEditor.jsx — an ordered photo gallery: upload or paste each photo,
 * caption it, reorder, remove. value: [{ url, label }]
 */
import React from 'react';
import { ArrowUp, ArrowDown, X, Plus } from 'lucide-react';
import { t } from '../../theme';
import Button from '../common/Button';
import MediaUpload from './MediaUpload';

export default function PhotosEditor({ label = 'Photos', value = [], onChange }) {
  const set = (i, patch) => onChange(value.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const move = (i, d) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={s.label}>{label} {value.length > 0 && <span style={{ color: t.textMuted }}>· the first is the cover</span>}</span>
      {value.map((p, i) => (
        <div key={i} style={s.item}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <MediaUpload value={p.url} onChange={(url) => set(i, { url })} />
            <input value={p.label || ''} onChange={(e) => set(i, { label: e.target.value })} placeholder="Caption (optional)" />
          </div>
          <div style={s.tools}>
            <button type="button" disabled={i === 0} onClick={() => move(i, -1)} style={s.icon} title="Move up"><ArrowUp size={14} /></button>
            <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} style={s.icon} title="Move down"><ArrowDown size={14} /></button>
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} style={{ ...s.icon, color: t.danger }} title="Remove"><X size={14} /></button>
          </div>
        </div>
      ))}
      <div><Button type="button" size="sm" variant="info" icon={Plus} onClick={() => onChange([...value, { url: '', label: '' }])}>Add photo</Button></div>
    </div>
  );
}

const s = {
  label: { color: t.textSecondary, fontSize: 13, fontWeight: 500 },
  item: { display: 'flex', gap: 10, padding: 12, background: t.bg, borderRadius: 10 },
  tools: { display: 'flex', flexDirection: 'column', gap: 4 },
  icon: { background: 'transparent', color: t.textSecondary, padding: 6 },
};
