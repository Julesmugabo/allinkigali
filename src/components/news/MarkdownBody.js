/**
 * MarkdownBody.js — renders the small markdown subset the News editor
 * produces (# / ## headings, > quotes, - bullets, ---, **bold**, _italic_).
 * Shared by the phone article screen and the wide desktop one; `large`
 * bumps the type up for comfortable desktop reading. Drawn in the reading
 * page's colours (theme/reading.js): dark text on a light, paper-like page.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { spacing } from '../../theme';
import { reading } from '../../theme/reading';

function renderInline(text, baseStyle) {
  const parts = [];
  const re = /(\*\*(.+?)\*\*|_(.+?)_)/g;
  let last = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index), bold: false, italic: false });
    if (match[0].startsWith('**')) parts.push({ text: match[2], bold: true, italic: false });
    else parts.push({ text: match[3], bold: false, italic: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), bold: false, italic: false });
  if (parts.length === 1 && !parts[0].bold && !parts[0].italic) return null; // no inline markup
  return (
    <Text style={baseStyle}>
      {parts.map((p, i) => (
        <Text
          key={i}
          style={[p.bold && { fontWeight: '700', color: reading.heading }, p.italic && { fontStyle: 'italic' }]}
        >
          {p.text}
        </Text>
      ))}
    </Text>
  );
}

export default function MarkdownBody({ text, large = false }) {
  const md = large ? mdLarge : mdBase;

  const blocks = useMemo(() => {
    if (!text?.trim()) return [];
    return text.split('\n').reduce((acc, line) => {
      if (/^---+$/.test(line.trim())) acc.push({ type: 'hr' });
      else if (line.startsWith('## ')) acc.push({ type: 'h2', text: line.slice(3) });
      else if (line.startsWith('# ')) acc.push({ type: 'h1', text: line.slice(2) });
      else if (line.startsWith('> ')) acc.push({ type: 'quote', text: line.slice(2) });
      else if (/^[-*] /.test(line)) acc.push({ type: 'bullet', text: line.slice(2) });
      else if (line.trim() === '') acc.push({ type: 'blank' });
      else acc.push({ type: 'para', text: line });
      return acc;
    }, []);
  }, [text]);

  return (
    <View style={md.wrap}>
      {blocks.map((block, i) => {
        if (block.type === 'hr') return <View key={i} style={md.hr} />;
        if (block.type === 'blank') return <View key={i} style={{ height: large ? 14 : 10 }} />;
        if (block.type === 'h1') return renderInline(block.text, md.h1) || <Text key={i} style={md.h1}>{block.text}</Text>;
        if (block.type === 'h2') return renderInline(block.text, md.h2) || <Text key={i} style={md.h2}>{block.text}</Text>;
        if (block.type === 'quote') {
          return (
            <View key={i} style={md.quoteBlock}>
              {renderInline(block.text, md.quoteText) || <Text style={md.quoteText}>{block.text}</Text>}
            </View>
          );
        }
        if (block.type === 'bullet') {
          return (
            <View key={i} style={md.bulletRow}>
              <Text style={md.bulletDot}>{'•'}</Text>
              {renderInline(block.text, md.bulletText) || <Text style={md.bulletText}>{block.text}</Text>}
            </View>
          );
        }
        return renderInline(block.text, md.para) || <Text key={i} style={md.para}>{block.text}</Text>;
      })}
    </View>
  );
}

const shared = {
  hr: { height: StyleSheet.hairlineWidth, backgroundColor: reading.rule, marginVertical: 14 },
  quoteBlock: {
    borderLeftWidth: 3,
    borderLeftColor: reading.accent,
    paddingLeft: spacing.md,
    marginVertical: 8,
    backgroundColor: reading.accentSoft,
    borderRadius: 2,
    paddingVertical: 6,
  },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start' },
};

const mdBase = StyleSheet.create({
  ...shared,
  wrap: { marginBottom: spacing.xl },
  para: { fontSize: 15, lineHeight: 24, color: reading.text, marginBottom: 8 },
  h1: { fontSize: 20, fontWeight: '800', color: reading.heading, lineHeight: 26, marginTop: 16, marginBottom: 6 },
  h2: { fontSize: 17, fontWeight: '700', color: reading.heading, lineHeight: 23, marginTop: 14, marginBottom: 5 },
  quoteText: { fontSize: 14.5, lineHeight: 22, fontStyle: 'italic', color: reading.text },
  bulletRow: { ...shared.bulletRow, marginBottom: 5 },
  bulletDot: { fontSize: 16, color: reading.accent, marginRight: 8, lineHeight: 24 },
  bulletText: { flex: 1, fontSize: 14.5, lineHeight: 23, color: reading.text },
});

const mdLarge = StyleSheet.create({
  ...shared,
  wrap: { marginBottom: spacing.xl },
  para: { fontSize: 18, lineHeight: 30, color: reading.text, marginBottom: 12 },
  h1: { fontSize: 26, fontWeight: '800', color: reading.heading, lineHeight: 34, marginTop: 24, marginBottom: 8 },
  h2: { fontSize: 22, fontWeight: '700', color: reading.heading, lineHeight: 30, marginTop: 20, marginBottom: 6 },
  quoteText: { fontSize: 18, lineHeight: 28, fontStyle: 'italic', color: reading.text },
  bulletRow: { ...shared.bulletRow, marginBottom: 8 },
  bulletDot: { fontSize: 18, color: reading.accent, marginRight: 10, lineHeight: 30 },
  bulletText: { flex: 1, fontSize: 18, lineHeight: 29, color: reading.text },
});
