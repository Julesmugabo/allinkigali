/**
 * AboutSection.js — description, opening hours and the place's details
 * (good for, atmosphere, facilities…) as icon rows. Empty rows are skipped.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { radius, spacing } from '../../../theme';
import Section from './Section';
import { useShopTheme, useShopStyles } from '../../../theme/shopThemes';

export default function AboutSection({ place, details }) {
  const c = useShopTheme(); // eslint-disable-line no-unused-vars
  const styles = useShopStyles(makeStyles);
  const rows = details.filter(([, , values]) => values.length);
  return (
    <Section id="overview" title="About">
      {place.description ? <Text style={styles.text}>{place.description}</Text> : null}
      {place.openHours ? (
        <View style={styles.hours}>
          <MaterialCommunityIcons name="clock-outline" size={18} color={c.accentText} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Opening hours</Text>
            <Text style={styles.value}>{place.openHours}</Text>
          </View>
        </View>
      ) : null}
      <View style={styles.table}>
        {rows.map(([icon, label, values]) => (
          <View key={label} style={styles.row}>
            <MaterialCommunityIcons name={icon} size={18} color={c.accentText} style={styles.icon} />
            <Text style={styles.label}>{label}</Text>
            <View style={styles.chips}>
              {values.map((v) => <Text key={v} style={styles.chip}>{v}</Text>)}
            </View>
          </View>
        ))}
      </View>
    </Section>
  );
}

const makeStyles = (c) => StyleSheet.create({
  text: { color: c.textSoft, fontSize: 15.5, lineHeight: 25, marginBottom: spacing.lg },
  hours: { flexDirection: 'row', gap: 12, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.surface, marginBottom: spacing.lg },
  table: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  icon: { width: 28, marginTop: 2 },
  label: { color: c.textMuted, fontSize: 14, width: 150, marginTop: 3 },
  value: { color: c.text, fontSize: 14.5, marginTop: 2 },
  chips: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { color: c.text, fontSize: 13, backgroundColor: c.accentSoft, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
});
