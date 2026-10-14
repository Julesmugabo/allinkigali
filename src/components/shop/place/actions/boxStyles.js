/**
 * boxStyles.js — shared look for the boxes in the place page's action column.
 */
import { StyleSheet } from 'react-native';
import { colors, radius } from '../../../../theme';

export const box = StyleSheet.create({
  card: { backgroundColor: 'rgba(11,46,82,0.92)', borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(133,183,235,0.22)', padding: 18, gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: colors.white, fontSize: 17, fontWeight: '800' },
  label: { color: colors.textOnNavyFaint, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },
  muted: { color: colors.textOnNavyFaint, fontSize: 13.5, lineHeight: 20 },
  input: { color: colors.white, borderRadius: radius.sm, borderWidth: 1, borderColor: 'rgba(133,183,235,0.25)', paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, outlineStyle: 'none' },
  error: { color: '#F87171', fontSize: 13 },
  primary: { backgroundColor: '#1A7A4A', borderRadius: radius.md, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  primaryLabel: { color: colors.white, fontWeight: '800', fontSize: 15 },
});
