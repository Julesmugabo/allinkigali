/**
 * RoleChoice.js — "How do you want to start?"
 *
 * Shown first when creating an account, so someone who wants to list a
 * business lands straight in business registration afterwards instead of
 * everyone getting the same generic screen. Purely presentational — the
 * sign-up screen owns what happens after a choice.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, radius } from '../../theme';

const OPTIONS = [
  {
    key: 'customer',
    icon: 'account-plus-outline',
    title: 'Just need to create an account',
    subtitle: 'Find services, send requests and keep track of them',
  },
  {
    key: 'seller',
    icon: 'storefront-outline',
    title: 'Register a business',
    subtitle: 'List your business and get customers',
  },
];

export default function RoleChoice({ onChoose }) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((option) => (
        <Pressable
          key={option.key}
          onPress={() => onChoose(option.key)}
          accessibilityRole="button"
          accessibilityLabel={option.title}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        >
          <View style={styles.iconWell}>
            <MaterialCommunityIcons name={option.icon} size={24} color={colors.blue300} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>{option.title}</Text>
            <Text style={styles.subtitle}>{option.subtitle}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.blue300} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.lg,
    padding: spacing.lg - 2,
    marginBottom: spacing.md,
  },
  cardPressed: { backgroundColor: 'rgba(255,255,255,0.14)' },
  iconWell: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(2,28,54,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, marginHorizontal: spacing.md },
  title: { fontSize: 16, fontWeight: '700', color: colors.white, letterSpacing: -0.2 },
  subtitle: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textOnNavyFaint,
    marginTop: 2,
  },
});
