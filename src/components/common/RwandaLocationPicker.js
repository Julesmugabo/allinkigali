/**
 * RwandaLocationPicker.js — choose a Province, then a District, then a
 * Sector, as rows of chips that open one after another. Tapping the chosen
 * chip again clears that level (and the ones below). Works on phone and web.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { PROVINCES, getDistricts, getSectors } from '../../data/rwandaLocations';
import { useShopTheme, useShopStyles } from '../../theme/shopThemes';

function Row({ label, options, value, onPick }) {
  const c = useShopTheme(); // eslint-disable-line no-unused-vars
  const styles = useShopStyles(makeStyles);
  return (
    <View style={styles.level}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {options.map((o) => {
          const on = o.key === value;
          return (
            <Pressable key={o.key} onPress={() => onPick(on ? null : o.key)} style={[styles.chip, on && styles.on]}
              accessibilityRole="radio" accessibilityState={{ selected: on }}>
              <Text style={[styles.chipLabel, on && styles.chipLabelOn]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function RwandaLocationPicker({ value, onChange }) {
  const c = useShopTheme(); // eslint-disable-line no-unused-vars
  const styles = useShopStyles(makeStyles);
  const { province, district, sector } = value;
  return (
    <View style={styles.wrap}>
      <Row label="Province" options={PROVINCES} value={province}
        onPick={(p) => onChange({ province: p, district: null, sector: null })} />
      {province ? (
        <Row label="District" options={getDistricts(province)} value={district}
          onPick={(d) => onChange({ province, district: d, sector: null })} />
      ) : null}
      {district ? (
        <Row label="Sector" options={getSectors(province, district).map((s) => ({ key: s, label: s }))} value={sector}
          onPick={(s) => onChange({ province, district, sector: s })} />
      ) : null}
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  wrap: { gap: 10 },
  level: { gap: 6 },
  label: { color: c.textMuted, fontSize: 11.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 6, borderWidth: 1, borderColor: c.borderStrong, paddingHorizontal: 9, paddingVertical: 5 },
  on: { backgroundColor: c.accent, borderColor: c.accent },
  chipLabel: { color: c.textSoft, fontSize: 12.5 },
  chipLabelOn: { color: c.text, fontWeight: '700' },
});
