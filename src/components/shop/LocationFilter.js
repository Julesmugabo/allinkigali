/**
 * LocationFilter.js — Province > District > Sector cascading filter chips.
 * Picking a province resets district/sector; picking a district resets
 * sector — a narrower pick never leaves a stale, impossible combination.
 */
import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { PROVINCES, getDistricts, getSectors } from '../../data/rwandaLocations';
import { colors, typography, spacing, radius } from '../../theme';

function ChipRow({ options, activeKey, onPick, allLabel }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      <Pressable accessibilityRole="button" onPress={() => onPick(null)} style={[styles.chip, !activeKey && styles.chipActive]}>
        <Text style={[styles.chipLabel, !activeKey && styles.chipLabelActive]}>{allLabel}</Text>
      </Pressable>
      {options.map((o) => {
        const active = activeKey === o.key;
        return (
          <Pressable accessibilityRole="button" key={o.key} onPress={() => onPick(o.key)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipLabel, active && styles.chipLabelActive]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export default function LocationFilter({ province, district, sector, onChange }) {
  const districts = useMemo(() => (province ? getDistricts(province) : []), [province]);
  const sectors = useMemo(
    () => (province && district ? getSectors(province, district).map((s) => ({ key: s, label: s })) : []),
    [province, district]
  );

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <MaterialCommunityIcons name="map-marker-outline" size={13} color={colors.blue300} />
        <Text style={styles.label}>Province</Text>
      </View>
      <ChipRow
        options={PROVINCES}
        activeKey={province}
        allLabel="All Rwanda"
        onPick={(key) => onChange({ province: key, district: null, sector: null })}
      />

      {province ? (
        <>
          <Text style={styles.label}>District</Text>
          <ChipRow
            options={districts}
            activeKey={district}
            allLabel="All districts"
            onPick={(key) => onChange({ province, district: key, sector: null })}
          />
        </>
      ) : null}

      {province && district ? (
        <>
          <Text style={styles.label}>Sector</Text>
          <ChipRow
            options={sectors}
            activeKey={sector}
            allLabel="All sectors"
            onPick={(key) => onChange({ province, district, sector: key })}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.sm },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.blue300,
    marginLeft: 4,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  chipRow: { paddingBottom: 2 },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.3)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 32,
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  chipLabel: { fontSize: 12, color: colors.textOnNavy },
  chipLabelActive: { color: colors.white, fontWeight: '600' },
});
