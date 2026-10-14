/**
 * BrowseCard.js — one place in the browse grid: photo with Open/Closed and
 * delivery badges and a ♡, then name, rating, kind-specific line, area,
 * price and two "good for" tags. Hover lifts it and zooms the photo.
 */
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { radius, spacing } from '../../../theme';
import { isOpen, coverOf } from '../../../screens/shop/home/useDiscoverData';
import { formatKm } from '../../../screens/shop/browse/browseLogic';
import { useShopTheme, useShopStyles } from '../../../theme/shopThemes';

const BUSY = { quiet: ['Quiet now', '#34D399'], moderate: ['Getting busy', '#FBBF24'], full: ['Full now', '#F87171'] };

export default function BrowseCard({ place, kind, saved, onToggleSave, onPress, onHover }) {
  const c = useShopTheme(); // eslint-disable-line no-unused-vars
  const styles = useShopStyles(makeStyles);
  const cover = coverOf(place);
  const busy = BUSY[place.busyNow];
  const open = isOpen(place);
  const facts = [place.district || place.location, kind.priceLabel(place.price), place.distanceKm != null ? formatKm(place.distanceKm) : null].filter(Boolean);
  return (
    <Pressable onPress={onPress} onHoverIn={() => onHover?.(place.id)} onHoverOut={() => onHover?.(null)}
      style={({ hovered }) => [styles.card, hovered && styles.hover]}>
      {({ hovered }) => (
        <>
          <View style={styles.photoWell}>
            {cover
              ? <Image source={{ uri: cover }} style={[styles.photo, hovered && styles.zoom]} resizeMode="cover" />
              : <MaterialCommunityIcons name={kind.icon} size={34} color={c.textMuted} />}
            <View style={styles.badges}>
              {kind.key !== 'wedding' && (
                <View style={[styles.badge, { backgroundColor: open ? 'rgba(16,120,80,0.92)' : 'rgba(150,40,40,0.92)' }]}>
                  <Text style={styles.badgeText}>{open ? 'Open' : 'Closed'}</Text>
                </View>
              )}
              {place.deliveryEnabled ? <View style={[styles.badge, styles.dark]}><Text style={styles.badgeText}>🚚</Text></View> : null}
            </View>
            <Pressable onPress={(e) => { e?.stopPropagation?.(); onToggleSave(); }} style={styles.heart}
              accessibilityRole="button" accessibilityLabel={saved ? 'Remove from saved' : 'Save'}>
              <MaterialCommunityIcons name={saved ? 'heart' : 'heart-outline'} size={18} color={saved ? '#F87171' : c.text} />
            </Pressable>
          </View>
          <View style={styles.body}>
            <View style={styles.row}>
              <Text style={styles.name} numberOfLines={1}>{place.name}</Text>
              {place.rating ? <Text style={styles.rating}>★ {Number(place.rating).toFixed(1)}</Text> : null}
            </View>
            <Text style={styles.sub} numberOfLines={1}>{kind.subtitle(place)}</Text>
            <Text style={styles.meta} numberOfLines={1}>{facts.join(' · ')}</Text>
            {busy ? <Text style={[styles.busy, { color: busy[1] }]}>● {busy[0]}</Text> : null}
            <View style={styles.tags}>
              {kind.tags(place).map((t) => <Text key={t} style={styles.tag} numberOfLines={1}>{t}</Text>)}
            </View>
          </View>
        </>
      )}
    </Pressable>
  );
}

const makeStyles = (c) => StyleSheet.create({
  card: { borderRadius: radius.lg, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, overflow: 'hidden', transitionDuration: '150ms' },
  hover: { borderColor: c.borderStrong, transform: [{ translateY: -3 }] },
  photoWell: { width: '100%', aspectRatio: 16 / 10, backgroundColor: c.photoWell, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photo: { width: '100%', height: '100%', transitionDuration: '300ms' },
  zoom: { transform: [{ scale: 1.05 }] },
  badges: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  dark: { backgroundColor: 'rgba(2,20,40,0.75)' },
  badgeText: { color: c.text, fontSize: 11, fontWeight: '700' },
  heart: { position: 'absolute', top: 8, right: 8, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(2,20,40,0.55)', alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.md, gap: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, color: c.text, fontSize: 16, fontWeight: '700' },
  rating: { color: '#F5C518', fontSize: 13, fontWeight: '700' },
  sub: { color: c.accentText, fontSize: 13 },
  meta: { color: c.textMuted, fontSize: 12.5 },
  busy: { fontSize: 12, fontWeight: '700' },
  tags: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  tag: { color: c.textSoft, fontSize: 11.5, backgroundColor: c.accentSoft, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, maxWidth: '100%' },
});
