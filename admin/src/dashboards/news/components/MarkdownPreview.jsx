/**
 * MarkdownPreview.jsx — renders the article body the way readers see it
 * (same subset as the app: # / ## headings, > quote, - bullets, ---,
 * **bold**, _italic_). Text is rendered as React nodes, never raw HTML.
 */
import React from 'react';
import { t } from '../../../theme';

function inline(text) {
  const out = [];
  const re = /(\*\*(.+?)\*\*|_(.+?)_)/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(m[0].startsWith('**') ? <b key={i++}>{m[2]}</b> : <i key={i++}>{m[3]}</i>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function MarkdownPreview({ text }) {
  if (!text?.trim()) return <div style={{ color: t.textMuted, fontSize: 13 }}>Nothing to preview yet.</div>;
  return (
    <div style={s.wrap}>
      {text.split('\n').map((line, i) => {
        if (/^---+$/.test(line.trim())) return <hr key={i} style={s.hr} />;
        if (line.startsWith('## ')) return <h3 key={i} style={s.h2}>{inline(line.slice(3))}</h3>;
        if (line.startsWith('# ')) return <h2 key={i} style={s.h1}>{inline(line.slice(2))}</h2>;
        if (line.startsWith('> ')) return <blockquote key={i} style={s.quote}>{inline(line.slice(2))}</blockquote>;
        if (/^[-*] /.test(line)) return <div key={i} style={s.bullet}>• {inline(line.slice(2))}</div>;
        if (!line.trim()) return <div key={i} style={{ height: 10 }} />;
        return <p key={i} style={s.p}>{inline(line)}</p>;
      })}
    </div>
  );
}

const s = {
  wrap: { color: 'rgba(210,228,248,0.92)', fontSize: 15, lineHeight: 1.65 },
  p: { margin: '0 0 8px' },
  h1: { color: '#fff', fontSize: 20, margin: '14px 0 6px' },
  h2: { color: '#fff', fontSize: 17, margin: '12px 0 5px' },
  quote: { borderLeft: `3px solid ${t.accent}`, margin: '8px 0', padding: '4px 12px', fontStyle: 'italic', background: 'rgba(56,189,248,0.06)' },
  bullet: { paddingLeft: 8, margin: '2px 0' },
  hr: { border: 'none', borderTop: `1px solid ${t.borderLight}`, margin: '14px 0' },
};
