/**
 * EmptyResults.js — shown when nothing matches: says in plain words what
 * was asked for and offers one click to drop the last choice.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { radius, spacing } from '../../../theme';
import { useShopTheme, useShopStyles } from '../../../theme/shopThemes';

export default function EmptyResults({ icon, noun, summary, onUndo, onClear }) {
  const c = useShopTheme(); // eslint-disable-line no-unused-vars
  const styles = useShopStyles(makeStyles);
  return (
    <View style={styles.wrap}>
      <MaterialCommunityIcons name={icon} size={44} color={c.accentText} />
      <Text style={styles.title}>No {noun} match {summary ? `“${summary}”` : 'your search'}</Text>
      <Text style={styles.text}>Try removing a choice — there may be a close match.</Text>
      <View style={styles.actions}>
        {onUndo ? <Pressable onPress={onUndo} style={styles.primary}><Text style={styles.primaryLabel}>Remove last choice</Text></Pressable> : null}
        <Pressable onPress={onClear} style={styles.secondary}><Text style={styles.secondaryLabel}>Clear everything</Text></Pressable>
      </View>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.huge * 1.5, gap: 8 },
  title: { color: c.text, fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  text: { color: c.textMuted, fontSize: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: spacing.md },
  primary: { backgroundColor: c.accent, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 10 },
  primaryLabel: { color: c.text, fontWeight: '700' },
  secondary: { borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: c.borderStrong },
  secondaryLabel: { color: c.accentText, fontWeight: '600' },
});
