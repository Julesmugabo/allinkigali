/**
 * Badge.js — Akamenyetso gato (small pill label).
 * Used for BREAKING, category chips, order status and stock state.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, radius } from '../../theme';

export default function Badge({
  label,
  icon,
  color = colors.blue600,
  backgroundColor = colors.blue100,
  borderColor,
  size = 'md',
  style,
}) {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor },
        borderColor ? { borderWidth: StyleSheet.hairlineWidth, borderColor } : null,
        size === 'sm' && styles.sm,
        style,
      ]}
    >
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={size === 'sm' ? 10 : 12}
          color={color}
          style={styles.icon}
        />
      ) : null}
      <Text style={[styles.label, { color }, size === 'sm' && styles.labelSm]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  sm: { paddingHorizontal: 6, paddingVertical: 2 },
  icon: { marginRight: 3 },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  labelSm: { fontSize: 9 },
});
