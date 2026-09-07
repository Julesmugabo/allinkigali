/**
 * MenuRow.js — Umurongo wa menu muri konti.
 * Icon, label, optional value or badge on the right.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, radius } from '../../theme';

export default function MenuRow({
  icon,
  label,
  value,
  badgeCount,
  onPress,
  destructive = false,
  isLast = false,
}) {
  const tint = destructive ? colors.danger : colors.blue600;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, !isLast && styles.divider, pressed && styles.pressed]}
    >
      <View style={[styles.iconWell, destructive && styles.iconWellDestructive]}>
        <MaterialCommunityIcons name={icon} size={18} color={tint} />
      </View>

      <Text style={[styles.label, destructive && styles.labelDestructive]}>{label}</Text>

      {badgeCount ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount}</Text>
        </View>
      ) : null}

      {value ? <Text style={styles.value}>{value}</Text> : null}

      {!destructive ? (
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg - 2,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.blue100 },
  iconWell: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.blue100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconWellDestructive: { backgroundColor: '#FBE9E8' },
  label: {
    flex: 1,
    ...typography.body,
    fontWeight: '500',
    color: colors.navy800,
  },
  labelDestructive: { color: colors.danger },
  value: {
    ...typography.caption,
    color: colors.textMuted,
    marginRight: spacing.xs,
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: colors.blue500,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
});
