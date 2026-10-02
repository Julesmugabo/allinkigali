/**
 * GradientBackground.js — Ibara ry'inyuma rifite gradient.
 * Wraps a screen in the deep blue gradient used by the shop and account tabs.
 * Two soft light "blooms" sit on top of the gradient so large empty areas
 * don't read as a flat block of colour.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';

export default function GradientBackground({
  children,
  style,
  colorsOverride,
  showBlooms = false,
  start = { x: 0.1, y: 0 },
  end = { x: 0.9, y: 1 },
}) {
  return (
    <LinearGradient
      colors={colorsOverride || colors.gradient.shop}
      start={start}
      end={end}
      style={[styles.container, style]}
    >
      {showBlooms ? (
        <>
          <View style={[styles.bloom, styles.bloomTop]} pointerEvents="none" />
          <View style={[styles.bloom, styles.bloomBottom]} pointerEvents="none" />
        </>
      ) : null}
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bloom: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: colors.blue500,
  },
  bloomTop: {
    width: 320,
    height: 320,
    top: -140,
    right: -120,
    opacity: 0.18,
  },
  bloomBottom: {
    width: 260,
    height: 260,
    bottom: -120,
    left: -100,
    opacity: 0.12,
  },
});
