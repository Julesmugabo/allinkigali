/**
 * SellerRequestRow.js — Umurongo w'icyifuzo kiri mu bubiko bw'umucuruzi.
 *
 * One customer request: what they asked for, when, a one-tap call, and the
 * handled / no-response buttons that feed the dashboard's response-time stat.
 */
import React from 'react';
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { formatPrice } from '../../utils/format';
import { colors, typography, spacing, radius } from '../../theme';

const STATUS_LABEL = {
  new: null,
  handled: { label: 'Handled', color: colors.success, icon: 'check-circle' },
  no_response: { label: 'No response', color: colors.warning, icon: 'clock-alert-outline' },
};

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

export default function SellerRequestRow({ booking, phone, onMarkHandled, onMarkNoResponse }) {
  const statusInfo = STATUS_LABEL[booking.status];

  const handleCall = () => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  return (
    <View style={styles.row}>
      <View style={styles.headerRow}>
        <Text style={styles.what} numberOfLines={1}>
          {booking.itemLabel || `Quantity: ${booking.quantity}`}
        </Text>
        <Text style={styles.time}>{timeAgo(booking.createdAt)}</Text>
      </View>

      <Text style={styles.meta}>
        {booking.date} · {booking.quantity}x
        {booking.priceFrom ? ` · ${formatPrice(booking.priceFrom * booking.quantity, booking.currency)}` : ''}
      </Text>

      {booking.note ? <Text style={styles.note}>"{booking.note}"</Text> : null}

      <View style={styles.footer}>
        {phone ? (
          <Pressable onPress={handleCall} style={styles.callButton} accessibilityRole="button">
            <MaterialCommunityIcons name="phone" size={14} color={colors.white} />
            <Text style={styles.callLabel}>Call</Text>
          </Pressable>
        ) : (
          <View />
        )}

        {statusInfo ? (
          <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}22` }]}>
            <MaterialCommunityIcons name={statusInfo.icon} size={13} color={statusInfo.color} />
            <Text style={[styles.statusLabel, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        ) : (
          <View style={styles.actionRow}>
            <Pressable onPress={() => onMarkNoResponse(booking.id)} style={styles.ghostAction} accessibilityRole="button">
              <Text style={styles.ghostActionLabel}>No response</Text>
            </Pressable>
            <Pressable onPress={() => onMarkHandled(booking.id)} style={styles.primaryAction} accessibilityRole="button">
              <Text style={styles.primaryActionLabel}>Mark handled</Text>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  what: { ...typography.bodyStrong, color: colors.white, flexShrink: 1, marginRight: spacing.sm },
  time: { ...typography.caption, color: colors.textOnNavyFaint },
  meta: { ...typography.caption, color: colors.blue300, marginTop: 4 },
  note: {
    ...typography.caption,
    fontStyle: 'italic',
    color: colors.textOnNavyFaint,
    marginTop: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blue500,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 30,
  },
  callLabel: { color: colors.white, fontSize: 12, fontWeight: '600', marginLeft: 4 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusLabel: { fontSize: 11, fontWeight: '600', marginLeft: 4 },
  actionRow: { flexDirection: 'row' },
  ghostAction: { paddingHorizontal: spacing.sm, height: 30, justifyContent: 'center' },
  ghostActionLabel: { fontSize: 12, color: colors.textOnNavyFaint },
  primaryAction: {
    backgroundColor: 'rgba(46,158,91,0.22)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 30,
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  primaryActionLabel: { fontSize: 12, fontWeight: '600', color: colors.success },
});
