/**
 * TrendAdCard.js — an ad in the "Bisomwa cyane" rail, same width and
 * height as the story cards beside it: the ad's photo fills the card, with
 * the ITANGAZO tag and the ad's name over a dark fade.
 */
import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAds } from '../../../context/AdsContext';
import { colors, radius, spacing } from '../../../theme';
import AdMedia from './AdMedia';
import AdTag from './AdTag';

export default function TrendAdCard({ ad, width }) {
  const { recordView, openAd } = useAds();
  useEffect(() => { recordView(ad); }, [ad, recordView]);
  return (
    <Pressable onPress={() => openAd(ad)} accessibilityRole="link" accessibilityLabel={`Itangazo: ${ad.title}`}
      style={({ pressed }) => [styles.card, { width }, pressed && { opacity: 0.9 }]}>
      <AdMedia ad={ad} style={StyleSheet.absoluteFill} />
      <View style={styles.fade} />
      <AdTag style={styles.tag} />
      {ad.title ? <Text style={styles.title} numberOfLines={3}>{ad.title}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 150, backgroundColor: colors.navy800, borderRadius: radius.md, overflow: 'hidden', justifyContent: 'flex-end', padding: spacing.md },
  fade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,20,40,0.35)' },
  tag: { position: 'absolute', top: spacing.sm, left: spacing.sm },
  title: { color: colors.white, fontSize: 13, fontWeight: '700', lineHeight: 17 },
});
