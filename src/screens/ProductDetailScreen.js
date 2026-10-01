/**
 * ProductDetailScreen.js — One product from Allingadget or Uruhu Rwiza.
 * Adds to the existing CartContext, so Checkout (already built, previously
 * unreachable) finally has a real way in.
 */
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import PrimaryButton from '../components/common/PrimaryButton';
import QuantityStepper from '../components/shop/QuantityStepper';

import { useCart } from '../context/CartContext';
import { STORES } from '../data/productCatalogs';
import { formatPrice } from '../utils/format';
import { colors, typography, spacing, radius, gutter } from '../theme';

export default function ProductDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const store = STORES[route.params?.store] || STORES.allingadget;
  const product = store.products.find((p) => p.id === route.params?.id);
  const { addItem, getQuantity } = useCart();
  const [added, setAdded] = useState(false);

  const quantity = product ? getQuantity(product.id) : 0;

  const handleAdd = useCallback(() => {
    if (!product) return;
    addItem(
      {
        id: product.id,
        name: `${product.brand} ${product.name}`,
        shortName: product.name,
        price: product.price,
        icon: product.icon,
        image: null,
        brand: product.brand,
      },
      1
    );
    setAdded(true);
  }, [product, addItem]);

  if (!product) {
    return (
      <GradientBackground>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>This product could not be found.</Text>
        </View>
      </GradientBackground>
    );
  }

  const categoryLabel = store.categories.find((c) => c.key === product.category)?.label || '';

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.huge }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textOnNavy} />
          </Pressable>
        </View>

        <View style={styles.imageWell}>
          <MaterialCommunityIcons name={product.icon} size={72} color={colors.blue300} />
        </View>

        {categoryLabel ? (
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>{categoryLabel}</Text>
          </View>
        ) : null}

        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>

        <Text style={styles.sectionLabel}>Description</Text>
        <Text style={styles.description}>{product.description}</Text>

        {quantity ? (
          <View style={styles.inCartRow}>
            <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
            <Text style={styles.inCartText}>{quantity} in your cart</Text>
            <QuantityStepper
              value={quantity}
              onChange={(q) => addItem({ id: product.id }, q - quantity)}
            />
          </View>
        ) : null}

        <PrimaryButton
          label={added ? 'Add another' : 'Add to cart'}
          icon="cart-plus"
          onPress={handleAdd}
          style={styles.addButton}
        />
        {quantity ? (
          <PrimaryButton
            label="View cart"
            icon="cart-outline"
            variant="ghost"
            onPress={() => navigation.navigate('Checkout')}
          />
        ) : null}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { ...typography.body, color: colors.textOnNavy },
  topBar: { marginBottom: spacing.md },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWell: {
    height: 180,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(55,138,221,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(133,183,235,0.18)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginBottom: spacing.sm,
  },
  badgeLabel: { fontSize: 11, fontWeight: '600', color: colors.blue300 },
  brand: { ...typography.caption, fontWeight: '700', color: colors.blue300, letterSpacing: 0.4 },
  title: { ...typography.screenTitle, fontSize: 19, lineHeight: 25, color: colors.white, marginTop: spacing.xs, marginBottom: spacing.sm },
  price: { ...typography.screenTitle, fontSize: 20, color: colors.blue300, marginBottom: spacing.lg },
  sectionLabel: { ...typography.bodyStrong, fontSize: 14, color: colors.white, marginBottom: spacing.sm },
  description: { ...typography.body, fontSize: 13.5, lineHeight: 21, color: colors.textOnNavy, marginBottom: spacing.xl },
  inCartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46,158,91,0.14)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  inCartText: { ...typography.caption, color: colors.success, fontWeight: '600', marginLeft: spacing.xs, flex: 1 },
  addButton: { marginBottom: spacing.sm },
});
