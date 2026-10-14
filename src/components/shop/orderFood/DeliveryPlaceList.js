/**
 * DeliveryPlaceList.js — left column of the wide Order Food page: every
 * place that delivers, with search, cuisine chips and a sort (fastest,
 * cheapest delivery, top rated). The chosen place is highlighted.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Image, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, spacing } from '../../../theme';
import { isOpen, coverOf } from '../../../screens/shop/home/useDiscoverData';
import { rwf } from '../place/MenuSection';

const SORTS = [
  { key: 'fast', label: 'Fastest', by: (a, b) => minutes(a) - minutes(b) },
  { key: 'fee', label: 'Lowest fee', by: (a, b) => (a.deliveryFee || 0) - (b.deliveryFee || 0) },
  { key: 'rating', label: 'Top rated', by: (a, b) => (b.rating || 0) - (a.rating || 0) },
];
const minutes = (p) => parseInt(String(p.estimatedTime || '99'), 10) || 99;
const tagsOf = (p) => (p.cuisines?.length ? p.cuisines : p.food || []);
const title = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function DeliveryPlaceList({ places, selectedId, onSelect }) {
  const [q, setQ] = useState('');
  const [tag, setTag] = useState(null);
  const [sort, setSort] = useState('fast');

  const tags = useMemo(() => [...new Set(places.flatMap(tagsOf))].slice(0, 10), [places]);
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return places
      .filter((p) => !term || [p.name, p.location, ...tagsOf(p), ...(p.foods || [])].join(' ').toLowerCase().includes(term))
      .filter((p) => !tag || tagsOf(p).includes(tag))
      .sort(SORTS.find((s) => s.key === sort).by);
  }, [places, q, tag, sort]);

  return (
    <View style={styles.wrap}>
      <View style={styles.search}>
        <MaterialCommunityIcons name="magnify" size={18} color={colors.textOnNavyFaint} />
        <TextInput value={q} onChangeText={setQ} placeholder="Search food or a place…" placeholderTextColor={colors.textOnNavyFaint} style={styles.input} />
      </View>
      <View style={styles.chips}>
        {tags.map((t) => (
          <Pressable key={t} onPress={() => setTag(tag === t ? null : t)} style={[styles.chip, tag === t && styles.on]}>
            <Text style={[styles.chipLabel, tag === t && styles.onLabel]}>{title(t)}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.sorts}>
        {SORTS.map((s) => (
          <Pressable key={s.key} onPress={() => setSort(s.key)}>
            <Text style={[styles.sort, sort === s.key && styles.sortOn]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.count}>{shown.length} place{shown.length === 1 ? '' : 's'} deliver{shown.length === 1 ? 's' : ''}</Text>
      {shown.map((p) => {
        const cover = coverOf(p);
        const active = String(p.id) === String(selectedId);
        return (
          <Pressable key={p.id} onPress={() => onSelect(p)} style={({ hovered }) => [styles.row, hovered && styles.rowHover, active && styles.rowOn]}>
            <View style={styles.thumb}>
              {cover ? <Image source={{ uri: cover }} style={styles.img} /> : <MaterialCommunityIcons name="silverware-fork-knife" size={22} color="rgba(133,183,235,0.45)" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.meta} numberOfLines={1}>
                {p.rating ? `★ ${Number(p.rating).toFixed(1)} · ` : ''}{p.estimatedTime || '30-45 min'} · fee {rwf(p.deliveryFee)}
              </Text>
              {!isOpen(p) ? <Text style={styles.closed}>Closed now</Text> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 320, gap: 8 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, borderRadius: 22, paddingHorizontal: 14, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(133,183,235,0.25)' },
  input: { flex: 1, color: colors.white, fontSize: 14.5, outlineStyle: 'none' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(133,183,235,0.3)', paddingHorizontal: 10, paddingVertical: 4 },
  on: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  chipLabel: { color: colors.textOnNavy, fontSize: 12.5, fontWeight: '600' },
  onLabel: { color: colors.white },
  sorts: { flexDirection: 'row', gap: 14, marginTop: 4 },
  sort: { color: colors.textOnNavyFaint, fontSize: 13, fontWeight: '600' },
  sortOn: { color: colors.white, textDecorationLine: 'underline' },
  count: { color: colors.textOnNavyFaint, fontSize: 12.5, marginTop: spacing.sm },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 10, borderRadius: radius.md, borderWidth: 1, borderColor: 'transparent' },
  rowHover: { backgroundColor: 'rgba(255,255,255,0.05)' },
  rowOn: { backgroundColor: 'rgba(55,138,221,0.18)', borderColor: 'rgba(55,138,221,0.6)' },
  thumb: { width: 58, height: 58, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: 'rgba(2,28,54,0.6)', alignItems: 'center', justifyContent: 'center' },
  img: { width: '100%', height: '100%' },
  name: { color: colors.white, fontWeight: '700', fontSize: 15 },
  meta: { color: colors.textOnNavyFaint, fontSize: 12.5, marginTop: 2 },
  closed: { color: '#F87171', fontSize: 12, fontWeight: '600', marginTop: 2 },
});
