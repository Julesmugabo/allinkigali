/**
 * OrderCard.js — Ikarita y'icyifuzo mu rutonde.
 * One row in the order list: reference, status, what was ordered, and total.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import Badge from '../common/Badge';
import { getStatusMeta } from '../../data/orderStatus';
import { formatPrice } from '../../utils/format';
import { formatDateTime } from '../../utils/date';
import { colors, typography, spacing, radius } from '../../theme';

export default function OrderCard({ order, onPress }) {
  const status = getStatusMeta(order.status);
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const summary = order.items
    .map((i) => `${i.quantity}× ${i.shortName || i.name}`)
    .join(', ');

  return (
    <Pressable
      onPress={() => onPress && onPress(order)}
      accessibilityRole="button"
      accessibilityLabel={`Icyifuzo ${order.ref}, ${status.label}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={styles.ref}>{order.ref}</Text>
          <Text style={styles.date}>{formatDateTime(order.createdAt)}</Text>
        </View>

        <Badge
          label={status.label}
          icon={status.icon}
          color={status.color}
          backgroundColor={status.tint}
        />
      </View>

      <View style={styles.itemsRow}>
        <View style={styles.iconWell}>
          <MaterialCommunityIcons
            name={order.items[0] ? order.items[0].icon || 'package-variant' : 'package-variant'}
            size={20}
            color={colors.blue600}
          />
          {itemCount > 1 ? (
            <View style={styles.countPill}>
              <Text style={styles.countText}>{itemCount}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.summary} numberOfLines={2}>
          {summary}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.addressRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={13} color={colors.textMuted} />
          <Text style={styles.address} numberOfLines={1}>
            {order.deliveryAddress || 'Nta aderesi'}
          </Text>
        </View>

        <Text style={styles.total}>{formatPrice(order.total)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg - 2,
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.92 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  ref: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.navy800,
    letterSpacing: 0.3,
  },
  date: {
    ...typography.meta,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemsRow: { flexDirection: 'row', alignItems: 'center' },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.blue100,
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
    backgroundColor: colors.blue500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  summary: {
    flex: 1,
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  addressRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: spacing.md },
  address: {
    ...typography.meta,
    color: colors.textMuted,
    marginLeft: 3,
    flex: 1,
  },
  total: {
    ...typography.price,
    fontSize: 15,
    color: colors.navy800,
  },
});
