/**
 * Checklist.jsx — what's still missing before an article should go out.
 */
import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { t } from '../../../../theme';

export function checklistItems({ title, category, source, body, imageUrl }) {
  return [
    { label: 'Headline written', ok: title.trim().length > 0 },
    { label: 'Category chosen', ok: !!category },
    { label: 'Body written (50+ characters)', ok: body.trim().length > 50 },
    { label: 'Source named', ok: source.trim().length > 0 },
    { label: 'Cover photo added', ok: !!imageUrl },
  ];
}

export default function Checklist(props) {
  const items = checklistItems(props);
  const done = items.every((i) => i.ok);
  return (
    <div style={s.wrap}>
      <div style={{ ...s.title, color: done ? t.success : t.text }}>{done ? 'Ready to publish' : 'Before you publish'}</div>
      {items.map((i) => (
        <div key={i.label} style={s.row}>
          {i.ok ? <CheckCircle2 size={15} color={t.success} /> : <Circle size={15} color={t.textMuted} />}
          <span style={{ color: i.ok ? t.textSecondary : t.text }}>{i.label}</span>
        </div>
      ))}
    </div>
  );
}

const s = {
  wrap: { background: t.bgCard, borderRadius: 12, padding: 16 },
  title: { fontWeight: 700, fontSize: 14, marginBottom: 8 },
  row: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '3px 0' },
};
