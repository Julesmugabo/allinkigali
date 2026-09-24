/**
 * ViewCount.js — Umubare w'abasomye inkuru (eye icon + how many reads).
 * Shown even at zero so a brand-new article doesn't look like it's missing
 * something; `light` is for use on the navy hero card. Renders nothing when
 * the news admin has switched view counts off for readers.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useNews } from '../../context/NewsContext';
import { colors, typography } from '../../theme';

export default function ViewCount({ count = 0, light = false, style }) {
  const { showViewCounts } = useNews();
  if (!showViewCounts) return null;
  const tone = light ? 'rgba(133,183,235,0.7)' : colors.textMuted;
  return (
    <View
      style={[styles.row, style]}
      accessibilityLabel={`${count} abasomye`}
    >
      <MaterialCommunityIcons name="eye-outline" size={12} color={tone} />
      <Text style={[styles.text, { color: tone }]}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { ...typography.meta, marginLeft: 3 },
});
