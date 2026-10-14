/**
 * ChipRow.js — a sideways-scrolling row of one-click chips (cuisines,
 * moments…). Active chips are filled; clicking toggles.
 */
import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { useShopTheme, useShopStyles } from '../../../theme/shopThemes';

export default function ChipRow({ chips, active, onToggle }) {
  const c = useShopTheme(); // eslint-disable-line no-unused-vars
  const styles = useShopStyles(makeStyles);
  if (!chips.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {chips.map((c) => {
        const on = active.includes(c.key);
        return (
          <Pressable key={c.key} onPress={() => onToggle(c.key)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
            style={({ hovered }) => [styles.chip, hovered && styles.hover, on && styles.on]}>
            <Text style={[styles.label, on && styles.labelOn]}>{c.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = (c) => StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  chip: { borderRadius: 20, borderWidth: 1, borderColor: c.borderStrong, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: c.surface },
  hover: { borderColor: c.borderStrong },
  on: { backgroundColor: c.accent, borderColor: c.accent },
  label: { color: c.textSoft, fontSize: 13.5, fontWeight: '600' },
  labelOn: { color: c.text },
});
