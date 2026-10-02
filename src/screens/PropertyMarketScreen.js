/**
 * PropertyMarketScreen.js — Inzu zamacye (rent) and House for Sale (sale).
 * Same screen, same data shape, told apart by `route.params.mode` — in the
 * style of Zillow: photo-led cards, price, beds/baths, filter by location.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, ScrollView, StyleSheet, Image } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import EmptyState from '../components/common/EmptyState';
import PrimaryButton from '../components/common/PrimaryButton';
import SettingsHeader from '../components/account/SettingsHeader';
import LocationFilter from '../components/shop/LocationFilter';
import PropertyMap from '../components/shop/PropertyMap';

import { useProperties } from '../context/PropertyContext';
import { PROVINCES } from '../data/rwandaLocations';
import { getDistrictCoords } from '../data/districtCoords';
import { formatPrice } from '../utils/format';
import { colors, typography, spacing, radius, gutter } from '../theme';

const MODE_META = {
  rent: { title: 'Inzu zamacye', subtitle: 'Houses to rent across Rwanda', priceSuffix: '/month', emptyIcon: 'home-search-outline' },
  sale: { title: 'House for Sale', subtitle: 'Houses for sale across Rwanda', priceSuffix: '', emptyIcon: 'home-city-outline' },
};

function provinceLabel(key) {
  return PROVINCES.find((p) => p.key === key)?.label || key;
}

export default function PropertyMarketScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const mode = route.params?.mode === 'sale' ? 'sale' : 'rent';
  const meta = MODE_META[mode];
  const { properties } = useProperties();

  const [province, setProvince] = useState(null);
  const [district, setDistrict] = useState(null);
  const [sector, setSector] = useState(null);
  const [minBeds, setMinBeds] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'

  const listings = useMemo(() => {
    return properties.filter((p) => {
      if (p.listingType !== mode) return false;
      if (province && p.province !== province) return false;
      if (district && p.district !== district) return false;
      if (sector && p.sector !== sector) return false;
      if (minBeds && p.bedrooms < minBeds) return false;
      return true;
    });
  }, [properties, mode, province, district, sector, minBeds]);

  // Listings with approximate coordinates for the map
  const mappableListings = useMemo(() => {
    return listings.map((p) => {
      const coords = getDistrictCoords(p.district);
      return coords ? { ...p, lat: coords.lat, lng: coords.lng } : p;
    });
  }, [listings]);

  const header = (
    <View>
      <SettingsHeader title={meta.title} onBack={() => navigation.goBack()} />
      <Text style={styles.subtitle}>{meta.subtitle}</Text>

      <View style={styles.ctaRow}>
        <PrimaryButton
          label={mode === 'sale' ? 'List your house' : 'List your house'}
          icon="plus"
          onPress={() => navigation.navigate('ListProperty', { listingType: mode })}
          style={styles.listButton}
        />
        <Pressable
          onPress={() => navigation.navigate('ListingPlans', { listingType: mode, locked: true })}
          accessibilityRole="button"
          style={styles.plansBtn}
        >
          <MaterialCommunityIcons name="tag-outline" size={16} color={colors.blue300} />
          <Text style={styles.plansBtnLabel}>View plans</Text>
        </Pressable>
      </View>

      <LocationFilter
        province={province}
        district={district}
        sector={sector}
        onChange={(next) => {
          setProvince(next.province);
          setDistrict(next.district);
          setSector(next.sector);
        }}
      />

      <Text style={styles.label}>Bedrooms</Text>
      <View style={styles.bedsRow}>
        {[null, 1, 2, 3, 4].map((n) => {
          const active = minBeds === n;
          return (
            <Pressable accessibilityRole="button" key={n || 'any'} onPress={() => setMinBeds(n)} style={[styles.bedsChip, active && styles.bedsChipActive]}>
              <Text style={[styles.bedsChipLabel, active && styles.bedsChipLabelActive]}>{n ? `${n}+` : 'Any'}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* List / Map toggle */}
      <View style={styles.viewToggleRow}>
        <Text style={styles.resultsLabel}>{listings.length} {listings.length === 1 ? 'house' : 'houses'} found</Text>
        <View style={styles.viewToggle}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setViewMode('list')}
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
          >
            <MaterialCommunityIcons name="view-list-outline" size={14} color={viewMode === 'list' ? colors.white : colors.blue300} />
            <Text style={[styles.toggleLabel, viewMode === 'list' && styles.toggleLabelActive]}>List</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setViewMode('map')}
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
          >
            <MaterialCommunityIcons name="map-outline" size={14} color={viewMode === 'map' ? colors.white : colors.blue300} />
            <Text style={[styles.toggleLabel, viewMode === 'map' && styles.toggleLabelActive]}>Map</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  if (viewMode === 'map') {
    return (
      <GradientBackground>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.huge }}
        >
          {header}
          <PropertyMap
            listings={mappableListings}
            onSelect={(id) => navigation.navigate('PropertyDetail', { id })}
            style={styles.mapFull}
          />
        </ScrollView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState tone="dark" icon={meta.emptyIcon} title="No houses match" message="Try a different location or bedroom count." />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            accessibilityRole="button"
            accessibilityLabel={item.title}
          >
            {/* Photo well */}
            <View style={styles.photoWell}>
              {item.photos?.[0]?.url
                ? <Image source={{ uri: item.photos[0].url }} style={styles.photoWellImage} resizeMode="cover" />
                : <MaterialCommunityIcons name={mode === 'rent' ? 'home-search-outline' : 'home-city-outline'} size={40} color={colors.blue300} />}
              {/* Status badge */}
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeLabel}>{mode === 'rent' ? 'For rent' : 'For sale'}</Text>
              </View>
              {/* Heart */}
              <View style={styles.heartBtn}>
                <MaterialCommunityIcons name="heart-outline" size={16} color={colors.white} />
              </View>
            </View>

            {/* Card body */}
            <View style={styles.cardBody}>
              <Text style={styles.cardPrice}>
                {formatPrice(item.price)}
                {meta.priceSuffix ? <Text style={styles.cardPriceSuffix}>{meta.priceSuffix}</Text> : null}
              </Text>
              {/* Stats strip */}
              <View style={styles.statsStrip}>
                <Text style={styles.statItem}>
                  <Text style={styles.statValue}>{item.bedrooms}</Text>
                  <Text style={styles.statUnit}> bds</Text>
                </Text>
                <Text style={styles.statSep}>|</Text>
                <Text style={styles.statItem}>
                  <Text style={styles.statValue}>{item.bathrooms}</Text>
                  <Text style={styles.statUnit}> ba</Text>
                </Text>
                <Text style={styles.statSep}>|</Text>
                <Text style={styles.statItem}>
                  <Text style={styles.statValue}>{item.sizeSqm}</Text>
                  <Text style={styles.statUnit}> m²</Text>
                </Text>
              </View>
              <Text style={styles.cardAddress} numberOfLines={1}>
                {item.sector}, {provinceLabel(item.province)}
              </Text>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            </View>
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
  subtitle: { ...typography.body, color: colors.textOnNavyFaint, marginBottom: spacing.lg },
  ctaRow: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.sm, marginBottom: spacing.lg },
  listButton: { flex: 1, marginBottom: 0 },
  plansBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.blue500, borderRadius: radius.md, paddingHorizontal: spacing.lg },
  plansBtnLabel: { fontSize: 14, fontWeight: '600', color: colors.blue300, marginLeft: spacing.sm },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.blue300,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  bedsRow: { flexDirection: 'row', marginBottom: spacing.md },
  bedsChip: {
    width: 48,
    height: 32,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.3)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  bedsChipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  bedsChipLabel: { fontSize: 12, color: colors.textOnNavy },
  bedsChipLabelActive: { color: colors.white, fontWeight: '600' },
  viewToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  resultsLabel: { ...typography.caption, color: colors.textOnNavyFaint },
  viewToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.pill, padding: 2 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5, gap: 4 },
  toggleBtnActive: { backgroundColor: colors.blue500 },
  toggleLabel: { fontSize: 11.5, color: colors.blue300, fontWeight: '600' },
  toggleLabelActive: { color: colors.white },
  mapFull: { height: 500 },
  // Zillow-style card: full width, photo at top
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardPressed: { opacity: 0.85 },

  photoWell: {
    height: 180,
    backgroundColor: 'rgba(55,138,221,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoWellImage: { width: '100%', height: '100%' },
  statusBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(4,44,83,0.88)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusBadgeLabel: { fontSize: 10.5, fontWeight: '700', color: colors.blue300 },
  heartBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardBody: { padding: spacing.md },
  cardPrice: { fontSize: 20, fontWeight: '800', color: colors.white, marginBottom: spacing.xs },
  cardPriceSuffix: { fontSize: 13, fontWeight: '400', color: colors.textOnNavyFaint },

  statsStrip: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  statItem: {},
  statValue: { fontSize: 13.5, fontWeight: '700', color: colors.white },
  statUnit: { fontSize: 12, color: colors.textOnNavyFaint },
  statSep: { fontSize: 13, color: colors.textOnNavyFaint, marginHorizontal: spacing.sm },

  cardAddress: { fontSize: 12, color: colors.textOnNavyFaint, marginBottom: 2 },
  cardTitle: { fontSize: 12.5, color: colors.textOnNavy },
});
