/**
 * MenuRail.js — a place's menu on phones: three rows of dishes you swipe to
 * the left, with category buttons above (All, Mains, Drinks…). The page
 * stays short however long the menu is. Tap a dish to add it to the table
 * booking (tap again to take it off).
 *   items     [{ id, name, price, category, photo_url }]
 *   selected  { [id]: { qty } }      onToggle(item)
 *   palette   the page's colours (navy for restaurants, espresso for cafés)
 */
import React, { useMemo, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing, radius, gutter } from '../../../theme';

const ROWS = 3;

export default function MenuRail({ items, selected, onToggle, palette: p, fallbackIcon = 'food-outline' }) {
  const { width } = useWindowDimensions();
  const [cat, setCat] = useState('All');
  const cats = useMemo(() => ['All', ...new Set(items.map((i) => i.category || 'Menu'))], [items]);
  const shown = cat === 'All' ? items : items.filter((i) => (i.category || 'Menu') === cat);

  // Dishes go top-to-bottom in threes, then the next column to the right.
  const columns = useMemo(() => {
    const out = [];
    for (let i = 0; i < shown.length; i += ROWS) out.push(shown.slice(i, i + ROWS));
    return out;
  }, [shown]);
  // A bit less than the screen, so the next column peeks in and invites a swipe.
  const colWidth = Math.min(Math.round(width * 0.74), 320);

  return (
    <View>
      {cats.length > 2 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {cats.map((c) => (
            <Pressable key={c} onPress={() => setCat(c)} style={[styles.chip, { backgroundColor: p.chipBg, borderColor: p.border }, cat === c && { backgroundColor: p.accent, borderColor: p.accent }]}>
              <Text style={[styles.chipText, { color: cat === c ? p.onAccent : p.textSoft }]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast" snapToInterval={colWidth + spacing.sm} contentContainerStyle={styles.rail}>
        {columns.map((col, ci) => (
          <View key={ci} style={[styles.column, { width: colWidth }]}>
            {col.map((item) => {
              const on = !!selected[item.id];
              return (
                <Pressable
                  key={item.id}
                  onPress={() => onToggle(item)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={[styles.card, { backgroundColor: p.card, borderColor: on ? p.accent : p.border }, on && styles.cardOn]}
                >
                  <View style={[styles.thumb, { backgroundColor: p.thumbBg }]}>
                    {item.photo_url
                      ? <Image source={{ uri: item.photo_url }} style={styles.thumbImg} resizeMode="cover" />
                      : <MaterialCommunityIcons name={fallbackIcon} size={24} color={p.icon} />}
                  </View>
                  <View style={styles.body}>
                    <Text style={[styles.name, { color: p.text }]} numberOfLines={2}>{item.name}</Text>
                    <Text style={[styles.price, { color: p.price }]}>{Number(item.price).toLocaleString()} RWF</Text>
                  </View>
                  <View style={[styles.add, { backgroundColor: on ? p.accent : p.chipBg, borderColor: on ? p.accent : p.border }]}>
                    <MaterialCommunityIcons name={on ? 'check' : 'plus'} size={16} color={on ? p.onAccent : p.icon} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
      {columns.length > 1 ? <Text style={[styles.hint, { color: p.textSoft }]}>Swipe for more →</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { paddingHorizontal: gutter, gap: spacing.sm, paddingBottom: spacing.md },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '700' },
  rail: { paddingHorizontal: gutter, gap: spacing.sm },
  column: { gap: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: radius.md, padding: 6, height: 72 },
  cardOn: { borderWidth: 2 },
  thumb: { width: 58, height: 58, borderRadius: radius.sm, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  thumbImg: { width: 58, height: 58 },
  body: { flex: 1, minWidth: 0 },
  name: { fontSize: 13.5, fontWeight: '600', marginBottom: 3 },
  price: { fontSize: 13, fontWeight: '700' },
  add: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 12, textAlign: 'right', paddingHorizontal: gutter, marginTop: spacing.sm },
});
