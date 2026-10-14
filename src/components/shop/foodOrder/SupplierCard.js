/**
 * SupplierCard.js — one place that delivers, on the Order Food page:
 * photo with Open/Closed and "in your order" badges, then name, rating,
 * what it serves, and the delivery facts (time · fee · minimum). When a
 * food chip or search is on, a line shows the matching dish and price.
 * Closed places are dimmed.
 */
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { radius, spacing } from '../../../theme';
import { useShopTheme, useShopStyles } from '../../../theme/shopThemes';
import { coverOf } from '../../../screens/shop/home/useDiscoverData';
import { rwf } from '../../../utils/money';

export default function SupplierCard({ supplier, open, inCart, match, onPress }) {
  const c = useShopTheme();
  const styles = useShopStyles(makeStyles);
  const cover = coverOf(supplier);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={supplier.name}
      style={({ hovered }) => [styles.card, hovered && styles.hover, !open && styles.closed]}>
      <View style={styles.photo}>
        {cover ? <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <MaterialCommunityIcons name={supplier.kind.icon} size={36} color={c.textMuted} />}
        <View style={[styles.badge, styles.left, { backgroundColor: open ? 'rgba(16,120,80,0.92)' : 'rgba(150,40,40,0.92)' }]}>
          <Text style={styles.badgeText}>{open ? 'Open' : 'Closed'}</Text>
        </View>
        {inCart ? <View style={[styles.badge, styles.right]}><Text style={styles.badgeText}>🛒 {inCart} in your order</Text></View> : null}
      </View>
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{supplier.name}</Text>
          {supplier.rating ? <Text style={styles.rating}>★ {Number(supplier.rating).toFixed(1)}</Text> : null}
        </View>
        <Text style={styles.sub} numberOfLines={1}>{supplier.kind.subtitle(supplier)}</Text>
        <Text style={styles.facts} numberOfLines={1}>
          ⏱ {supplier.estimatedTime || '30–45 min'}  ·  🚚 {rwf(supplier.deliveryFee)}{supplier.minOrder ? `  ·  min ${rwf(supplier.minOrder)}` : ''}
        </Text>
        {match ? <Text style={styles.match} numberOfLines={1}>{match}</Text> : null}
      </View>
    </Pressable>
  );
}

const makeStyles = (c) => StyleSheet.create({
  card: { borderRadius: radius.lg, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, overflow: 'hidden' },
  hover: { borderColor: c.borderStrong, transform: [{ translateY: -3 }] },
  closed: { opacity: 0.55 },
  photo: { width: '100%', aspectRatio: 16 / 10, backgroundColor: c.photoWell, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 10, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  left: { left: 10 },
  right: { right: 10, backgroundColor: 'rgba(2,20,40,0.82)' },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  body: { padding: spacing.md, gap: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, color: c.text, fontSize: 16, fontWeight: '700' },
  rating: { color: '#F5C518', fontSize: 13, fontWeight: '700' },
  sub: { color: c.accentText, fontSize: 13 },
  facts: { color: c.textMuted, fontSize: 12.5, marginTop: 2 },
  match: { color: c.text, fontSize: 12.5, fontWeight: '600', marginTop: 4, backgroundColor: c.accentSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
});
