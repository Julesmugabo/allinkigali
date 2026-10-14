/**
 * NewsTagline.js — Intego y'igice cy'amakuru (the News section's slogan).
 * Centered, two-tone ("hafi yawe." in gold) with a globe mark and a short
 * gold underline, like a newspaper masthead. Shown once at the top of the
 * feed on phone and web. `onNavy` for the dark phone header; otherwise the
 * larger version for the light web page.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme';

export const NEWS_TAGLINE = 'Amakuru yo mu mahanga, hafi yawe.';
const GOLD_ON_NAVY = '#F5C518';
const GOLD_ON_LIGHT = '#B7791F'; // deeper gold so it stays readable on white

export default function NewsTagline({ onNavy = false, style }) {
  const v = onNavy ? phone : web;
  return (
    <View style={[styles.wrap, style]} accessibilityRole="header" accessibilityLabel={NEWS_TAGLINE}>
      <View style={styles.line}>
        <MaterialCommunityIcons name="earth" size={v.icon} color={onNavy ? GOLD_ON_NAVY : GOLD_ON_LIGHT} style={styles.globe} />
        <Text style={[styles.text, v.text]}>
          Amakuru yo mu mahanga, <Text style={{ color: onNavy ? GOLD_ON_NAVY : GOLD_ON_LIGHT }}>hafi yawe.</Text>
        </Text>
      </View>
      <View style={[styles.underline, v.underline, { backgroundColor: onNavy ? GOLD_ON_NAVY : GOLD_ON_LIGHT }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  globe: { marginRight: 8 },
  text: { fontWeight: '800', textAlign: 'center', letterSpacing: -0.2 },
  underline: { borderRadius: 2 },
});

const phone = {
  icon: 18,
  text: { fontSize: 17, color: colors.white },
  underline: { width: 40, height: 2, marginTop: 6 },
};
const web = {
  icon: 28,
  text: { fontSize: 28, color: colors.navy800 },
  underline: { width: 64, height: 3, marginTop: 10 },
};
