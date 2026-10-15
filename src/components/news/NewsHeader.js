/**
 * NewsHeader.js — Umutwe wa ecran y'amakuru.
 * The app's top bar (logo, bell, profile), the tagline and the category strip.
 * The category strip itself lives in CategoryTabs so this file stays readable.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppTopBar from '../common/AppTopBar';

import CategoryTabs from './CategoryTabs';
import NewsTagline from './NewsTagline';
import { colors, spacing, gutter } from '../../theme';

export default function NewsHeader({
  categories,
  activeCategory,
  onCategoryChange,
  onNotificationsPress,
  unreadCount = 0,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <AppTopBar variant="full" style={{ marginBottom: spacing.md }} />

      <NewsTagline onNavy style={styles.tagline} />

      <CategoryTabs
        categories={categories}
        activeKey={activeCategory}
        onChange={onCategoryChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.navy800,
    paddingHorizontal: gutter,
  },
  tagline: { marginTop: -spacing.xs, marginBottom: spacing.md },
});
