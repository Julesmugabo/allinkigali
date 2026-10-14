/**
 * LocationSection.js — a small map with the place's pin, its address and
 * an "Open in Google Maps" button for directions.
 */
import React from 'react';
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import PlacesMapView from '../../map/PlacesMapView';
import { colors, radius, spacing } from '../../../theme';
import Section from './Section';

export default function LocationSection({ place }) {
  const hasPin = place.lat && place.lng;
  const query = hasPin ? `${place.lat},${place.lng}` : `${place.name} ${place.location || ''} Kigali`;
  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  return (
    <Section id="location" title="Location">
      <View style={styles.row}>
        {hasPin ? (
          <View style={styles.map}><PlacesMapView places={[place]} accentColor="#378ADD" style={{ flex: 1 }} /></View>
        ) : null}
        <View style={styles.info}>
          <MaterialCommunityIcons name="map-marker-outline" size={22} color={colors.blue300} />
          <Text style={styles.address}>{[place.location, place.district].filter(Boolean).join(', ') || 'Kigali'}</Text>
          <Pressable onPress={() => Linking.openURL(directions)} style={styles.button}>
            <MaterialCommunityIcons name="directions" size={18} color={colors.white} />
            <Text style={styles.buttonLabel}>Open in Google Maps</Text>
          </Pressable>
        </View>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xl, alignItems: 'flex-start' },
  map: { flex: 1.4, height: 260, borderRadius: radius.md, overflow: 'hidden' },
  info: { flex: 1, gap: 10 },
  address: { color: colors.white, fontSize: 15.5, lineHeight: 22 },
  button: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: colors.blue500, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 10 },
  buttonLabel: { color: colors.white, fontWeight: '700' },
});
