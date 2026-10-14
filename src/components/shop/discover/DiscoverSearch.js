/**
 * DiscoverSearch.js — one search box across restaurants, coffee shops and
 * wedding venues (name, area, cuisine / coffee), with a results dropdown.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius } from '../../../theme';

const KIND_LABEL = { resto: 'Restaurant', coffee: 'Coffee shop', wedding: 'Wedding venue' };

export default function DiscoverSearch({ entries, onPick }) {
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    return entries.filter(({ place }) => [place.name, place.location, place.district, ...(place.cuisines || []), ...(place.coffeeTypes || []), ...(place.foods || [])]
      .filter(Boolean).join(' ').toLowerCase().includes(term)).slice(0, 8);
  }, [q, entries]);

  return (
    <View style={styles.wrap}>
      <View style={styles.box}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textOnNavyFaint} />
        <TextInput value={q} onChangeText={setQ} placeholder="Search a place, dish or area…" placeholderTextColor={colors.textOnNavyFaint} style={styles.input} />
      </View>
      {q.trim().length >= 2 && (
        <View style={styles.drop}>
          {results.length ? results.map(({ place, kind }) => (
            <Pressable key={`${kind}-${place.id}`} onPress={() => { setQ(''); onPick(place, kind); }} style={({ hovered }) => [styles.item, hovered && styles.itemHover]}>
              <Text style={styles.name}>{place.name}</Text>
              <Text style={styles.meta}>{KIND_LABEL[kind]} · {place.district || place.location || ''}</Text>
            </Pressable>
          )) : <Text style={styles.none}>No place matches “{q.trim()}”.</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', maxWidth: 640, alignSelf: 'center', zIndex: 10 },
  box: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 30, paddingHorizontal: 18, height: 52, borderWidth: 1, borderColor: 'rgba(133,183,235,0.25)' },
  input: { flex: 1, color: colors.white, fontSize: 16, outlineStyle: 'none' },
  drop: { position: 'absolute', top: 58, left: 0, right: 0, backgroundColor: '#0B2E52', borderRadius: radius.md, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(133,183,235,0.25)' },
  item: { paddingHorizontal: 16, paddingVertical: 10 },
  itemHover: { backgroundColor: 'rgba(255,255,255,0.08)' },
  name: { color: colors.white, fontSize: 15, fontWeight: '600' },
  meta: { color: colors.textOnNavyFaint, fontSize: 12, marginTop: 2 },
  none: { color: colors.textOnNavyFaint, padding: 16 },
});
