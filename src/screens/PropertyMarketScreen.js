/**
 * PropertyMarketScreen.js — Inzu zamacye (rent) and House for Sale (sale).
 * Same screen, same data shape, told apart by `route.params.mode` — in the
 * style of Zillow: photo-led cards, price, beds/baths, filter by location.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import EmptyState from '../components/common/EmptyState';
import PrimaryButton from '../components/common/PrimaryButton';
import SettingsHeader from '../components/account/SettingsHeader';
import LocationFilter from '../components/shop/LocationFilter';

import { useProperties } from '../context/PropertyContext';
import { PROVINCES } from '../data/rwandaLocations';
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

  const header = (
    <View>
      <SettingsHeader title={meta.title} onBack={() => navigation.goBack()} />
      <Text style={styles.subtitle}>{meta.subtitle}</Text>

      {mode === 'rent' ? (
        <PrimaryButton
          label="List your house for rent"
          icon="plus"
          onPress={() => navigation.navigate('ListProperty')}
          style={styles.listButton}
        />
      ) : null}

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

      <Text style={styles.resultsLabel}>{listings.length} {listings.length === 1 ? 'house' : 'houses'} found</Text>
    </View>
  );

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
            <View style={styles.cardIconWell}>
              <MaterialCommunityIcons name="home-outline" size={22} color={colors.blue300} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.cardMeta}>
                {item.bedrooms} bed · {item.bathrooms} bath · {item.sizeSqm} m²
              </Text>
              <Text style={styles.cardMeta}>
                {item.sector}, {provinceLabel(item.province)}
              </Text>
              <Text style={styles.cardPrice}>
                {formatPrice(item.price)}
                {meta.priceSuffix}
              </Text>
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
  listButton: { marginBottom: spacing.lg },
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
  resultsLabel: { ...typography.caption, color: colors.textOnNavyFaint, marginBottom: spacing.md },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardPressed: { backgroundColor: 'rgba(255,255,255,0.14)' },
  cardIconWell: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(55,138,221,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardBody: { flex: 1 },
  cardTitle: { ...typography.bodyStrong, fontSize: 13.5, color: colors.white },
  cardMeta: { ...typography.caption, color: colors.textOnNavyFaint, marginTop: 2 },
  cardPrice: { ...typography.bodyStrong, fontSize: 14, color: colors.blue300, marginTop: spacing.xs },
});
