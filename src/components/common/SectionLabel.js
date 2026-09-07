/**
 * SectionLabel.js — Umutwe w'igice (section heading with a rule).
 * Matches the mockup: small heading, hairline that fills the remaining width,
 * and an optional action on the right.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing } from '../../theme';

export default function SectionLabel({
  title,
  actionLabel,
  onActionPress,
  tone = 'light', // 'light' = dark text on the news feed, 'dark' = text on navy
  style,
}) {
  const isDark = tone === 'dark';

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, isDark && styles.titleDark]}>{title}</Text>
      <View style={[styles.rule, isDark && styles.ruleDark]} />
      {actionLabel ? (
        <Pressable
          onPress={onActionPress}
          accessibilityRole="button"
          hitSlop={8}
          style={styles.action}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
          <MaterialCommunityIcons name="chevron-right" size={15} color={colors.blue500} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.navy800,
    marginRight: spacing.sm,
  },
  titleDark: { color: colors.blue300 },
  rule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  ruleDark: { backgroundColor: 'rgba(133,183,235,0.25)' },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  actionLabel: {
    ...typography.caption,
    color: colors.blue500,
    fontWeight: '600',
  },
});
