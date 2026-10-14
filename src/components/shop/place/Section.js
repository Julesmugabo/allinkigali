/**
 * Section.js — a titled block on the place page. Its id lets the section
 * links at the top scroll to it (see jumpTo).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../../theme';

export const jumpTo = (id) => document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export default function Section({ id, title, right, children }) {
  return (
    <View style={styles.wrap} nativeID={`section-${id}`}>
      <View style={styles.head}>
        <Text style={styles.title}>{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: spacing.xxl, borderTopWidth: 1, borderTopColor: 'rgba(133,183,235,0.14)' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md, gap: 12 },
  title: { color: colors.white, fontSize: 20, fontWeight: '800' },
});
