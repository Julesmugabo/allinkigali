/**
 * ProductCard.js — Ikarita y'igicuruzwa.
 *
 * Shows the photo when a product has one and a clean icon well when it doesn't,
 * so the shop looks finished before your gas photos are added.
 * Tapping "Ongeraho" adds one to the cart; after that the stepper takes over.
 */
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import QuantityStepper from './QuantityStepper';
import Badge from '../common/Badge';
import { formatPrice } from '../../utils/format';
import { colors, typography, spacing, radius } from '../../theme';

export default function ProductCard({ product, quantity = 0, onAdd, onChangeQuantity, onPress }) {
  const inCart = quantity > 0;
  const isOut = !product.inStock;

  return (
    <Pressable
      onPress={() => onPress && onPress(product)}
      accessibilityRole="button"
      accessibilityLabel={product.name}
      style={({ pressed }) => [styles.card, isOut && styles.cardOut, pressed && styles.pressed]}
    >
      <View style={styles.imageWell}>
        {product.image ? (
          <Image source={product.image} style={styles.image} resizeMode="contain" />
        ) : (
          <MaterialCommunityIcons name={product.icon || 'package-variant'} size={38} color={colors.blue300} />
        )}
        {product.oldPrice ? (
          <Badge
            label="IGABANUKA"
            color={colors.white}
            backgroundColor={colors.breaking}
            size="sm"
            style={styles.saleBadge}
          />
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.brand}>{product.brand}</Text>

        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <MaterialCommunityIcons name="weight-kilogram" size={11} color={colors.blue300} />
            <Text style={styles.metaText}>{product.size}</Text>
          </View>
          <View style={styles.metaChip}>
            <MaterialCommunityIcons
              name={isOut ? 'clock-outline' : 'moped'}
              size={11}
              color={isOut ? colors.warning : colors.blue300}
            />
            <Text style={[styles.metaText, isOut && { color: colors.warning }]}>
              {product.deliveryNote}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>{formatPrice(product.price, product.currency)}</Text>
            {product.oldPrice ? (
              <Text style={styles.oldPrice}>{formatPrice(product.oldPrice, product.currency)}</Text>
            ) : null}
          </View>

          {isOut ? (
            <Badge
              label="Ntibihari"
              color={colors.warning}
              backgroundColor="rgba(186,117,23,0.18)"
              borderColor="rgba(186,117,23,0.4)"
            />
          ) : inCart ? (
            <QuantityStepper
              value={quantity}
              onChange={(next) => onChangeQuantity(product, next)}
              size="sm"
            />
          ) : (
            <Pressable
              onPress={() => onAdd(product)}
              accessibilityRole="button"
              accessibilityLabel={`Ongeraho ${product.name}`}
              style={({ pressed }) => [styles.addButton, pressed && styles.addPressed]}
            >
              <MaterialCommunityIcons name="plus" size={16} color={colors.white} />
              <Text style={styles.addLabel}>Ongeraho</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardOut: { opacity: 0.72 },
  pressed: { backgroundColor: 'rgba(255,255,255,0.12)' },
  imageWell: {
    width: 84,
    height: 96,
    borderRadius: radius.md,
    backgroundColor: 'rgba(2,28,54,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  saleBadge: { position: 'absolute', top: 5, left: 5 },
  body: { flex: 1, marginLeft: spacing.md, justifyContent: 'space-between' },
  brand: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.blue500,
    marginBottom: 2,
  },
  name: {
    ...typography.cardTitle,
    color: colors.textOnNavy,
    marginBottom: spacing.sm,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  metaText: {
    fontSize: 10.5,
    color: colors.textOnNavyFaint,
    marginLeft: 3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    ...typography.price,
    color: colors.white,
  },
  oldPrice: {
    fontSize: 11,
    color: 'rgba(133,183,235,0.6)',
    textDecorationLine: 'line-through',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blue500,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 34,
  },
  addPressed: { opacity: 0.85 },
  addLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
});
