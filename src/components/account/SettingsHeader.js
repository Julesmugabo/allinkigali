/**
 * SettingsHeader.js — the top of the Me-tab sub-screens (Log in, Edit
 * profile, Change password, Help…): the app's slim top bar (back arrow,
 * allinkigali logo) and the page title under it.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import AppTopBar from '../common/AppTopBar';
import { colors, typography, spacing } from '../../theme';

export default function SettingsHeader({ title, onBack }) {
  return (
    <View style={styles.wrap}>
      <AppTopBar variant="slim" onBack={onBack} style={styles.bar} />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.xl },
  bar: { marginBottom: spacing.md },
  title: { ...typography.screenTitle, fontSize: 22, color: colors.white },
});
