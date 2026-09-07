/**
 * BusinessCard.js — Ikarita y'ubucuruzi/serivisi mu bisubizo byo gushakisha.
 *
 * Shows one business result: photo, name + verified badge, rating, open/
 * hours, a few services, starting price, a short "why people choose us"
 * note, then View Details / Book Now.
 */
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import PrimaryButton from '../common/PrimaryButton';
import { formatPrice } from '../../utils/format';
import { colors, typography, spacing, radius } from '../../theme';

const MAX_VISIBLE_SERVICES = 3;

export default function BusinessCard({ business, onViewDetails, onBook }) {
  const extraServices = Math.max(0, (business.services?.length || 0) - MAX_VISIBLE_SERVICES);

  return (
    <Pressable
      onPress={() => onViewDetails(business)}
      accessibilityRole="button"
      accessibilityLabel={business.name}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.imageWell}>
        {business.image ? (
          <Image source={business.image} style={styles.image} resizeMode="cover" />
        ) : (
          <MaterialCommunityIcons name={business.icon || 'store-outline'} size={40} color={colors.blue300} />
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {business.name}
          </Text>
          {business.verified ? (
            <MaterialCommunityIcons name="check-decagram" size={16} color={colors.success} />
          ) : null}
        </View>

        <View style={styles.metaRow}>
          {business.rating ? (
            <View style={styles.metaChip}>
              <MaterialCommunityIcons name="star" size={13} color="#F5B942" />
              <Text style={styles.ratingText}>{business.rating}</Text>
              <Text style={styles.reviewText}>({business.reviewCount})</Text>
            </View>
          ) : (
            <Text style={styles.newLabel}>Ibicuruzwa bishya</Text>
          )}

          {business.openLabel ? (
            <View style={styles.openPill}>
              <View style={styles.openDot} />
              <Text style={styles.openLabel}>{business.openLabel}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.chips}>
          {(business.services || []).slice(0, MAX_VISIBLE_SERVICES).map((service) => (
            <View key={service} style={styles.chip}>
              <Text style={styles.chipLabel}>{service}</Text>
            </View>
          ))}
          {extraServices > 0 ? (
            <View style={[styles.chip, styles.chipMuted]}>
              <Text style={styles.chipLabel}>+{extraServices} ibindi</Text>
            </View>
          ) : null}
        </View>

        {business.priceFrom ? (
          <Text style={styles.price}>
            Guhera kuri{' '}
            <Text style={styles.priceStrong}>{formatPrice(business.priceFrom, business.currency)}</Text>
            {business.priceUnit ? ` / ${business.priceUnit}` : ''}
          </Text>
        ) : null}

        {business.highlights?.length ? (
          <View style={styles.highlightBox}>
            <MaterialCommunityIcons name="thumb-up-outline" size={13} color={colors.success} />
            <Text style={styles.highlightText} numberOfLines={2}>
              {business.highlights.join('  •  ')}
            </Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <View style={styles.actionSlot}>
            <PrimaryButton
              label="Reba byinshi"
              variant="outline"
              size="sm"
              onPress={() => onViewDetails(business)}
            />
          </View>
          <View style={[styles.actionSlot, styles.actionSlotRight]}>
            <PrimaryButton
              label="Tumiza"
              icon="calendar-check-outline"
              size="sm"
              onPress={() => onBook(business)}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  pressed: { backgroundColor: 'rgba(255,255,255,0.12)' },
  imageWell: {
    height: 110,
    backgroundColor: 'rgba(2,28,54,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  body: { padding: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  name: {
    ...typography.cardTitle,
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    marginRight: spacing.xs,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  metaChip: { flexDirection: 'row', alignItems: 'center' },
  ratingText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.white,
    marginLeft: 4,
  },
  reviewText: {
    ...typography.caption,
    color: colors.textOnNavyFaint,
    marginLeft: 3,
  },
  newLabel: {
    ...typography.caption,
    color: colors.blue300,
    fontWeight: '600',
  },
  openPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(46,158,91,0.18)',
  },
  openDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 4,
  },
  openLabel: { fontSize: 10, fontWeight: '600', color: colors.success },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.25)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  chipMuted: { backgroundColor: 'rgba(255,255,255,0.05)' },
  chipLabel: { fontSize: 11, color: colors.textOnNavy },
  price: {
    ...typography.body,
    fontSize: 12.5,
    color: colors.textOnNavyFaint,
    marginBottom: spacing.sm,
  },
  priceStrong: { color: colors.white, fontWeight: '700' },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(46,158,91,0.14)',
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  highlightText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 15,
    color: colors.white,
    marginLeft: spacing.xs,
  },
  actions: { flexDirection: 'row' },
  actionSlot: { flex: 1 },
  actionSlotRight: { marginLeft: spacing.sm },
});
