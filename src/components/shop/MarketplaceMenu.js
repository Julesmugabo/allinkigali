/**
 * MarketplaceMenu.js — Two entry cards on the Resto/Coffee Shop tab:
 * Book Restaurant and Explore Coffee Shops.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { colors, typography, spacing, radius } from '../../theme';

const ITEMS = [
  {
    key: 'restaurant',
    label: 'Book Restaurant',
    subtitle: 'Find & book a table',
    icon: 'silverware-fork-knife',
    route: 'RestaurantMarket',
  },
  {
    key: 'coffee',
    label: 'Explore Coffee Shops',
    subtitle: 'Find the perfect spot',
    icon: 'coffee-outline',
    route: 'CoffeeShopMarket',
  },
];

export default function MarketplaceMenu({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>DISCOVER</Text>
      <View style={styles.grid}>
        {ITEMS.map((item, index) => (
          <Pressable
            key={item.key}
            onPress={() => navigation.navigate(item.route)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            style={({ pressed }) => [
              styles.card,
              index === 0 && styles.cardGap,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.iconWell}>
              <MaterialCommunityIcons name={item.icon} size={26} color={colors.blue300} />
            </View>
            <Text style={styles.cardLabel}>{item.label}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          </Pressable>
        ))}
      </View>
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
  grid: { flexDirection: 'row' },
  cardGap: { marginRight: '4%' },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 100,
  },
  cardPressed: { backgroundColor: 'rgba(255,255,255,0.14)' },
  iconWell: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(55,138,221,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  cardLabel: { fontSize: 14, fontWeight: '700', color: colors.white, marginBottom: 3 },
  cardSubtitle: { fontSize: 11, color: colors.textOnNavyFaint, lineHeight: 15 },
});
