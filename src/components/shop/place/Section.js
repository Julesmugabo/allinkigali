/**
 * Section.js — a titled block on the place page. Its id lets the section
 * links at the top scroll to it (see jumpTo).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing } from '../../../theme';
import { useShopTheme, useShopStyles } from '../../../theme/shopThemes';

export const jumpTo = (id) => document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export default function Section({ id, title, right, children }) {
  const c = useShopTheme(); // eslint-disable-line no-unused-vars
  const styles = useShopStyles(makeStyles);
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

const makeStyles = (c) => StyleSheet.create({
  wrap: { paddingVertical: spacing.xxl, borderTopWidth: 1, borderTopColor: c.border },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md, gap: 12 },
  title: { color: c.text, fontSize: 20, fontWeight: '800' },
});
