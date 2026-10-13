/**
 * EditorToolbar.jsx — markdown formatting buttons for the article body.
 * Works on the textarea's current selection; a second click on an already
 * formatted selection/line removes the formatting.
 */
import React from 'react';
import { Bold, Italic, Heading2, Quote, List, Minus } from 'lucide-react';
import { t } from '../../../../theme';

const TOOLS = [
  { key: 'bold', icon: Bold, title: 'Bold', wrap: ['**', '**'], placeholder: 'bold text' },
  { key: 'italic', icon: Italic, title: 'Italic', wrap: ['_', '_'], placeholder: 'italic text' },
  { key: 'h2', icon: Heading2, title: 'Heading', prefix: '## ', placeholder: 'Heading' },
  { key: 'quote', icon: Quote, title: 'Quote', prefix: '> ', placeholder: 'Quote' },
  { key: 'bullet', icon: List, title: 'List item', prefix: '- ', placeholder: 'List item' },
  { key: 'divider', icon: Minus, title: 'Divider', insert: '\n---\n' },
];

export function applyTool(body, start, end, tool) {
  const selected = body.slice(start, end);
  if (tool.insert) {
    return { body: body.slice(0, start) + tool.insert + body.slice(end), cursor: start + tool.insert.length };
  }
  if (tool.wrap) {
    const [open, close] = tool.wrap;
    if (selected && body.slice(start - open.length, start) === open && body.slice(end, end + close.length) === close) {
      return { body: body.slice(0, start - open.length) + selected + body.slice(end + close.length), cursor: end - open.length };
    }
    const text = selected || tool.placeholder;
    return { body: body.slice(0, start) + open + text + close + body.slice(end), cursor: start + open.length + text.length };
  }
  const lineStart = body.lastIndexOf('\n', start - 1) + 1;
  const lineEndIdx = body.indexOf('\n', start);
  const lineEnd = lineEndIdx === -1 ? body.length : lineEndIdx;
  const line = body.slice(lineStart, lineEnd);
  if (line.startsWith(tool.prefix)) {
    return { body: body.slice(0, lineStart) + line.slice(tool.prefix.length) + body.slice(lineEnd), cursor: Math.max(lineStart, start - tool.prefix.length) };
  }
  if (!selected && line.trim() === '') {
    return { body: body.slice(0, lineStart) + tool.prefix + tool.placeholder + body.slice(lineEnd), cursor: lineStart + tool.prefix.length + tool.placeholder.length };
  }
  return { body: body.slice(0, lineStart) + tool.prefix + body.slice(lineStart), cursor: end + tool.prefix.length };
}

export default function EditorToolbar({ textareaRef, body, setBody }) {
  const run = (tool) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    const next = applyTool(body, start, end, tool);
    setBody(next.body);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(next.cursor, next.cursor);
    });
  };
  return (
    <div style={s.bar}>
      {TOOLS.map((tool) => (
        <button key={tool.key} type="button" title={tool.title} onMouseDown={(e) => e.preventDefault()} onClick={() => run(tool)} style={s.btn}>
          <tool.icon size={15} />
        </button>
      ))}
    </div>
  );
}

const s = {
  bar: { display: 'flex', gap: 4, padding: 6, background: t.bg, borderRadius: '8px 8px 0 0', border: `1px solid ${t.borderLight}`, borderBottom: 'none' },
  btn: { background: 'transparent', color: t.textSecondary, padding: '6px 9px', borderRadius: 6 },
};
