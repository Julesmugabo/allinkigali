/**
 * QuantityStepper.js — Guhindura umubare w'ibintu.
 * Minus / count / plus. Works on both light and dark surfaces.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, radius } from '../../theme';

export default function QuantityStepper({
  value = 0,
  onChange,
  min = 0,
  max = 20,
  size = 'md',
  tone = 'dark', // 'dark' = sits on navy, 'light' = sits on white
  style,
}) {
  const isSmall = size === 'sm';
  const isLight = tone === 'light';
  const buttonSize = isSmall ? 28 : 34;

  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));

  const canDecrement = value > min;
  const canIncrement = value < max;

  return (
    <View
      style={[
        styles.container,
        isLight ? styles.containerLight : styles.containerDark,
        { height: buttonSize + 6 },
        style,
      ]}
    >
      <Pressable
        onPress={decrement}
        disabled={!canDecrement}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Gabanya umubare"
        style={[styles.button, { width: buttonSize, height: buttonSize }, !canDecrement && styles.disabled]}
      >
        <MaterialCommunityIcons
          name="minus"
          size={isSmall ? 15 : 18}
          color={isLight ? colors.blue600 : colors.blue300}
        />
      </Pressable>

      <Text
        style={[styles.value, isLight && styles.valueLight, isSmall && styles.valueSmall]}
        accessibilityLiveRegion="polite"
      >
        {value}
      </Text>

      <Pressable
        onPress={increment}
        disabled={!canIncrement}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Ongera umubare"
        style={[styles.button, { width: buttonSize, height: buttonSize }, !canIncrement && styles.disabled]}
      >
        <MaterialCommunityIcons
          name="plus"
          size={isSmall ? 15 : 18}
          color={isLight ? colors.blue600 : colors.blue300}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: 3,
  },
  containerDark: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.28)',
  },
  containerLight: {
    backgroundColor: colors.blue100,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  disabled: { opacity: 0.35 },
  value: {
    minWidth: 26,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: colors.textOnNavy,
    marginHorizontal: spacing.xxs,
  },
  valueLight: { color: colors.navy800 },
  valueSmall: { fontSize: 13.5, minWidth: 22 },
});
