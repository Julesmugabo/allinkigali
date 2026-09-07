/**
 * PrimaryButton.js — Buto nkuru.
 * One button component, three looks:
 *   variant="solid"   filled action blue (default)
 *   variant="outline" transparent with a blue border, for use on navy
 *   variant="ghost"   text only
 */
import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, typography, radius, spacing, shadows } from '../../theme';

export default function PrimaryButton({
  label,
  onPress,
  icon,
  iconRight,
  variant = 'solid',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
}) {
  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    size === 'sm' && styles.sizeSm,
    size === 'lg' && styles.sizeLg,
    variant === 'solid' && styles.solid,
    variant === 'outline' && styles.outline,
    variant === 'ghost' && styles.ghost,
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const textColor =
    variant === 'solid' ? colors.white : variant === 'outline' ? colors.blue300 : colors.blue500;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [containerStyle, pressed && !isDisabled && styles.pressed]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.row}>
          {icon ? (
            <MaterialCommunityIcons
              name={icon}
              size={size === 'sm' ? 16 : 19}
              color={textColor}
              style={styles.iconLeft}
            />
          ) : null}
          <Text style={[styles.label, { color: textColor }, size === 'sm' && styles.labelSm]}>
            {label}
          </Text>
          {iconRight ? (
            <MaterialCommunityIcons
              name={iconRight}
              size={size === 'sm' ? 16 : 19}
              color={textColor}
              style={styles.iconRight}
            />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  sizeSm: { height: 40, borderRadius: radius.sm, paddingHorizontal: spacing.lg },
  sizeLg: { height: 58 },
  fullWidth: { alignSelf: 'stretch' },
  solid: {
    backgroundColor: colors.blue500,
    ...shadows.button,
  },
  outline: {
    borderWidth: 1,
    borderColor: 'rgba(133,183,235,0.45)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  label: { ...typography.button },
  labelSm: { fontSize: 13.5 },
  iconLeft: { marginRight: spacing.sm },
  iconRight: { marginLeft: spacing.sm },
});
