/**
 * SideAd.js — a website ad in a side column (left/right of the news page,
 * or under "Bisomwa cyane" on an article page). Fills the column width;
 * scrolls with the page like everything else.
 */
import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAds } from '../../../context/AdsContext';
import { colors, radius, spacing } from '../../../theme';
import AdMedia from './AdMedia';
import AdTag from './AdTag';

export default function SideAd({ ad, style }) {
  const { recordView, openAd } = useAds();
  useEffect(() => { recordView(ad); }, [ad, recordView]);
  if (!ad) return null;
  return (
    <Pressable onPress={() => openAd(ad)} accessibilityRole="link" accessibilityLabel={`Itangazo: ${ad.title}`}
      style={({ hovered }) => [styles.card, hovered && ad.linkUrl && styles.hover, style]}>
      <View style={styles.media}>
        <AdMedia ad={ad} />
        <AdTag style={styles.tag} />
      </View>
      {ad.title ? <Text style={styles.title} numberOfLines={2}>{ad.title}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, cursor: 'pointer' },
  hover: { borderColor: colors.blue500 },
  media: { width: '100%', aspectRatio: 6 / 5 },
  tag: { position: 'absolute', top: spacing.sm, left: spacing.sm },
  title: { color: colors.navy800, fontSize: 14, fontWeight: '700', padding: spacing.md },
});
