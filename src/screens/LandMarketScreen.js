/**
 * LandMarketScreen.js — Ibibanza (land plots), in the style of LandWatch:
 * straight to the plots, no marketing/intro screen. Filter by province,
 * district and sector, plus the plot type.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import EmptyState from '../components/common/EmptyState';
import SettingsHeader from '../components/account/SettingsHeader';
import LocationFilter from '../components/shop/LocationFilter';

import { LAND_LISTINGS, LAND_TYPES } from '../data/landListings';
import { PROVINCES } from '../data/rwandaLocations';
import { formatPrice } from '../utils/format';
import { colors, typography, spacing, radius, gutter } from '../theme';

const TYPE_FILTERS = [{ key: null, label: 'All types' }, ...Object.entries(LAND_TYPES).map(([key, v]) => ({ key, label: v.label }))];

function provinceLabel(key) {
  return PROVINCES.find((p) => p.key === key)?.label || key;
}

export default function LandMarketScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [province, setProvince] = useState(null);
  const [district, setDistrict] = useState(null);
  const [sector, setSector] = useState(null);
  const [type, setType] = useState(null);

  const listings = useMemo(() => {
    return LAND_LISTINGS.filter((l) => {
      if (province && l.province !== province) return false;
      if (district && l.district !== district) return false;
      if (sector && l.sector !== sector) return false;
      if (type && l.type !== type) return false;
      return true;
    });
  }, [province, district, sector, type]);

  const header = (
    <View>
      <SettingsHeader title="Ibibanza" onBack={() => navigation.goBack()} />
      <Text style={styles.subtitle}>Land for sale across Rwanda</Text>

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

      <Text style={styles.resultsLabel}>{listings.length} {listings.length === 1 ? 'plot' : 'plots'} found</Text>
    </View>
  );

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
              <View style={styles.cardIconWell}>
                <MaterialCommunityIcons name={typeMeta.icon} size={22} color={colors.blue300} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.cardMeta}>
                  {item.sector}, {provinceLabel(item.province)} · {item.sizeSqm.toLocaleString()} m²
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeLabel}>{typeMeta.label}</Text>
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
  subtitle: { ...typography.body, color: colors.textOnNavyFaint, marginBottom: spacing.lg },
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
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  cardPrice: { ...typography.bodyStrong, fontSize: 14, color: colors.blue300 },
  typeBadge: { backgroundColor: 'rgba(133,183,235,0.18)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  typeBadgeLabel: { fontSize: 10, fontWeight: '600', color: colors.blue300 },
});
