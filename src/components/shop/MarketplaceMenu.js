/**
 * MarketplaceMenu.js — the four doors of the Resto/Coffee tab on phones:
 * the same photo cards as the website, two by two.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CategoryCards from './discover/CategoryCards';
import useCategoryCards from '../../screens/shop/home/useCategoryCards';
import { colors, typography, spacing } from '../../theme';

export default function MarketplaceMenu({ navigation }) {
  const cards = useCategoryCards(navigation);
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>DISCOVER</Text>
      <CategoryCards cards={cards} compact />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.lg, marginBottom: spacing.xl },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textOnNavyFaint,
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
});
