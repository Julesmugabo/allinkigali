/**
 * boxStyles.js — shared look for the boxes in the place page's action column.
 */
import { StyleSheet } from 'react-native';
import { radius } from '../../../../theme';

export const makeBoxStyles = (c) => StyleSheet.create({
  card: { backgroundColor: c.panel, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, padding: 18, gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: c.text, fontSize: 17, fontWeight: '800' },
  label: { color: c.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },
  muted: { color: c.textMuted, fontSize: 13.5, lineHeight: 20 },
  input: { color: c.text, borderRadius: radius.sm, borderWidth: 1, borderColor: c.border, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, outlineStyle: 'none' },
  error: { color: '#F87171', fontSize: 13 },
  primary: { backgroundColor: c.cta, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  primaryLabel: { color: c.ctaText, fontWeight: '800', fontSize: 15 },
});
