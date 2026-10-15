/**
 * RestoPromo.js — a small banner on the news home page that introduces the
 * other half of allinkigali: "Hungry? Book a table or order food →".
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius } from '../../theme';

export default function RestoPromo({ style }) {
  const navigation = useNavigation();
  return (
    <Pressable
      onPress={() => navigation.navigate('ShopTab', { screen: 'Shop' })}
      accessibilityRole="link"
      style={({ hovered, pressed }) => [styles.card, (hovered || pressed) && styles.cardOn, style]}
    >
      <View style={styles.icon}>
        <MaterialCommunityIcons name="silverware-fork-knife" size={22} color={colors.white} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Hungry? Book a table or order food</Text>
        <Text style={styles.sub}>Restaurants and cafés in Kigali</Text>
      </View>
      <MaterialCommunityIcons name="arrow-right" size={22} color={colors.blue500} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: 'rgba(55,138,221,0.25)', marginVertical: spacing.md,
  },
  cardOn: { borderColor: colors.blue500 },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.navy800, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15.5, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
