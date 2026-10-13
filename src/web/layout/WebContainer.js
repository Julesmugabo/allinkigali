/**
 * WebContainer.js — centers content in a real website column on wide web
 * screens, instead of stretching it edge to edge. Used inside wide-layout
 * screens (and the top nav bar), never on native.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';

export const MAX_CONTENT_WIDTH = 1280;

export default function WebContainer({ children, style }) {
  return (
    <View style={styles.outer}>
      <View style={[styles.inner, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { width: '100%', alignItems: 'center' },
  inner: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, paddingHorizontal: 32 },
});
