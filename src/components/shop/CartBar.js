/**
 * CartBar.js — Umurongo w'agatebo uhora hepfo.
 * Floats above the tab bar whenever the cart has something in it.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { formatPrice } from '../../utils/format';
import { colors, typography, spacing, radius, shadows } from '../../theme';

export default function CartBar({ count, total, onPress, bottomOffset = 0 }) {
  if (!count) return null;

  const itemsLabel = count === 1 ? 'igicuruzwa 1' : `ibicuruzwa ${count}`;

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset + spacing.md }]} pointerEvents="box-none">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Reba agatebo, ${itemsLabel}`}
        style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
      >
        <View style={styles.left}>
          <View style={styles.iconWell}>
            <MaterialCommunityIcons name="basket-outline" size={19} color={colors.white} />
            <View style={styles.countPill}>
              <Text style={styles.countText}>{count}</Text>
            </View>
          </View>
          <View style={styles.labels}>
            <Text style={styles.items}>{itemsLabel}</Text>
            <Text style={styles.total}>{formatPrice(total)}</Text>
          </View>
        </View>

        <View style={styles.cta}>
          <Text style={styles.ctaLabel}>Komeza</Text>
          <MaterialCommunityIcons name="arrow-right" size={17} color={colors.navy800} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.blue500,
    borderRadius: radius.lg,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    height: 62,
    ...shadows.floating,
  },
  pressed: { opacity: 0.92 },
  left: { flexDirection: 'row', alignItems: 'center' },
  iconWell: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPill: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.navy800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { color: colors.white, fontSize: 10.5, fontWeight: '700' },
  labels: { marginLeft: spacing.md },
  items: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 1,
  },
  total: {
    ...typography.price,
    color: colors.white,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  ctaLabel: {
    ...typography.button,
    fontSize: 14,
    color: colors.navy800,
    marginRight: 4,
  },
});
