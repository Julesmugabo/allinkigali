/**
 * AdminSidebar.js — Sidebar y'ubuyobozi (wide-screen admin navigation).
 *
 * Admin dashboards run on the web (this app already builds for web), and on
 * a desktop-width browser there's room for a real sidebar like the CMS
 * mockups — unlike the phone, where AdminDashboard screens fall back to top
 * tabs instead. Generic on purpose: every admin dashboard (News, Sales
 * Partners, Director) reuses this same component with its own sections.
 */
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, radius } from '../../theme';

export const SIDEBAR_BREAKPOINT = 860;
export const SIDEBAR_WIDTH = 240;

export default function AdminSidebar({ brandTitle = 'allinkigali', brandSubtitle, sections, activeKey }) {
  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <MaterialCommunityIcons name="earth" size={22} color={colors.blue300} />
        <View style={styles.brandText}>
          <Text style={styles.brandTitle}>{brandTitle}</Text>
          {brandSubtitle ? <Text style={styles.brandSubtitle}>{brandSubtitle}</Text> : null}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {sections.map((section) => (
          <View key={section.label} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.label}</Text>
            {section.items.map((item) => {
              const active = item.key === activeKey;
              return (
                <Pressable
                  key={item.key}
                  onPress={item.onPress}
                  accessibilityRole="button"
                  style={[styles.item, active && styles.itemActive]}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={18}
                    color={active ? colors.white : colors.blue300}
                  />
                  <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>{item.label}</Text>
                  {item.badge ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: 'rgba(2,28,54,0.55)',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(133,183,235,0.18)',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(133,183,235,0.18)',
  },
  brandText: { marginLeft: spacing.sm },
  brandTitle: { fontSize: 16, fontWeight: '700', color: colors.white, letterSpacing: -0.2 },
  brandSubtitle: {
    ...typography.meta,
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 1,
    color: colors.blue300,
    marginTop: 1,
  },
  scrollContent: { paddingVertical: spacing.lg },
  section: { marginBottom: spacing.xl, paddingHorizontal: spacing.md },
  sectionLabel: {
    ...typography.meta,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: 'rgba(133,183,235,0.5)',
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
  },
  itemActive: { backgroundColor: colors.blue500 },
  itemLabel: { flex: 1, ...typography.body, fontSize: 13.5, color: colors.textOnNavy, marginLeft: spacing.sm },
  itemLabelActive: { color: colors.white, fontWeight: '600' },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: colors.breaking,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 10.5, fontWeight: '700' },
});
