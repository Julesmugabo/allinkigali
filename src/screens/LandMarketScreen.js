/**
 * LandMarketScreen.js — Ibibanza (land plots), in the style of LandWatch:
 * straight to the plots, no marketing/intro screen. Filter by province,
 * district and sector, plus the plot type.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, ScrollView, StyleSheet, Image } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import EmptyState from '../components/common/EmptyState';
import SettingsHeader from '../components/account/SettingsHeader';
import LocationFilter from '../components/shop/LocationFilter';
import PropertyMap from '../components/shop/PropertyMap';

import { LAND_TYPES } from '../data/landListings';
import { useLand } from '../context/LandContext';
import { PROVINCES } from '../data/rwandaLocations';
import { getDistrictCoords } from '../data/districtCoords';
import { formatPrice } from '../utils/format';
import { colors, typography, spacing, radius, gutter } from '../theme';

const TYPE_FILTERS = [{ key: null, label: 'All types' }, ...Object.entries(LAND_TYPES).map(([key, v]) => ({ key, label: v.label }))];

function provinceLabel(key) {
  return PROVINCES.find((p) => p.key === key)?.label || key;
}

export default function LandMarketScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { listings: allListings, isLoading } = useLand();
  const [province, setProvince] = useState(null);
  const [district, setDistrict] = useState(null);
  const [sector, setSector] = useState(null);
  const [type, setType] = useState(null);
  const [viewMode, setViewMode] = useState('list');

  const listings = useMemo(() => {
    return allListings.filter((l) => {
      if (province && l.province !== province) return false;
      if (district && l.district !== district) return false;
      if (sector && l.sector !== sector) return false;
      if (type && l.type !== type) return false;
      return true;
    });
  }, [allListings, province, district, sector, type]);

  const mappableListings = useMemo(() => {
    return listings.map((l) => {
      const coords = getDistrictCoords(l.district);
      return coords ? { ...l, lat: coords.lat, lng: coords.lng } : l;
    });
  }, [listings]);

  const header = (
    <View>
      <SettingsHeader title="Ibibanza" onBack={() => navigation.goBack()} />
      <Text style={styles.subtitle}>Land for sale across Rwanda</Text>

      <View style={styles.ctaRow}>
        <Pressable
          onPress={() => navigation.navigate('ListLand')}
          accessibilityRole="button"
          style={[styles.listBtn, styles.ctaFlex]}
        >
          <MaterialCommunityIcons name="plus" size={16} color={colors.white} />
          <Text style={styles.listBtnLabel}>List your plot</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('ListingPlans', { listingType: 'land', locked: true })}
          accessibilityRole="button"
          style={[styles.plansBtn, styles.ctaFlex]}
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

      <Text style={styles.label}>Type</Text>
      <View style={styles.typeRow}>
        {TYPE_FILTERS.map((t) => {
          const active = type === t.key;
          return (
            <Pressable accessibilityRole="button"
              key={t.key || 'all'}
              onPress={() => setType(t.key)}
              style={[styles.typeChip, active && styles.typeChipActive]}
            >
              <Text style={[styles.typeChipLabel, active && styles.typeChipLabelActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* List / Map toggle */}
      <View style={styles.viewToggleRow}>
        <Text style={styles.resultsLabel}>{listings.length} {listings.length === 1 ? 'plot' : 'plots'} found</Text>
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
            onSelect={(id) => navigation.navigate('LandDetail', { id })}
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
          <EmptyState tone="dark" icon="terrain" title="No plots match" message="Try a different location or type." />
        }
        renderItem={({ item }) => {
          const typeMeta = LAND_TYPES[item.type];
          return (
            <Pressable
              onPress={() => navigation.navigate('LandDetail', { id: item.id })}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              {/* Photo well */}
              <View style={styles.photoWell}>
                {item.photos?.[0]?.url
                  ? <Image source={{ uri: item.photos[0].url }} style={styles.photoWellImage} resizeMode="cover" />
                  : <MaterialCommunityIcons name={typeMeta.icon} size={36} color={colors.blue300} />}
                {/* type badge overlay */}
                <View style={styles.photoBadge}>
                  <Text style={styles.photoBadgeLabel}>{typeMeta.label}</Text>
                </View>
                {/* heart */}
                <View style={styles.heartBtn}>
                  <MaterialCommunityIcons name="heart-outline" size={16} color={colors.white} />
                </View>
              </View>

              {/* Card body */}
              <View style={styles.cardBody}>
                {/* Price • size */}
                <Text style={styles.cardPriceLine}>
                  <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
                  <Text style={styles.cardPriceSep}> · </Text>
                  <Text style={styles.cardSize}>{item.sizeSqm.toLocaleString()} m²</Text>
                </Text>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardMeta}>
                  {item.sector}, {provinceLabel(item.province)}
                </Text>
                {/* Bottom row: agent + contact */}
                <View style={styles.cardFooter}>
                  <View style={styles.agentRow}>
                    <View style={styles.agentAvatar}>
                      <MaterialCommunityIcons name="account-outline" size={13} color={colors.blue300} />
                    </View>
                    <Text style={styles.agentName} numberOfLines={1}>Owner · {item.phone}</Text>
                  </View>
                  <View style={styles.contactBtn}>
                    <Text style={styles.contactBtnLabel}>Contact</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: spacing.huge }]}
        showsVerticalScrollIndicator={false}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter },
  subtitle: { ...typography.body, color: colors.textOnNavyFaint, marginBottom: spacing.sm },
  ctaRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  ctaFlex: { flex: 1, marginBottom: 0 },
  listBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue500, borderRadius: radius.md, paddingVertical: spacing.md, marginBottom: spacing.lg },
  listBtnLabel: { fontSize: 14, fontWeight: '700', color: colors.white, marginLeft: spacing.sm },
  plansBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.blue500, borderRadius: radius.md, paddingVertical: spacing.md },
  plansBtnLabel: { fontSize: 14, fontWeight: '600', color: colors.blue300, marginLeft: spacing.sm },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.blue300,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  typeChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.3)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 32,
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  typeChipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  typeChipLabel: { fontSize: 12, color: colors.textOnNavy },
  typeChipLabelActive: { color: colors.white, fontWeight: '600' },
  viewToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  resultsLabel: { ...typography.caption, color: colors.textOnNavyFaint },
  viewToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.pill, padding: 2 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5, gap: 4 },
  toggleBtnActive: { backgroundColor: colors.blue500 },
  toggleLabel: { fontSize: 11.5, color: colors.blue300, fontWeight: '600' },
  toggleLabelActive: { color: colors.white },
  mapFull: { height: 500 },
  // LandWatch-style card: full width, photo at top
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
    height: 150,
    backgroundColor: 'rgba(55,138,221,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoWellImage: { width: '100%', height: '100%' },
  photoBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(4,44,83,0.82)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  photoBadgeLabel: { fontSize: 10.5, fontWeight: '700', color: colors.blue300 },
  heartBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardBody: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  cardPriceLine: { marginBottom: spacing.xs },
  cardPrice: { fontSize: 16, fontWeight: '800', color: colors.white },
  cardPriceSep: { color: colors.textOnNavyFaint },
  cardSize: { fontSize: 14, color: colors.textOnNavyFaint },
  cardTitle: { fontSize: 13, color: colors.textOnNavy, marginBottom: 2 },
  cardMeta: { fontSize: 12, color: colors.textOnNavyFaint, marginBottom: spacing.md },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  agentRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: spacing.sm },
  agentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(55,138,221,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  agentName: { fontSize: 11, color: colors.textOnNavyFaint, flex: 1 },
  contactBtn: {
    borderWidth: 1,
    borderColor: colors.blue500,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  contactBtnLabel: { fontSize: 12, fontWeight: '700', color: colors.blue300 },

  // Keep old keys referenced nowhere now but harmless
  typeBadge: {},
  typeBadgeLabel: {},
});
