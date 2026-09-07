/**
 * AdminBusinessRow.js — Umurongo w'ubucuruzi mu buyobozi bw'abafatanyabikorwa.
 *
 * Two modes:
 *   mode="pending" -> approve / reject (a brand-new, unverified registration)
 *   mode="manage"  -> view / edit (the full seller directory)
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, radius } from '../../theme';

export default function AdminBusinessRow({
  business,
  categoryLabel,
  requestCount = 0,
  mode = 'manage',
  onApprove,
  onReject,
  onView,
  onEdit,
  onOpenDashboard,
}) {
  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <MaterialCommunityIcons
          name={business.icon || 'store-outline'}
          size={18}
          color={colors.blue300}
          style={styles.icon}
        />
        <Text style={styles.title} numberOfLines={1}>
          {business.name}
        </Text>
        {business.verified ? (
          <MaterialCommunityIcons name="check-decagram" size={15} color={colors.success} />
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.category}>{categoryLabel}</Text>
        <Text style={styles.meta}>
          {business.location}
          {business.rating ? ` · ★ ${business.rating}` : ' · No rating yet'}
          {` · ${requestCount} ${requestCount === 1 ? 'request' : 'requests'}`}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={[styles.statusBadge, business.verified ? styles.verifiedBadge : styles.pendingBadge]}>
          <Text style={[styles.statusLabel, { color: business.verified ? colors.success : colors.warning }]}>
            {business.verified ? 'Verified' : 'Not verified'}
          </Text>
        </View>

        {mode === 'pending' ? (
          <View style={styles.actions}>
            <Pressable onPress={() => onReject(business)} style={styles.ghostAction} accessibilityRole="button">
              <Text style={styles.ghostLabel}>Reject</Text>
            </Pressable>
            <Pressable onPress={() => onApprove(business.id)} style={styles.approveAction} accessibilityRole="button">
              <MaterialCommunityIcons name="check" size={13} color={colors.success} />
              <Text style={styles.approveLabel}>Approve</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actions}>
            <Pressable
              onPress={() => onView(business)}
              style={styles.iconAction}
              accessibilityRole="button"
              accessibilityLabel={`View ${business.name}`}
            >
              <MaterialCommunityIcons name="eye-outline" size={16} color={colors.blue300} />
            </Pressable>
            <Pressable
              onPress={() => onEdit(business)}
              style={styles.iconAction}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${business.name}`}
            >
              <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.blue300} />
            </Pressable>
            <Pressable
              onPress={() => onOpenDashboard(business)}
              style={styles.dashboardAction}
              accessibilityRole="button"
              accessibilityLabel={`Open ${business.name}'s dashboard`}
            >
              <MaterialCommunityIcons name="view-dashboard-outline" size={14} color={colors.white} />
              <Text style={styles.dashboardActionLabel}>Dashboard</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  top: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: spacing.sm },
  title: { flex: 1, ...typography.body, fontSize: 13.5, fontWeight: '600', color: colors.white, marginRight: spacing.xs },
  metaRow: { marginTop: spacing.sm },
  category: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.blue500,
    textTransform: 'uppercase',
  },
  meta: { ...typography.caption, fontSize: 11, color: colors.textOnNavyFaint, marginTop: 2 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  verifiedBadge: { backgroundColor: 'rgba(46,158,91,0.18)' },
  pendingBadge: { backgroundColor: 'rgba(186,117,23,0.18)' },
  statusLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  iconAction: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  ghostAction: { paddingHorizontal: spacing.sm, height: 30, justifyContent: 'center' },
  ghostLabel: { fontSize: 12, color: colors.textOnNavyFaint },
  approveAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46,158,91,0.22)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 30,
    marginLeft: spacing.sm,
  },
  approveLabel: { fontSize: 12, fontWeight: '600', color: colors.success, marginLeft: 4 },
  dashboardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blue500,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 32,
    marginLeft: spacing.sm,
  },
  dashboardActionLabel: { fontSize: 11.5, fontWeight: '600', color: colors.white, marginLeft: 4 },
});
