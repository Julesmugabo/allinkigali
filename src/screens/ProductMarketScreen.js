/**
 * ProductMarketScreen.js — shared by Allingadget (grid layout) and Uruhu Rwiza
 * (shelf layout). The `store.layout` field in productCatalogs drives which
 * mode is rendered.
 *
 * Grid (Allingadget): category filter rail + search bar + 2-column FlatList.
 * Shelf (Uruhu Rwiza): sticky category tabs + one horizontal card row per
 *   category (Sephora-style). Tapping a tab scrolls to that section.
 */
import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import TextField from '../components/common/TextField';
import EmptyState from '../components/common/EmptyState';
import SettingsHeader from '../components/account/SettingsHeader';

import { useCart } from '../context/CartContext';
import { STORES, BADGE_META } from '../data/productCatalogs';
import { formatPrice, normalise } from '../utils/format';
import { colors, typography, spacing, radius, gutter } from '../theme';

// ---------------------------------------------------------------------------
// Shared: top-bar with title + cart button
// ---------------------------------------------------------------------------
function TopBar({ store, navigation, count }) {
  return (
    <View style={shared.topBar}>
      <SettingsHeader title={store.name} onBack={() => navigation.goBack()} />
      <Pressable
        onPress={() => navigation.navigate('Checkout')}
        accessibilityRole="button"
        accessibilityLabel="View cart"
        style={shared.cartButton}
      >
        <MaterialCommunityIcons name="cart-outline" size={20} color={colors.textOnNavy} />
        {count ? (
          <View style={shared.cartBadge}>
            <Text style={shared.cartBadgeLabel}>{count}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// GRID layout — Allingadget (B&H-style)
// ---------------------------------------------------------------------------
function GridLayout({ store, navigation, insets, cartCount }) {
  const [category, setCategory] = useState(null);
  const [search, setSearch] = useState('');
  const { addItem } = useCart();

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
      <TopBar store={store} navigation={navigation} count={cartCount} />
      <Text style={shared.subtitle}>{store.tagline}</Text>
      <TextField
        value={search}
        onChangeText={setSearch}
        placeholder="Search brand or product..."
        icon="magnify"
        style={grid.search}
      />
      <View style={grid.categoryRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setCategory(null)}
          style={[grid.categoryChip, !category && grid.categoryChipActive]}
        >
          <Text style={[grid.categoryChipLabel, !category && grid.categoryChipLabelActive]}>All</Text>
        </Pressable>
        {store.categories.map((c) => {
          const active = category === c.key;
          return (
            <Pressable
              accessibilityRole="button"
              key={c.key}
              onPress={() => setCategory(c.key)}
              style={[grid.categoryChip, active && grid.categoryChipActive]}
            >
              <MaterialCommunityIcons name={c.icon} size={13} color={active ? colors.white : colors.blue300} />
              <Text
                style={[
                  grid.categoryChipLabel,
                  grid.categoryChipLabelSpaced,
                  active && grid.categoryChipLabelActive,
                ]}
                numberOfLines={1}
              >
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={shared.resultsLabel}>
        {products.length} {products.length === 1 ? 'product' : 'products'}
      </Text>
    </View>
  );

  return (
    <GradientBackground>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={grid.row}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState tone="dark" icon="package-variant" title="No products match" message="Try a different category or search." />
        }
        renderItem={({ item }) => {
          const badge = item.badge ? BADGE_META[item.badge] : null;
          return (
            <Pressable
              onPress={() => navigation.navigate('ProductDetail', { store: store.key, id: item.id })}
              style={({ pressed }) => [grid.card, pressed && grid.cardPressed]}
              accessibilityRole="button"
              accessibilityLabel={item.name}
            >
              {badge && (
                <View style={[grid.badge, { backgroundColor: badge.backgroundColor }]}>
                  <Text style={[grid.badgeLabel, { color: badge.color }]}>{badge.label}</Text>
                </View>
              )}
              <View style={grid.cardIconWell}>
                {item.image
                  ? <Image source={{ uri: item.image }} style={grid.cardImage} resizeMode="cover" />
                  : <MaterialCommunityIcons name={item.icon} size={28} color={colors.blue300} />}
              </View>
              <Text style={grid.cardBrand}>{item.brand}</Text>
              <Text style={grid.cardName} numberOfLines={2}>{item.name}</Text>
              <View style={grid.cardFooter}>
                <Text style={grid.cardPrice}>{formatPrice(item.price)}</Text>
                <Pressable
                  onPress={(e) => { e.stopPropagation?.(); addItem(item, store); }}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${item.name} to cart`}
                  style={grid.addBtn}
                >
                  <MaterialCommunityIcons name="plus" size={16} color={colors.white} />
                </Pressable>
              </View>
            </Pressable>
          );
        }}
        contentContainerStyle={[
          shared.contentPad,
          { paddingTop: insets.top + spacing.md, paddingBottom: spacing.huge },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </GradientBackground>
  );
}

// ---------------------------------------------------------------------------
// SHELF layout — Uruhu Rwiza (Sephora-style)
// ---------------------------------------------------------------------------
const SHELF_CARD_WIDTH = 152;
const SHELF_CARD_HEIGHT = 210;

function ShelfProductCard({ item, navigation, storeKey, wishlist, toggleWish, onAdd }) {
  const badge = item.badge ? BADGE_META[item.badge] : null;
  const wished = wishlist.has(item.id);

  return (
    <Pressable
      onPress={() => navigation.navigate('ProductDetail', { store: storeKey, id: item.id })}
      accessibilityRole="button"
      accessibilityLabel={item.name}
      style={({ pressed }) => [shelf.card, pressed && shelf.cardPressed]}
    >
      {/* Badge top-left */}
      {badge && (
        <View style={[shelf.badge, { backgroundColor: badge.backgroundColor }]}>
          <Text style={shelf.badgeLabel}>{badge.label}</Text>
        </View>
      )}
      {/* Heart top-right */}
      <Pressable
        onPress={(e) => { e.stopPropagation?.(); toggleWish(item.id); }}
        accessibilityRole="button"
        accessibilityLabel={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        style={shelf.heartBtn}
      >
        <MaterialCommunityIcons
          name={wished ? 'heart' : 'heart-outline'}
          size={17}
          color={wished ? '#e05f6a' : colors.textOnNavyFaint}
        />
      </Pressable>

      {/* Image / icon well */}
      <View style={shelf.iconWell}>
        {item.image
          ? <Image source={{ uri: item.image }} style={shelf.cardImage} resizeMode="cover" />
          : <MaterialCommunityIcons name={item.icon} size={36} color={colors.blue300} />}
      </View>

      {/* Text */}
      <View style={shelf.textArea}>
        <Text style={shelf.brand} numberOfLines={1}>{item.brand}</Text>
        <Text style={shelf.name} numberOfLines={2}>{item.name}</Text>
      </View>

      {/* Price + add */}
      <View style={shelf.cardFooter}>
        <Text style={shelf.price}>{formatPrice(item.price)}</Text>
        <Pressable
          onPress={(e) => { e.stopPropagation?.(); onAdd(item); }}
          accessibilityRole="button"
          accessibilityLabel={`Add ${item.name} to cart`}
          style={shelf.addBtn}
        >
          <MaterialCommunityIcons name="plus" size={16} color={colors.white} />
        </Pressable>
      </View>
    </Pressable>
  );
}

function ShelfLayout({ store, navigation, insets, cartCount }) {
  const { addItem, count } = useCart();
  const [activeTab, setActiveTab] = useState('all');
  const [wishlist, setWishlist] = useState(new Set());
  const scrollRef = useRef(null);
  // sectionOffsets[categoryKey] = measured Y offset for scroll-to
  const sectionOffsets = useRef({});

  function toggleWish(id) {
    setWishlist((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleTabPress(key) {
    setActiveTab(key);
    if (key === 'all') {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      const y = sectionOffsets.current[key];
      if (y != null) scrollRef.current?.scrollTo({ y, animated: true });
    }
  }

  // Which sections to display
  const visibleCategories = activeTab === 'all'
    ? store.categories
    : store.categories.filter((c) => c.key === activeTab);

  return (
    <GradientBackground>
      {/* Fixed header above scroll */}
      <View style={[shelf.fixedHeader, { paddingTop: insets.top + spacing.xs }]}>
        <TopBar store={store} navigation={navigation} count={cartCount} />
        <Text style={shared.subtitle}>{store.tagline}</Text>

        {/* Category tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={shelf.tabsContent}
          style={shelf.tabsRow}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => handleTabPress('all')}
            style={[shelf.tab, activeTab === 'all' && shelf.tabActive]}
          >
            <Text style={[shelf.tabLabel, activeTab === 'all' && shelf.tabLabelActive]}>
              All Products
            </Text>
          </Pressable>
          {store.categories.map((c) => {
            const active = activeTab === c.key;
            return (
              <Pressable
                key={c.key}
                accessibilityRole="button"
                onPress={() => handleTabPress(c.key)}
                style={[shelf.tab, active && shelf.tabActive]}
              >
                <Text style={[shelf.tabLabel, active && shelf.tabLabelActive]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Scrollable sections */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[shelf.sectionsContent, { paddingBottom: insets.bottom + spacing.huge }]}
      >
        {visibleCategories.map((cat) => {
          const catProducts = store.products.filter((p) => p.category === cat.key);
          return (
            <View
              key={cat.key}
              onLayout={(e) => { sectionOffsets.current[cat.key] = e.nativeEvent.layout.y; }}
              style={shelf.section}
            >
              {/* Section heading */}
              <View style={shelf.sectionHeader}>
                <View style={shelf.sectionIconWell}>
                  <MaterialCommunityIcons name={cat.icon} size={14} color={colors.blue300} />
                </View>
                <Text style={shelf.sectionTitle}>{cat.label}</Text>
                <Text style={shelf.sectionCount}>{catProducts.length}</Text>
              </View>

              {/* Horizontal card row */}
              <FlatList
                data={catProducts}
                keyExtractor={(p) => p.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={shelf.cardRow}
                renderItem={({ item }) => (
                  <ShelfProductCard
                    item={item}
                    navigation={navigation}
                    storeKey={store.key}
                    wishlist={wishlist}
                    toggleWish={toggleWish}
                    onAdd={(p) => addItem(p, 1)}
                  />
                )}
              />
            </View>
          );
        })}
      </ScrollView>
    </GradientBackground>
  );
}

// ---------------------------------------------------------------------------
// Entry point — picks layout based on store.layout
// ---------------------------------------------------------------------------
export default function ProductMarketScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const store = STORES[route.params?.store] || STORES.allingadget;
  const { count } = useCart();

  if (store.layout === 'shelf') {
    return <ShelfLayout store={store} navigation={navigation} insets={insets} cartCount={count} />;
  }
  return <GridLayout store={store} navigation={navigation} insets={insets} cartCount={count} />;
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------
const shared = StyleSheet.create({
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
  resultsLabel: { ...typography.caption, color: colors.textOnNavyFaint, marginBottom: spacing.sm },
  contentPad: { paddingHorizontal: gutter },
});

// ---------------------------------------------------------------------------
// Grid styles
// ---------------------------------------------------------------------------
const grid = StyleSheet.create({
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
  row: { justifyContent: 'space-between' },
  card: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardPressed: { backgroundColor: 'rgba(255,255,255,0.14)' },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.xs,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginBottom: spacing.xs,
  },
  badgeLabel: { fontSize: 8.5, fontWeight: '800', letterSpacing: 0.4 },
  cardIconWell: {
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(55,138,221,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: '100%' },
  cardBrand: { fontSize: 10, fontWeight: '700', color: colors.blue300, letterSpacing: 0.3 },
  cardName: { ...typography.body, fontSize: 12.5, color: colors.white, marginTop: 2, marginBottom: spacing.xs, lineHeight: 16 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardPrice: { ...typography.bodyStrong, fontSize: 13, color: colors.blue300 },
  addBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.blue500,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ---------------------------------------------------------------------------
// Shelf styles
// ---------------------------------------------------------------------------
const shelf = StyleSheet.create({
  fixedHeader: {
    paddingHorizontal: gutter,
    backgroundColor: colors.navy800,
    zIndex: 10,
  },
  tabsRow: { marginBottom: spacing.sm },
  tabsContent: { paddingRight: spacing.lg },
  tab: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md + 2,
    height: 32,
    justifyContent: 'center',
    marginRight: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.3)',
  },
  tabActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  tabLabel: { fontSize: 12, color: colors.textOnNavy },
  tabLabelActive: { color: colors.white, fontWeight: '700' },

  sectionsContent: { paddingHorizontal: 0 },

  section: { marginBottom: spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gutter,
    marginBottom: spacing.sm,
  },
  sectionIconWell: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(55,138,221,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  sectionTitle: { ...typography.bodyStrong, color: colors.white, flex: 1 },
  sectionCount: {
    fontSize: 11,
    color: colors.textOnNavyFaint,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  cardRow: { paddingHorizontal: gutter, paddingRight: gutter + spacing.md },

  // Individual shelf card
  card: {
    width: SHELF_CARD_WIDTH,
    height: SHELF_CARD_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  textArea: { marginTop: spacing.xs },
  cardPressed: { backgroundColor: 'rgba(255,255,255,0.15)' },

  badge: {
    position: 'absolute',
    top: 7,
    left: 7,
    borderRadius: radius.xs,
    paddingHorizontal: 5,
    paddingVertical: 2,
    zIndex: 2,
  },
  badgeLabel: { fontSize: 7.5, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  heartBtn: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  iconWell: {
    height: 90,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(55,138,221,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    marginTop: 6,
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: '100%' },

  brand: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.blue300,
    letterSpacing: 0.3,
    marginBottom: 1,
  },
  name: {
    fontSize: 12,
    color: colors.white,
    lineHeight: 15,
    marginBottom: spacing.xs,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  price: { fontSize: 12.5, fontWeight: '700', color: colors.blue300 },
  addBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.blue500,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
