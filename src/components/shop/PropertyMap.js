/**
 * PropertyMap.js — Native placeholder.
 * The real map is PropertyMap.web.js (loaded on web automatically by Metro).
 * On Android/iOS the map view will show here once react-native-maps is added.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing } from '../../theme';

export default function PropertyMap({ style }) {
  return (
    <View style={[styles.container, style]}>
      <MaterialCommunityIcons name="map-outline" size={36} color={colors.blue300} />
      <Text style={styles.label}>Map available on web</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    backgroundColor: 'rgba(55,138,221,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typography.body, color: colors.textOnNavyFaint, marginTop: spacing.sm },
});
