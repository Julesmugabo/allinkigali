/**
 * AdminStatCard.js — Agasanduku k'umubare mu buyobozi.
 * One number with a label and icon. Used across all admin dashboards.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, radius } from '../../theme';

export default function AdminStatCard({ icon, value, label, tint = colors.blue300, style }) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconWell, { backgroundColor: `${tint}22` }]}>
        <MaterialCommunityIcons name={icon} size={16} color={tint} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  iconWell: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: { fontSize: 20, fontWeight: '700', color: colors.white, letterSpacing: -0.4 },
  label: { ...typography.caption, fontSize: 10.5, color: colors.textOnNavyFaint, marginTop: 2 },
});
