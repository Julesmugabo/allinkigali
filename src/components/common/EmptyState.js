/**
 * EmptyState.js — Icyerekana ko nta kintu gihari.
 * An empty screen is an invitation to act, so this always offers a next step
 * when one is given.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import PrimaryButton from './PrimaryButton';
import { colors, typography, spacing, radius } from '../../theme';

export default function EmptyState({
  icon = 'magnify',
  title,
  message,
  actionLabel,
  onActionPress,
  tone = 'light',
  style,
}) {
  const isDark = tone === 'dark';

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconWell, isDark && styles.iconWellDark]}>
        <MaterialCommunityIcons
          name={icon}
          size={30}
          color={isDark ? colors.blue300 : colors.blue500}
        />
      </View>

      <Text style={[styles.title, isDark && styles.titleDark]}>{title}</Text>

      {message ? (
        <Text style={[styles.message, isDark && styles.messageDark]}>{message}</Text>
      ) : null}

      {actionLabel ? (
        <PrimaryButton
          label={actionLabel}
          onPress={onActionPress}
          variant={isDark ? 'outline' : 'solid'}
          size="sm"
          fullWidth={false}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  iconWell: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.blue100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  iconWellDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(133,183,235,0.2)',
  },
  title: {
    ...typography.bodyStrong,
    color: colors.navy800,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  titleDark: { color: colors.textOnNavy },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  messageDark: { color: colors.textOnNavyFaint },
  action: { marginTop: spacing.lg },
});
