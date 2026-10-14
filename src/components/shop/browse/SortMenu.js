/**
 * SortMenu.js — "Sort: Recommended ▾" with a small drop-down list.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { radius } from '../../../theme';
import { useShopTheme, useShopStyles } from '../../../theme/shopThemes';

export default function SortMenu({ sorts, value, onChange }) {
  const c = useShopTheme(); // eslint-disable-line no-unused-vars
  const styles = useShopStyles(makeStyles);
  const [open, setOpen] = useState(false);
  const current = sorts.find((s) => s.key === value) || sorts[0];
  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.button} accessibilityRole="button">
        <Text style={styles.label}>Sort: <Text style={styles.value}>{current.label}</Text></Text>
        <MaterialCommunityIcons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={c.accentText} />
      </Pressable>
      {open && (
        <View style={styles.menu}>
          {sorts.map((s) => (
            <Pressable key={s.key} onPress={() => { setOpen(false); onChange(s.key); }}
              style={({ hovered }) => [styles.item, hovered && styles.itemHover]}>
              <Text style={[styles.itemLabel, s.key === value && styles.itemOn]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  wrap: { zIndex: 20 },
  button: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6 },
  label: { color: c.textMuted, fontSize: 13.5 },
  value: { color: c.text, fontWeight: '700' },
  menu: { position: 'absolute', top: 36, right: 0, minWidth: 190, backgroundColor: c.menu, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, paddingVertical: 6 },
  item: { paddingHorizontal: 14, paddingVertical: 9 },
  itemHover: { backgroundColor: c.surface },
  itemLabel: { color: c.textSoft, fontSize: 14 },
  itemOn: { color: c.text, fontWeight: '700' },
});
