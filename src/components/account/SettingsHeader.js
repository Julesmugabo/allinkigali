/**
 * SettingsHeader.js — Back button + title row shared by the Me-tab sub-screens
 * (Edit profile, Change password, My service requests, Help, Privacy).
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { colors, typography, spacing, radius } from '../../theme';

export default function SettingsHeader({ title, onBack }) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onBack}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={styles.back}
      >
        <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textOnNavy} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  back: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  title: { ...typography.screenTitle, fontSize: 20, color: colors.white },
});
