/**
 * MyRequestsScreen.js — The service requests I have sent, with their status.
 *
 * The server already returns only what this person may see (their own
 * requests, plus requests sent to a business they own), so this screen just
 * keeps the ones *they* sent (customerId === their id).
 */
import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import EmptyState from '../components/common/EmptyState';
import SettingsHeader from '../components/account/SettingsHeader';

import { useUser } from '../context/UserContext';
import { useBookings } from '../context/BookingContext';
import { timeAgo } from '../utils/date';
import { colors, typography, spacing, radius, gutter } from '../theme';

const STATUS_META = {
  new: { label: 'Waiting for reply', color: colors.blue300, tint: 'rgba(55,138,221,0.22)' },
  handled: { label: 'Handled', color: '#7FD4A0', tint: 'rgba(46,158,91,0.22)' },
  no_response: { label: 'No response', color: '#F0B75E', tint: 'rgba(186,117,23,0.25)' },
};

export default function MyRequestsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { bookings } = useBookings();

  const mine = useMemo(() => bookings.filter((b) => b.customerId === user?.id), [bookings, user?.id]);

  return (
    <GradientBackground>
      <FlatList
        data={mine}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: spacing.huge }]}
        ListHeaderComponent={<SettingsHeader title="My service requests" onBack={() => navigation.goBack()} />}
        ListEmptyComponent={
          <EmptyState
            tone="dark"
            icon="inbox-arrow-up-outline"
            title="No requests yet"
            message="When you book a service from the Service Market, it shows up here with its status."
            actionLabel="Browse the Service Market"
            onActionPress={() => navigation.navigate('ShopTab')}
          />
        }
        renderItem={({ item }) => {
          const status = STATUS_META[item.status] || STATUS_META.new;
          return (
            <View style={styles.card}>
              <View style={styles.topRow}>
                <Text style={styles.business} numberOfLines={1}>
                  {item.businessName}
                </Text>
                <View style={[styles.badge, { backgroundColor: status.tint }]}>
                  <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
              {item.itemLabel ? <Text style={styles.detail}>{item.itemLabel}</Text> : null}
              <Text style={styles.meta}>
                {item.quantity > 1 ? `Qty ${item.quantity} · ` : ''}
                {item.date ? `${item.date} · ` : ''}
                sent {timeAgo(item.createdAt)}
              </Text>
              {item.note ? <Text style={styles.note}>"{item.note}"</Text> : null}
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  business: { flex: 1, ...typography.bodyStrong, fontSize: 14, color: colors.white, marginRight: spacing.sm },
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  detail: { ...typography.body, fontSize: 13, color: colors.textOnNavy, marginTop: spacing.xs },
  meta: { ...typography.caption, color: colors.textOnNavyFaint, marginTop: spacing.xs },
  note: { ...typography.caption, fontStyle: 'italic', color: colors.blue300, marginTop: spacing.xs },
});
