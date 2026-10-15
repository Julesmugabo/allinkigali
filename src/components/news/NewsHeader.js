/**
 * NewsHeader.js — the top of the news page on phones, in two parts:
 *   NewsHeader      pinned: the app's top bar (logo, bell, profile) stays
 *                   on screen while you scroll
 *   NewsHeaderBand  scrolls with the news: the tagline and the categories
 *                   (put it first in the list's header)
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppTopBar from '../common/AppTopBar';

import CategoryTabs from './CategoryTabs';
import NewsTagline from './NewsTagline';
import { colors, spacing, gutter } from '../../theme';

export default function NewsHeader() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.sm }]}>
      <AppTopBar variant="full" />
    </View>
  );
}

export function NewsHeaderBand({ categories, activeCategory, onCategoryChange }) {
  return (
    <View style={styles.band}>
      <NewsTagline onNavy style={styles.tagline} />
      <CategoryTabs categories={categories} activeKey={activeCategory} onChange={onCategoryChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.navy800, paddingHorizontal: gutter, paddingBottom: spacing.sm },
  // Sits flush under the pinned bar, edge to edge, at the top of the list.
  band: { backgroundColor: colors.navy800, marginHorizontal: -gutter, marginTop: -spacing.md, marginBottom: spacing.md, paddingHorizontal: gutter, paddingTop: spacing.xs },
  tagline: { marginTop: 0, marginBottom: spacing.md },
});
