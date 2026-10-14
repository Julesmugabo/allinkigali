/**
 * PlaceHeader.js — name and key facts in one line (rating, kind, price,
 * area), open/closed and busy status, a few tags, and the section links
 * that jump down the page.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { spacing } from '../../../theme';
import { isOpen } from '../../../screens/shop/home/useDiscoverData';
import { useShopTheme, useShopStyles } from '../../../theme/shopThemes';

const BUSY = { quiet: ['Quiet right now', '#34D399'], moderate: ['Getting busy', '#FBBF24'], full: ['Full right now', '#F87171'] };

export default function PlaceHeader({ kind, place, reviews, sections, onJump }) {
  const c = useShopTheme(); // eslint-disable-line no-unused-vars
  const styles = useShopStyles(makeStyles);
  const rating = reviews.average ?? place.rating; // real reviews win over the listed rating
  const open = isOpen(place);
  const busy = BUSY[place.busyNow];
  const facts = [kind.subtitle(place), kind.priceLabel(place.price), place.district || place.location].filter(Boolean);
  return (
    <View style={styles.wrap}>
      <Text style={styles.name}>{place.name}</Text>
      <Text style={styles.facts}>
        {rating ? <Text style={styles.rating}>★ {Number(rating).toFixed(1)}{reviews.count ? ` (${reviews.count})` : ''}  ·  </Text> : null}
        {facts.join('  ·  ')}
      </Text>
      <View style={styles.statusRow}>
        {kind.key !== 'wedding' ? (
          <Text style={[styles.status, { color: open ? '#34D399' : '#F87171' }]}>● {place.openStatus || (open ? 'Open now' : 'Closed')}</Text>
        ) : null}
        {busy ? <Text style={[styles.status, { color: busy[1] }]}>● {busy[0]}</Text> : null}
        {place.deliveryEnabled ? <Text style={styles.status}>🚚 Delivers</Text> : null}
      </View>
      <View style={styles.tags}>
        {kind.tags(place).map((t) => <Text key={t} style={styles.tag}>{t}</Text>)}
      </View>
      <View style={styles.nav}>
        {sections.map((s) => (
          <Pressable key={s.id} onPress={() => onJump(s.id)} style={({ hovered }) => [styles.link, hovered && styles.linkHover]}>
            <Text style={styles.linkLabel}>{s.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  wrap: { paddingTop: spacing.xl, gap: 8 },
  name: { color: c.text, fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  facts: { color: c.textSoft, fontSize: 15.5 },
  rating: { color: '#F5C518', fontWeight: '700' },
  statusRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  status: { color: c.accentText, fontWeight: '700', fontSize: 14 },
  tags: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tag: { color: c.text, fontSize: 13, backgroundColor: c.accentSoft, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  nav: { flexDirection: 'row', gap: 4, marginTop: spacing.md, borderBottomWidth: 1, borderBottomColor: c.border },
  link: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  linkHover: { borderBottomColor: c.accent },
  linkLabel: { color: c.text, fontWeight: '600', fontSize: 14.5 },
});
