/**
 * PlaceRow.js — a titled, sideways-scrolling row of PlaceCards with a
 * "See all" link. Hidden when it has nothing to show.
 */
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../../../theme';
import PlaceCard from './PlaceCard';

export default function PlaceRow({ title, items, onPressItem, onSeeAll }) {
  if (!items.length) return null;
  return (
    <View style={styles.row}>
      <View style={styles.head}>
        <Text style={styles.title}>{title}</Text>
        {onSeeAll ? <Pressable onPress={onSeeAll}><Text style={styles.all}>See all →</Text></Pressable> : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {items.map(({ place, kind }) => (
          <PlaceCard key={`${kind}-${place.id}`} place={place} kind={kind} onPress={() => onPressItem(place, kind)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginTop: spacing.xxl },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: spacing.md },
  title: { color: colors.white, fontSize: 18, fontWeight: '700' },
  all: { color: colors.blue300, fontSize: 14, fontWeight: '600' },
  list: { gap: 14, paddingBottom: 6 },
});
