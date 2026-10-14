/**
 * NewsTagline.js — Intego y'igice cy'amakuru (the News section's tagline).
 * One line, shown once at the top of the news feed on phone and web.
 * `onNavy` for the dark phone header, otherwise for the light web page.
 */
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../../theme';

export const NEWS_TAGLINE = 'Amakuru yo mu mahanga, hafi yawe.';

export default function NewsTagline({ onNavy = false, style }) {
  return <Text style={[styles.tagline, onNavy ? styles.onNavy : styles.onLight, style]}>{NEWS_TAGLINE}</Text>;
}

const styles = StyleSheet.create({
  tagline: { fontSize: 13.5, fontWeight: '600', letterSpacing: 0.2 },
  onNavy: { color: colors.blue300 },
  onLight: { color: colors.blue600, fontSize: 16 },
});
