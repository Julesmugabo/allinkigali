/**
 * ChipRow.js — a sideways-scrolling row of one-click chips (cuisines,
 * moments…). Active chips are filled; clicking toggles.
 */
import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../../../theme';

export default function ChipRow({ chips, active, onToggle }) {
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

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  chip: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(133,183,235,0.3)', paddingHorizontal: 14, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.05)' },
  hover: { borderColor: 'rgba(133,183,235,0.7)' },
  on: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  label: { color: colors.textOnNavy, fontSize: 13.5, fontWeight: '600' },
  labelOn: { color: colors.white },
});
