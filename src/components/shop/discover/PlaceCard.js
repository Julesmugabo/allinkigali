/**
 * PlaceCard.js — a compact restaurant / coffee shop / venue card for the
 * wide-web front page rows: photo, name, rating, area, price, live status.
 */
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, spacing } from '../../../theme';
import { isOpen, coverOf } from '../../../screens/shop/home/useDiscoverData';

const BUSY = { quiet: ['Quiet now', '#34D399'], moderate: ['Getting busy', '#FBBF24'], full: ['Full now', '#F87171'] };

export default function PlaceCard({ place, kind, onPress }) {
  const cover = coverOf(place);
  const busy = BUSY[place.busyNow];
  return (
    <Pressable onPress={onPress} style={({ hovered }) => [styles.card, hovered && styles.hover]}>
      <View style={styles.photoWell}>
        {cover ? <Image source={{ uri: cover }} style={styles.photo} resizeMode="cover" /> : (
          <MaterialCommunityIcons name={kind === 'coffee' ? 'coffee-outline' : kind === 'wedding' ? 'flower-outline' : 'silverware-fork-knife'} size={30} color="rgba(133,183,235,0.4)" />
        )}
        {kind !== 'wedding' && (
          <View style={[styles.badge, { backgroundColor: isOpen(place) ? 'rgba(16,120,80,0.9)' : 'rgba(150,40,40,0.9)' }]}>
            <Text style={styles.badgeText}>{isOpen(place) ? 'Open' : 'Closed'}</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{place.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {place.rating ? `★ ${Number(place.rating).toFixed(1)} · ` : ''}{place.district || place.location || ''}{place.price ? ` · ${'$'.repeat(place.price)}` : ''}
        </Text>
        {busy ? <Text style={[styles.extra, { color: busy[1] }]}>{busy[0]}</Text> : null}
        {!busy && kind === 'wedding' && place.capacity ? <Text style={styles.extra}>Up to {place.capacity} guests</Text> : null}
        {!busy && kind !== 'wedding' && place.deliveryEnabled ? <Text style={styles.extra}>🚚 Delivers</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 230, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.2)', overflow: 'hidden' },
  hover: { borderColor: 'rgba(133,183,235,0.6)', transform: [{ translateY: -2 }] },
  photoWell: { width: '100%', aspectRatio: 16 / 10, backgroundColor: 'rgba(2,28,54,0.6)', alignItems: 'center', justifyContent: 'center' },
  photo: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  body: { padding: spacing.md },
  name: { color: colors.white, fontSize: 15, fontWeight: '700' },
  meta: { color: colors.textOnNavyFaint, fontSize: 12, marginTop: 3 },
  extra: { color: colors.blue300, fontSize: 12, marginTop: 4, fontWeight: '600' },
});
