import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiFetch } from '../../services/apiClient';
import { colors, typography, spacing, radius, gutter } from '../../theme';

const STATUS_META = {
  pending:   { label: 'Pending',   color: '#f59e0b', bg: '#fef3c7' },
  confirmed: { label: 'Confirmed', color: '#16a34a', bg: '#dcfce7' },
  rejected:  { label: 'Declined',  color: '#dc2626', bg: '#fee2e2' },
  cancelled: { label: 'Cancelled', color: '#6b7280', bg: '#f3f4f6' },
  completed: { label: 'Completed', color: '#2563eb', bg: '#dbeafe' },
  noshow:    { label: 'No-show',   color: '#9333ea', bg: '#f3e8ff' },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

function BookingCard({ item, onCancel }) {
  const canCancel = ['pending', 'confirmed'].includes(item.status);
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.placeName}>{item.placeName}</Text>
          <Text style={styles.detail}>{item.date} at {item.time} · {item.partySize} people</Text>
          {item.guestName ? <Text style={styles.detail}>Reserved as: {item.guestName}</Text> : null}
          {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
        </View>
        <StatusBadge status={item.status} />
      </View>
      {canCancel && (
        <TouchableOpacity style={styles.cancelBtn} onPress={() => onCancel(item)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="cancel" size={16} color="#dc2626" />
          <Text style={styles.cancelText}>Cancel booking</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function MyBookingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/resto-bookings/mine');
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCancel = useCallback((booking) => {
    Alert.alert(
      'Cancel booking',
      `Cancel your reservation at ${booking.placeName} on ${booking.date} at ${booking.time}?`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel booking', style: 'destructive',
          onPress: async () => {
            try {
              await apiFetch(`/resto-bookings/${booking.id}`, { method: 'DELETE' });
              setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'cancelled' } : b));
            } catch (e) {
              Alert.alert('Error', e.message || 'Could not cancel booking.');
            }
          },
        },
      ]
    );
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>My Bookings</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.blue600} />
      ) : bookings.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={56} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptyText}>Your restaurant and coffee shop reservations will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={i => i.id}
          renderItem={({ item }) => <BookingCard item={item} onCancel={handleCancel} />}
          contentContainerStyle={{ padding: gutter, paddingBottom: insets.bottom + spacing.xl }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gutter,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  back: { padding: 4, marginRight: spacing.sm },
  title: { ...typography.title, color: colors.text },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: gutter, gap: spacing.sm },
  emptyTitle: { ...typography.subtitle, color: colors.text, textAlign: 'center' },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTop: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  placeName: { ...typography.subtitle, color: colors.text, marginBottom: 4 },
  detail: { ...typography.bodySmall, color: colors.textMuted, marginBottom: 2 },
  notes: { ...typography.caption, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' },
  badge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4, flexShrink: 0 },
  badgeText: { ...typography.meta, fontWeight: '700', fontSize: 11 },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  cancelText: { ...typography.caption, color: '#dc2626', fontWeight: '600' },
});
