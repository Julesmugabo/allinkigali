/**
 * AdBox.js — Agasanduku k'itangazo (ad unit shown inline in the News feed).
 *
 * Same card treatment as HeroCard's image well — full-width, rounded, same
 * height — just holding a photo or a video instead of an article. Always
 * carries a small "ITANGAZO" label so nobody mistakes sponsored media for a
 * real news photo. Video never autoplays (no surprise sound or data use);
 * native controls let a viewer play it themselves.
 */
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { colors, spacing, radius } from '../../theme';

export default function AdBox({ ad, style }) {
  if (!ad?.mediaUri) return null;

  return (
    <View style={[styles.card, style]}>
      {ad.type === 'video' ? (
        <Video
          source={{ uri: ad.mediaUri }}
          style={styles.media}
          resizeMode={ResizeMode.COVER}
          useNativeControls
          isLooping
          shouldPlay={false}
        />
      ) : (
        <Image source={{ uri: ad.mediaUri }} style={styles.media} resizeMode="cover" />
      )}

      <View style={styles.badge}>
        <Text style={styles.badgeText}>ITANGAZO</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 172,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.navy700,
    marginBottom: spacing.md,
  },
  media: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(2,28,54,0.7)',
    borderRadius: radius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textOnNavy,
  },
});
