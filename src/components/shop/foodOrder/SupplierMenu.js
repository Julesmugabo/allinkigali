/**
 * SupplierMenu.js — a place's whole menu, built for long menus too: a
 * category index on the left (with counts; click to jump), search inside
 * the menu, "🔥 Popular" first (most ordered), then each category showing
 * 6 dishes with "Show all N". Dishes sit two per row.
 *
 * Where "+" puts a dish is up to the page: by default the Order Food cart;
 * a restaurant page passes `selection` to collect dishes for a table booking.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { radius, spacing } from '../../../theme';
import { useShopTheme, useShopStyles } from '../../../theme/shopThemes';
import { useFoodCart } from '../../../context/FoodCartContext';
import DishCard from './DishCard';

const SHORT = 6;
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-');
const jump = (id) => document.getElementById(`menu-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export default function SupplierMenu({ supplier, dishes, closed, onOpenDish, selection }) {
  const c = useShopTheme();
  const styles = useShopStyles(makeStyles);
  const cart = useFoodCart();
  const pick = selection || {
    qtyOf: (d) => cart.qtyOf(supplier.key, d.id),
    add: (d) => cart.addItem(supplier, d),
    setQty: (d, n) => cart.setQty(supplier.key, d.id, n),
  };
  const [q, setQ] = useState('');
  const [open, setOpen] = useState({}); // category → showing all
  const [active, setActive] = useState('popular');

  const { popular, sections } = useMemo(() => {
    const ranked = dishes.filter((d) => d.orders > 0).sort((a, b) => b.orders - a.orders).slice(0, SHORT);
    const byCat = new Map();
    dishes.forEach((d) => { if (!byCat.has(d.category)) byCat.set(d.category, []); byCat.get(d.category).push(d); });
    return { popular: ranked, sections: [...byCat.entries()] };
  }, [dishes]);
  const popularIds = new Set(popular.map((d) => d.id));
  const term = q.trim().toLowerCase();
  const found = term ? dishes.filter((d) => `${d.name} ${d.description}`.toLowerCase().includes(term)) : null;

  const grid = (list) => (
    <View style={styles.grid}>
      {list.map((d) => (
        <View key={d.id} style={styles.cell}>
          <DishCard dish={d} popular={popularIds.has(d.id)} closed={closed} qty={pick.qtyOf(d)}
            onOpen={() => onOpenDish(d)} onAdd={() => pick.add(d)}
            onChange={(n) => pick.setQty(d, n)} />
        </View>
      ))}
    </View>
  );
  const index = [...(popular.length ? [['popular', '🔥 Popular', popular.length]] : []), ...sections.map(([cat, list]) => [slug(cat), cat, list.length])];

  return (
    <View style={styles.wrap}>
      <View style={styles.index}>
        <View style={styles.search}>
          <MaterialCommunityIcons name="magnify" size={18} color={c.textMuted} />
          <TextInput value={q} onChangeText={setQ} placeholder="Search the menu" placeholderTextColor={c.textMuted} style={styles.input} />
        </View>
        {index.map(([id, label, n]) => (
          <Pressable key={id} onPress={() => { setQ(''); setActive(id); setTimeout(() => jump(id), 0); }} style={[styles.indexRow, active === id && styles.indexOn]}>
            <Text style={[styles.indexLabel, active === id && styles.indexLabelOn]} numberOfLines={1}>{label}</Text>
            <Text style={styles.count}>{n}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.dishes}>
        {!dishes.length ? <Text style={styles.empty}>{supplier.name} hasn't put its menu online yet. Call or WhatsApp them to order.</Text> : null}
        {found ? (
          <>
            <Text style={styles.sectionTitle}>{found.length} result{found.length === 1 ? '' : 's'} for “{q.trim()}”</Text>
            {grid(found)}
          </>
        ) : (
          <>
            {popular.length ? <View nativeID="menu-popular"><Text style={styles.sectionTitle}>🔥 Popular</Text>{grid(popular)}</View> : null}
            {sections.map(([cat, list]) => {
              const all = open[cat] || list.length <= SHORT;
              return (
                <View key={cat} nativeID={`menu-${slug(cat)}`} style={styles.section}>
                  <Text style={styles.sectionTitle}>{cat} <Text style={styles.count}>· {list.length}</Text></Text>
                  {grid(all ? list : list.slice(0, SHORT))}
                  {!all ? <Pressable onPress={() => setOpen((o) => ({ ...o, [cat]: true }))}><Text style={styles.more}>Show all {list.length} ▾</Text></Pressable> : null}
                </View>
              );
            })}
          </>
        )}
      </View>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  wrap: { flexDirection: 'row', gap: spacing.xl, alignItems: 'flex-start' },
  index: { width: 200, position: 'sticky', top: 16, gap: 2 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceAlt, paddingHorizontal: 10, height: 38, marginBottom: 8 },
  input: { flex: 1, color: c.text, fontSize: 13.5, outlineStyle: 'none' },
  indexRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  indexOn: { backgroundColor: c.accentSoft, borderLeftColor: c.accent },
  indexLabel: { flex: 1, color: c.textSoft, fontSize: 14 },
  indexLabelOn: { color: c.text, fontWeight: '700' },
  count: { color: c.textMuted, fontSize: 12.5, fontWeight: '400' },
  dishes: { flex: 1, minWidth: 0 },
  section: { marginTop: spacing.lg, scrollMarginTop: 16 },
  sectionTitle: { color: c.text, fontSize: 19, fontWeight: '800', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  cell: { width: '50%', padding: 6 },
  more: { color: c.accentText, fontWeight: '700', marginTop: 6, marginLeft: 6 },
  empty: { color: c.textSoft, fontSize: 15 },
});
