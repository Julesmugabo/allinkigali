/**
 * MarketplaceMenu.js — Entry cards into the 5 new marketplaces, shown above
 * the regular service search on the Service Market tab. Each card is just a
 * door into its own browsing screen — no content lives here.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { colors, typography, spacing, radius } from '../../theme';

const ITEMS = [
  { key: 'land', label: 'Ibibanza', subtitle: 'Land for sale', icon: 'terrain', route: 'LandMarket' },
  { key: 'rent', label: 'Inzu zamacye', subtitle: 'Houses to rent', icon: 'home-search-outline', route: 'PropertyMarket', params: { mode: 'rent' } },
  { key: 'sale', label: 'House for Sale', subtitle: 'Buy a house', icon: 'home-city-outline', route: 'PropertyMarket', params: { mode: 'sale' } },
  { key: 'gadgets', label: 'Allingadget', subtitle: 'Phones, laptops & more', icon: 'laptop', route: 'ProductMarket', params: { store: 'allingadget' } },
  { key: 'beauty', label: 'Uruhu Rwiza', subtitle: 'Skincare & beauty', icon: 'face-woman-outline', route: 'ProductMarket', params: { store: 'uruhu-rwiza' } },
];

export default function MarketplaceMenu({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>AMASOKO</Text>
      <View style={styles.grid}>
        {ITEMS.map((item, index) => (
          <Pressable
            key={item.key}
            onPress={() => navigation.navigate(item.route, item.params)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            style={({ pressed }) => [styles.card, index % 3 !== 2 && styles.cardGap, pressed && styles.cardPressed]}
          >
            <View style={styles.iconWell}>
              <MaterialCommunityIcons name={item.icon} size={22} color={colors.blue300} />
            </View>
            <Text style={styles.cardLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={2}>
              {item.subtitle}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// Three per row, filling left to right (a short last row stays left-aligned).
const CARD_WIDTH = '31.33%';

const styles = StyleSheet.create({
  container: { marginTop: spacing.lg, marginBottom: spacing.xl },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textOnNavyFaint,
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cardGap: { marginRight: '3%' },
  card: {
    width: CARD_WIDTH,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
    minHeight: 92,
  },
  cardPressed: { backgroundColor: 'rgba(255,255,255,0.14)' },
  iconWell: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(55,138,221,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  cardLabel: { fontSize: 12.5, fontWeight: '700', color: colors.white },
  cardSubtitle: { fontSize: 10, color: colors.textOnNavyFaint, marginTop: 2, lineHeight: 13 },
});
