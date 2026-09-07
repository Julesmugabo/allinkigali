/**
 * NewsHeader.js — Umutwe wa ecran y'amakuru.
 * Logo + wordmark, notification icon and the category strip.
 * The category strip itself lives in CategoryTabs so this file stays readable.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BrandLogo from './BrandLogo';
import CategoryTabs from './CategoryTabs';
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
          <BrandLogo size={34} />
          <View style={styles.wordmarkBlock}>
            <View style={styles.wordmark}>
              <Text style={styles.wordmarkAll}>allin</Text>
              <Text style={styles.wordmarkKigali}>kigali</Text>
            </View>
            <Text style={styles.wordmarkSub}>HIRYA NO HINO KWISI</Text>
          </View>
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
  wordmarkBlock: { marginLeft: spacing.sm },
  wordmark: { flexDirection: 'row', alignItems: 'baseline' },
  wordmarkAll: { ...typography.wordmark, color: colors.textOnNavy },
  wordmarkKigali: { ...typography.wordmark, color: colors.blue300 },
  wordmarkSub: {
    ...typography.wordmarkSub,
    color: colors.blue300,
    opacity: 0.6,
    marginTop: -1,
  },
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
