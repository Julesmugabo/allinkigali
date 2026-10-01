/**
 * ProductMarketScreen.js — Allingadget and Uruhu Rwiza share this one screen,
 * picked by `route.params.store`. In the style of a B&H/Sephora-type
 * catalog: category rail, search, grid of products. Products route through
 * the existing CartContext/Checkout — the first real reason Cart had to work.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import TextField from '../components/common/TextField';
import EmptyState from '../components/common/EmptyState';
import SettingsHeader from '../components/account/SettingsHeader';

import { useCart } from '../context/CartContext';
import { STORES } from '../data/productCatalogs';
import { formatPrice, normalise } from '../utils/format';
import { colors, typography, spacing, radius, gutter } from '../theme';

const CARD_GAP = spacing.sm;

export default function ProductMarketScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const store = STORES[route.params?.store] || STORES.allingadget;
  const { count } = useCart();

  const [category, setCategory] = useState(null);
  const [search, setSearch] = useState('');

  const products = useMemo(() => {
    const q = normalise(search);
    return store.products.filter((p) => {
      if (category && p.category !== category) return false;
      if (q && !normalise(`${p.brand} ${p.name}`).includes(q)) return false;
      return true;
    });
  }, [store, category, search]);

  const header = (
    <View>
      <View style={styles.topBar}>
        <SettingsHeader title={store.name} onBack={() => navigation.goBack()} />
        <Pressable
          onPress={() => navigation.navigate('Checkout')}
          accessibilityRole="button"
          accessibilityLabel="View cart"
          style={styles.cartButton}
        >
          <MaterialCommunityIcons name="cart-outline" size={20} color={colors.textOnNavy} />
          {count ? (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeLabel}>{count}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
      <Text style={styles.subtitle}>{store.tagline}</Text>

      <TextField
        value={search}
        onChangeText={setSearch}
        placeholder="Search brand or product..."
        icon="magnify"
        style={styles.search}
      />

      <View style={styles.categoryRow}>
        <Pressable accessibilityRole="button" onPress={() => setCategory(null)} style={[styles.categoryChip, !category && styles.categoryChipActive]}>
          <Text style={[styles.categoryChipLabel, !category && styles.categoryChipLabelActive]}>All</Text>
        </Pressable>
        {store.categories.map((c) => {
          const active = category === c.key;
          return (
            <Pressable accessibilityRole="button" key={c.key} onPress={() => setCategory(c.key)} style={[styles.categoryChip, active && styles.categoryChipActive]}>
              <MaterialCommunityIcons name={c.icon} size={13} color={active ? colors.white : colors.blue300} />
              <Text style={[styles.categoryChipLabel, styles.categoryChipLabelSpaced, active && styles.categoryChipLabelActive]} numberOfLines={1}>
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.resultsLabel}>{products.length} {products.length === 1 ? 'product' : 'products'}</Text>
    </View>
  );

  return (
    <GradientBackground>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState tone="dark" icon="package-variant" title="No products match" message="Try a different category or search." />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('ProductDetail', { store: store.key, id: item.id })}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            accessibilityRole="button"
            accessibilityLabel={item.name}
          >
            <View style={styles.cardIconWell}>
              <MaterialCommunityIcons name={item.icon} size={28} color={colors.blue300} />
            </View>
            <Text style={styles.cardBrand}>{item.brand}</Text>
            <Text style={styles.cardName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
          </Pressable>
        )}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: spacing.huge }]}
        showsVerticalScrollIndicator={false}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter },
  topBar: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cartButton: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.breaking,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeLabel: { fontSize: 9.5, fontWeight: '700', color: colors.white },
  subtitle: { ...typography.body, color: colors.textOnNavyFaint, marginTop: -spacing.lg, marginBottom: spacing.lg },
  search: { marginBottom: spacing.md },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.3)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 32,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryChipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  categoryChipLabel: { fontSize: 12, color: colors.textOnNavy },
  categoryChipLabelSpaced: { marginLeft: 4 },
  categoryChipLabelActive: { color: colors.white, fontWeight: '600' },
  resultsLabel: { ...typography.caption, color: colors.textOnNavyFaint, marginBottom: spacing.sm },
  row: { justifyContent: 'space-between' },
  card: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: CARD_GAP,
  },
  cardPressed: { backgroundColor: 'rgba(255,255,255,0.14)' },
  cardIconWell: {
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(55,138,221,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  cardBrand: { fontSize: 10, fontWeight: '700', color: colors.blue300, letterSpacing: 0.3 },
  cardName: { ...typography.body, fontSize: 12.5, color: colors.white, marginTop: 2, marginBottom: spacing.xs, lineHeight: 16 },
  cardPrice: { ...typography.bodyStrong, fontSize: 13, color: colors.blue300 },
});
