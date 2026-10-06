/**
 * RestaurantAdminDashboardScreen.js — Admin dashboard for managing restaurants.
 * Full CRUD for restaurants + cuisine/food taxonomy management.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import { RESTAURANTS, CUISINES } from '../data/restaurantData';
import { colors, typography, spacing, radius, gutter } from '../theme';

export default function RestaurantAdminDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [segment, setSegment] = useState('restaurants');

  const segments = [
    { key: 'restaurants', label: 'Restaurants' },
    { key: 'cuisines', label: 'Cuisines & Foods' },
  ];

  return (
    <GradientBackground>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.huge }]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button">
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.white} />
          </Pressable>
          <Text style={styles.title}>Restaurant Dashboard</Text>
        </View>

        {/* Stat row */}
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{RESTAURANTS.length}</Text>
            <Text style={styles.statLabel}>Restaurants</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{CUISINES.length}</Text>
            <Text style={styles.statLabel}>Cuisines</Text>
          </View>
        </View>

        {/* Segment tabs */}
        <View style={styles.segRow}>
          {segments.map((s) => (
            <Pressable key={s.key} onPress={() => setSegment(s.key)} style={[styles.seg, segment === s.key && styles.segActive]}>
              <Text style={[styles.segLabel, segment === s.key && styles.segLabelActive]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>

        {segment === 'restaurants' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Restaurants</Text>
              <View style={styles.comingSoon}><Text style={styles.comingSoonLabel}>Add / Edit coming soon</Text></View>
            </View>
            {RESTAURANTS.map((r) => (
              <View key={r.id} style={styles.row}>
                <MaterialCommunityIcons name="silverware-fork-knife" size={18} color={colors.blue300} />
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{r.name}</Text>
                  <Text style={styles.rowSub}>{r.location} · ★ {r.rating}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {segment === 'cuisines' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Cuisines</Text>
              <View style={styles.comingSoon}><Text style={styles.comingSoonLabel}>Manage coming soon</Text></View>
            </View>
            {CUISINES.map((c) => (
              <View key={c.key} style={styles.row}>
                <MaterialCommunityIcons name="food-variant" size={18} color={colors.blue300} />
                <Text style={styles.rowTitle}>{c.label}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  title: { ...typography.bodyStrong, fontSize: 18, color: colors.white },
  statRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  stat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '800', color: colors.white },
  statLabel: { fontSize: 12, color: colors.textOnNavyFaint, marginTop: 2 },
  segRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: radius.pill, padding: 3, marginBottom: spacing.xl },
  seg: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.pill },
  segActive: { backgroundColor: colors.blue500 },
  segLabel: { fontSize: 13, color: colors.textOnNavyFaint, fontWeight: '600' },
  segLabelActive: { color: colors.white },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionTitle: { ...typography.bodyStrong, color: colors.white, fontSize: 15 },
  comingSoon: { backgroundColor: 'rgba(55,138,221,0.2)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  comingSoonLabel: { fontSize: 10, color: colors.blue300 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.sm },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.white },
  rowSub: { fontSize: 12, color: colors.textOnNavyFaint, marginTop: 2 },
});
