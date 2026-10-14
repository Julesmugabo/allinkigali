/**
 * NewsHeader.js — Umutwe wa ecran y'amakuru.
 * Logo + wordmark, notification icon and the category strip.
 * The category strip itself lives in CategoryTabs so this file stays readable.
 */
import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CategoryTabs from './CategoryTabs';
import NewsTagline from './NewsTagline';
import { colors, typography, spacing, gutter } from '../../theme';

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
      <View style={styles.topRow}>
        <View style={styles.brand}>
          <Image
            source={require('../../../assets/logo-wordmark.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>

        <View style={styles.icons}>
          <Pressable
            onPress={onNotificationsPress}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Amatangazo"
          >
            <MaterialCommunityIcons name="bell-outline" size={23} color={colors.blue300} />
            {unreadCount > 0 ? <View style={styles.bellDot} /> : null}
          </Pressable>
        </View>
      </View>

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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  brand: { flexDirection: 'row', alignItems: 'center' },
  tagline: { marginTop: -spacing.xs, marginBottom: spacing.md },
  // The AllinKigali wordmark (image is ~4:1), same logo as the website's top bar.
  logoImg: { width: 124, height: 31 },
  icons: { flexDirection: 'row', alignItems: 'center' },
  bellDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.breaking,
    borderWidth: 1,
    borderColor: colors.navy800,
  },
});
