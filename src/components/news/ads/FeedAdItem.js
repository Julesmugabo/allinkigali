/**
 * FeedAdItem.js — an ad in the story list, built exactly like a story card
 * (NewsListItem): same rectangle, 58px picture on the left, text on the
 * right. The ITANGAZO tag replaces the story labels.
 */
import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAds } from '../../../context/AdsContext';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import AdMedia from './AdMedia';
import AdTag from './AdTag';

const host = (url) => String(url || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];

export default function FeedAdItem({ ad }) {
  const { recordView, openAd } = useAds();
  useEffect(() => { recordView(ad); }, [ad, recordView]);
  return (
    <Pressable onPress={() => openAd(ad)} accessibilityRole="link" accessibilityLabel={`Itangazo: ${ad.title}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.thumb}><AdMedia ad={ad} /></View>
      <View style={styles.body}>
        <AdTag style={styles.tag} />
        <Text style={styles.title} numberOfLines={3}>{ad.title || 'Itangazo'}</Text>
        {ad.linkUrl ? (
          <View style={styles.footer}>
            <MaterialCommunityIcons name="open-in-new" size={11} color={colors.blue600} />
            <Text style={styles.link} numberOfLines={1}>{host(ad.linkUrl)}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

// Same measurements as NewsListItem's card.
const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, padding: spacing.md - 2, marginBottom: spacing.sm, ...shadows.card,
  },
  pressed: { opacity: 0.9, backgroundColor: '#FBFCFE' },
  thumb: { width: 58, height: 58, borderRadius: radius.sm, overflow: 'hidden' },
  body: { flex: 1, marginLeft: spacing.md - 2, minWidth: 0 },
  tag: { marginBottom: 4 },
  title: { ...typography.cardTitle, color: colors.navy800, marginBottom: spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  link: { color: colors.blue600, fontSize: 11.5, fontWeight: '600', flexShrink: 1 },
});
