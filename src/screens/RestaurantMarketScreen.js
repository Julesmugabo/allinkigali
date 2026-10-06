/**
 * RestaurantMarketScreen.js — Browse & filter Kigali restaurants.
 *
 * Dynamic dependent filters: Cuisine selection changes the Food options shown.
 * Multiple cuisines can be selected; Food list is the union of their foods.
 * All other filters (Occasion, Price, Atmosphere, Dietary, Seating, Features)
 * narrow the already-matching set progressively.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, Image, FlatList, StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import {
  RESTAURANTS, CUISINES, CUISINE_FOODS,
  OCCASIONS, OCCASION_LABELS,
  ATMOSPHERES, ATMOSPHERE_LABELS,
  DIETARY, DIETARY_LABELS,
  SEATINGS, SEATING_LABELS,
  FEATURES, FEATURE_LABELS,
  PRICE_LABELS,
} from '../data/restaurantData';
import { colors, typography, spacing, radius, gutter } from '../theme';

const PRICE_OPTIONS = [1, 2, 3, 4];

// ── Filter logic ──────────────────────────────────────────────────────────────

function filterRestaurants(restaurants, f) {
  return restaurants.filter((r) => {
    if (f.cuisines.length && !f.cuisines.some((c) => r.cuisines.includes(c))) return false;
    if (f.foods.length  && !f.foods.some((food) => r.foods.includes(food)))   return false;
    if (f.occasions.length && !f.occasions.some((o) => r.occasion.includes(o))) return false;
    if (f.price && r.price !== f.price) return false;
    if (f.atmospheres.length && !f.atmospheres.some((a) => r.atmosphere.includes(a))) return false;
    if (f.dietary.length && !f.dietary.every((d) => r.dietary.includes(d)))  return false;
    if (f.seating.length && !f.seating.some((s) => r.seating.includes(s)))   return false;
    if (f.features.length && !f.features.some((ft) => r.features.includes(ft))) return false;
    if (f.rating && r.rating < f.rating) return false;
    return true;
  });
}

const EMPTY_FILTERS = {
  cuisines: [], foods: [], occasions: [], price: null,
  atmospheres: [], dietary: [], seating: [], features: [], rating: null,
};

function toggle(arr, val) {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

// ── Sidebar section ───────────────────────────────────────────────────────────

function FilterSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={ss.section}>
      <Pressable onPress={() => setOpen((o) => !o)} style={ss.sectionHeader} accessibilityRole="button">
        <Text style={ss.sectionTitle}>{title}</Text>
        <MaterialCommunityIcons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.blue300} />
      </Pressable>
      {open && <View style={ss.sectionBody}>{children}</View>}
    </View>
  );
}

function CheckChip({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[ss.chip, active && ss.chipActive]} accessibilityRole="checkbox">
      <Text style={[ss.chipLabel, active && ss.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

// ── Restaurant card ───────────────────────────────────────────────────────────

function RestaurantCard({ restaurant, onPress }) {
  const photo = restaurant.photos?.[0]?.url;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [cs.card, pressed && cs.cardPressed]}>
      <View style={cs.photoWell}>
        {photo
          ? <Image source={{ uri: photo }} style={cs.photo} resizeMode="cover" />
          : <MaterialCommunityIcons name="silverware-fork-knife" size={36} color={colors.blue300} />}
        <View style={cs.priceBadge}>
          <Text style={cs.priceBadgeLabel}>{PRICE_LABELS[restaurant.price]}</Text>
        </View>
      </View>
      <View style={cs.body}>
        <View style={cs.nameRow}>
          <Text style={cs.name} numberOfLines={1}>{restaurant.name}</Text>
          <View style={cs.ratingPill}>
            <MaterialCommunityIcons name="star" size={11} color="#F5C518" />
            <Text style={cs.ratingLabel}>{restaurant.rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={cs.cuisineLabel} numberOfLines={1}>
          {restaurant.cuisines.map((c) => CUISINES.find((x) => x.key === c)?.label || c).join(' · ')}
        </Text>
        <Text style={cs.foods} numberOfLines={1}>{restaurant.foods.slice(0, 4).join(', ')}</Text>
        <Text style={cs.location} numberOfLines={1}>
          <MaterialCommunityIcons name="map-marker-outline" size={11} color={colors.blue300} />
          {' '}{restaurant.location}
        </Text>
      </View>
      <View style={cs.cta}>
        <Text style={cs.ctaLabel}>Book a Table</Text>
        <MaterialCommunityIcons name="arrow-right" size={14} color={colors.white} />
      </View>
    </Pressable>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function RestaurantMarketScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const set = useCallback((key, val) => setFilters((f) => ({ ...f, [key]: val })), []);
  const tog = useCallback((key, val) => setFilters((f) => ({ ...f, [key]: toggle(f[key], val) })), []);

  // Foods available = union of selected cuisine foods
  const availableFoods = useMemo(() => {
    if (!filters.cuisines.length) return [];
    const all = new Set();
    filters.cuisines.forEach((c) => (CUISINE_FOODS[c] || []).forEach((f) => all.add(f)));
    return [...all].sort();
  }, [filters.cuisines]);

  const results = useMemo(() => filterRestaurants(RESTAURANTS, filters), [filters]);

  // Active filter chips
  const activeChips = useMemo(() => {
    const chips = [];
    filters.cuisines.forEach((c) => chips.push({ key: `c-${c}`, label: CUISINES.find((x) => x.key === c)?.label || c, remove: () => tog('cuisines', c) }));
    filters.foods.forEach((f) => chips.push({ key: `f-${f}`, label: f, remove: () => tog('foods', f) }));
    filters.occasions.forEach((o) => chips.push({ key: `o-${o}`, label: OCCASION_LABELS[o] || o, remove: () => tog('occasions', o) }));
    if (filters.price) chips.push({ key: 'price', label: PRICE_LABELS[filters.price], remove: () => set('price', null) });
    filters.atmospheres.forEach((a) => chips.push({ key: `a-${a}`, label: ATMOSPHERE_LABELS[a] || a, remove: () => tog('atmospheres', a) }));
    filters.dietary.forEach((d) => chips.push({ key: `d-${d}`, label: DIETARY_LABELS[d] || d, remove: () => tog('dietary', d) }));
    filters.seating.forEach((s) => chips.push({ key: `s-${s}`, label: SEATING_LABELS[s] || s, remove: () => tog('seating', s) }));
    filters.features.forEach((ft) => chips.push({ key: `ft-${ft}`, label: FEATURE_LABELS[ft] || ft, remove: () => tog('features', ft) }));
    if (filters.rating) chips.push({ key: 'rating', label: `${filters.rating}+ ★`, remove: () => set('rating', null) });
    return chips;
  }, [filters]);

  const hasFilters = activeChips.length > 0;

  const sidebar = (
    <ScrollView style={ss.sidebar} showsVerticalScrollIndicator={false} contentContainerStyle={ss.sidebarContent}>
      <View style={ss.sidebarHeader}>
        <Text style={ss.sidebarTitle}>Filter Restaurants</Text>
        {hasFilters && (
          <Pressable onPress={() => setFilters(EMPTY_FILTERS)} style={ss.clearBtn}>
            <Text style={ss.clearBtnLabel}>Clear all</Text>
          </Pressable>
        )}
      </View>

      <FilterSection title="Cuisine" defaultOpen>
        <View style={ss.chipRow}>
          {CUISINES.map((c) => (
            <CheckChip key={c.key} label={c.label} active={filters.cuisines.includes(c.key)} onPress={() => { tog('cuisines', c.key); set('foods', []); }} />
          ))}
        </View>
      </FilterSection>

      <FilterSection title={`Food${availableFoods.length ? '' : ' (select a cuisine first)'}`} defaultOpen={filters.cuisines.length > 0}>
        {availableFoods.length > 0 ? (
          <View style={ss.chipRow}>
            {availableFoods.map((food) => (
              <CheckChip key={food} label={food} active={filters.foods.includes(food)} onPress={() => tog('foods', food)} />
            ))}
          </View>
        ) : (
          <Text style={ss.hint}>Select a cuisine above to see food options</Text>
        )}
      </FilterSection>

      <FilterSection title="Occasion">
        <View style={ss.chipRow}>
          {OCCASIONS.map((o) => (
            <CheckChip key={o} label={OCCASION_LABELS[o]} active={filters.occasions.includes(o)} onPress={() => tog('occasions', o)} />
          ))}
        </View>
      </FilterSection>

      <FilterSection title="Price">
        <View style={ss.chipRow}>
          {PRICE_OPTIONS.map((p) => (
            <CheckChip key={p} label={PRICE_LABELS[p]} active={filters.price === p} onPress={() => set('price', filters.price === p ? null : p)} />
          ))}
        </View>
      </FilterSection>

      <FilterSection title="Atmosphere">
        <View style={ss.chipRow}>
          {ATMOSPHERES.map((a) => (
            <CheckChip key={a} label={ATMOSPHERE_LABELS[a]} active={filters.atmospheres.includes(a)} onPress={() => tog('atmospheres', a)} />
          ))}
        </View>
      </FilterSection>

      <FilterSection title="Dietary">
        <View style={ss.chipRow}>
          {DIETARY.map((d) => (
            <CheckChip key={d} label={DIETARY_LABELS[d]} active={filters.dietary.includes(d)} onPress={() => tog('dietary', d)} />
          ))}
        </View>
      </FilterSection>

      <FilterSection title="Seating">
        <View style={ss.chipRow}>
          {SEATINGS.map((s) => (
            <CheckChip key={s} label={SEATING_LABELS[s]} active={filters.seating.includes(s)} onPress={() => tog('seating', s)} />
          ))}
        </View>
      </FilterSection>

      <FilterSection title="Features">
        <View style={ss.chipRow}>
          {FEATURES.map((ft) => (
            <CheckChip key={ft} label={FEATURE_LABELS[ft]} active={filters.features.includes(ft)} onPress={() => tog('features', ft)} />
          ))}
        </View>
      </FilterSection>

      <FilterSection title="Rating">
        <View style={ss.chipRow}>
          {[4.5, 4.0, 3.5].map((r) => (
            <CheckChip key={r} label={`${r}+ ★`} active={filters.rating === r} onPress={() => set('rating', filters.rating === r ? null : r)} />
          ))}
        </View>
      </FilterSection>
    </ScrollView>
  );

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button">
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Book a Restaurant</Text>
          <Pressable onPress={() => setSidebarOpen((o) => !o)} style={[styles.filterBtn, hasFilters && styles.filterBtnActive]} accessibilityRole="button">
            <MaterialCommunityIcons name="tune" size={18} color={colors.white} />
            {hasFilters && <View style={styles.filterDot} />}
          </Pressable>
        </View>

        <View style={styles.body}>
          {/* Sidebar overlay — hidden by default, toggled by filter button */}
          {sidebarOpen && (
            <Pressable style={styles.backdrop} onPress={() => setSidebarOpen(false)} />
          )}
          {sidebarOpen && (
            <View style={styles.sidebarPane}>
              {sidebar}
              <Pressable onPress={() => setSidebarOpen(false)} style={styles.applyBtn}>
                <Text style={styles.applyBtnLabel}>Show {results.length} restaurant{results.length !== 1 ? 's' : ''}</Text>
              </Pressable>
            </View>
          )}

          {/* Results */}
          <View style={styles.results}>
            {/* Active filter chips */}
            {activeChips.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={styles.chipsContent}>
                {activeChips.map((chip) => (
                  <Pressable key={chip.key} onPress={chip.remove} style={styles.activeChip}>
                    <Text style={styles.activeChipLabel}>{chip.label}</Text>
                    <MaterialCommunityIcons name="close" size={12} color={colors.white} />
                  </Pressable>
                ))}
                <Pressable onPress={() => setFilters(EMPTY_FILTERS)} style={styles.clearAllChip}>
                  <Text style={styles.clearAllChipLabel}>Clear all</Text>
                </Pressable>
              </ScrollView>
            )}

            <Text style={styles.resultCount}>
              {results.length} restaurant{results.length !== 1 ? 's' : ''}{hasFilters ? ' match your filters' : ' in Kigali'}
            </Text>

            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <RestaurantCard
                  restaurant={item}
                  onPress={() => navigation.navigate('RestaurantDetail', { id: item.id })}
                />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <MaterialCommunityIcons name="silverware-fork-knife" size={48} color={colors.blue300} style={{ marginBottom: spacing.md }} />
                  <Text style={styles.emptyTitle}>No restaurants match</Text>
                  <Text style={styles.emptyDesc}>Try removing one of your filters.</Text>
                  <Pressable onPress={() => setFilters(EMPTY_FILTERS)} style={styles.emptyBtn}>
                    <Text style={styles.emptyBtnLabel}>Clear filters</Text>
                  </Pressable>
                </View>
              }
            />
          </View>
        </View>
      </View>
    </GradientBackground>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: gutter, paddingBottom: spacing.sm },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  headerTitle: { flex: 1, ...typography.bodyStrong, fontSize: 18, color: colors.white },
  filterBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  filterBtnActive: { backgroundColor: colors.blue500 },
  filterDot: { position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#F5C518' },

  body: { flex: 1 },

  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9, backgroundColor: 'rgba(0,0,0,0.45)' },
  sidebarPane: {
    position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 10,
    width: 300, maxWidth: '88%',
    backgroundColor: '#042C53',
    borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: 'rgba(133,183,235,0.2)',
  },

  results: { flex: 1 },
  chipsRow: { maxHeight: 44 },
  chipsContent: { paddingHorizontal: gutter, paddingVertical: spacing.xs, gap: spacing.xs },
  activeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.blue500, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 5, gap: 4 },
  activeChipLabel: { fontSize: 11.5, color: colors.white, fontWeight: '600' },
  clearAllChip: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  clearAllChipLabel: { fontSize: 11.5, color: colors.blue300 },

  resultCount: { fontSize: 12, color: colors.textOnNavyFaint, paddingHorizontal: gutter, paddingVertical: spacing.xs },
  list: { paddingHorizontal: gutter, paddingBottom: spacing.huge },

  empty: { alignItems: 'center', paddingTop: spacing.huge },
  emptyTitle: { ...typography.bodyStrong, color: colors.white, marginBottom: spacing.xs },
  emptyDesc: { fontSize: 13, color: colors.textOnNavyFaint, marginBottom: spacing.lg },
  emptyBtn: { backgroundColor: colors.blue500, borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  emptyBtnLabel: { fontSize: 13, fontWeight: '700', color: colors.white },

  applyBtn: { margin: spacing.md, backgroundColor: colors.blue500, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  applyBtnLabel: { fontSize: 14, fontWeight: '700', color: colors.white },
});

// Sidebar styles
const ss = StyleSheet.create({
  sidebar: { flex: 1 },
  sidebarContent: { paddingBottom: spacing.huge },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(133,183,235,0.2)' },
  sidebarTitle: { fontSize: 13, fontWeight: '700', color: colors.white },
  clearBtn: {},
  clearBtnLabel: { fontSize: 12, color: colors.blue300, fontWeight: '600' },

  section: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(133,183,235,0.15)' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.white },
  sectionBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.3)', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 5, marginBottom: 3 },
  chipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  chipLabel: { fontSize: 11, color: colors.textOnNavy },
  chipLabelActive: { color: colors.white, fontWeight: '600' },

  hint: { fontSize: 11.5, color: colors.textOnNavyFaint, fontStyle: 'italic', paddingBottom: spacing.sm },
});

// Card styles
const cs = StyleSheet.create({
  card: { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.2)', borderRadius: radius.lg, marginBottom: spacing.md, overflow: 'hidden' },
  cardPressed: { backgroundColor: 'rgba(255,255,255,0.12)' },
  photoWell: { height: 160, backgroundColor: 'rgba(55,138,221,0.14)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  priceBadge: { position: 'absolute', top: spacing.sm, right: spacing.sm, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  priceBadgeLabel: { fontSize: 11, fontWeight: '700', color: '#F5C518' },
  body: { padding: spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.white },
  ratingPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,197,24,0.15)', borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 3, gap: 3, marginLeft: spacing.sm },
  ratingLabel: { fontSize: 11, fontWeight: '700', color: '#F5C518' },
  cuisineLabel: { fontSize: 12, color: colors.blue300, marginBottom: 3 },
  foods: { fontSize: 11.5, color: colors.textOnNavyFaint, marginBottom: 5 },
  location: { fontSize: 11.5, color: colors.textOnNavyFaint },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue500, paddingVertical: spacing.sm + 2, gap: spacing.xs },
  ctaLabel: { fontSize: 13, fontWeight: '700', color: colors.white },
});
