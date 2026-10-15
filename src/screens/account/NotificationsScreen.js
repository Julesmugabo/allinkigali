import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiFetch } from '../../services/apiClient';
import { colors, typography, spacing, radius, gutter } from '../../theme';
import AppTopBar from '../../components/common/AppTopBar';

const TYPE_ICON = {
  booking_confirmed: { icon: 'calendar-check', color: '#16a34a' },
  booking_rejected:  { icon: 'calendar-remove', color: '#dc2626' },
  booking_cancelled: { icon: 'calendar-minus', color: '#f59e0b' },
  new_booking:       { icon: 'calendar-plus', color: '#2563eb' },
  new_order:         { icon: 'moped', color: '#7c3aed' },
  order_update:      { icon: 'package-variant', color: '#0891b2' },
  listing_approved:  { icon: 'check-decagram', color: '#16a34a' },
  listing_declined:  { icon: 'close-circle', color: '#dc2626' },
  general:           { icon: 'bell', color: '#6b7280' },
};

function NotifIcon({ type }) {
  const meta = TYPE_ICON[type] || TYPE_ICON.general;
  return (
    <View style={[styles.iconWrap, { backgroundColor: meta.color + '18' }]}>
      <MaterialCommunityIcons name={meta.icon} size={22} color={meta.color} />
    </View>
  );
}

function NotifRow({ item, onRead }) {
  return (
    <TouchableOpacity
      style={[styles.row, !item.is_read && styles.rowUnread]}
      onPress={() => onRead(item.id)}
      activeOpacity={0.7}
    >
      <NotifIcon type={item.type} />
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, !item.is_read && styles.rowTitleBold]}>{item.title}</Text>
        <Text style={styles.rowBody2}>{item.body}</Text>
        <Text style={styles.rowTime}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
      {!item.is_read && <View style={styles.dot} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/notifications');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleTap = useCallback(async (item) => {
    // mark read
    setItems(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
    try { await apiFetch(`/notifications/${item.id}/read`, { method: 'PUT' }); } catch {}
    // deep-link based on type
    const { type, ref_id } = item;
    if (type === 'booking_confirmed' || type === 'booking_rejected' || type === 'booking_cancelled' || type === 'new_booking') {
      navigation.navigate('MyBookings');
    } else if (type === 'new_order' || type === 'order_update') {
      navigation.navigate('Orders');
    } else if (type === 'listing_approved' || type === 'listing_declined') {
      navigation.navigate('Me');
    }
  }, [navigation]);

  const markAllRead = useCallback(async () => {
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    try { await apiFetch('/notifications/read-all', { method: 'PUT' }); } catch {}
  }, []);

  const unread = items.filter(n => !n.is_read).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppTopBar variant="slim" style={{ paddingHorizontal: gutter, marginTop: spacing.xs }} />
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unread > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAll}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.blue600} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="bell-sleep-outline" size={56} color={colors.textMuted} />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          renderItem={({ item }) => <NotifRow item={item} onRead={() => handleTap(item)} />}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: insets.bottom + spacing.xl }}
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
  title: { ...typography.title, color: colors.text, flex: 1 },
  markAll: { paddingHorizontal: spacing.sm },
  markAllText: { ...typography.caption, color: colors.blue600, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyText: { ...typography.body, color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  rowUnread: { backgroundColor: colors.blue600 + '08' },
  iconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowBody: { flex: 1 },
  rowTitle: { ...typography.bodySmall, color: colors.text, marginBottom: 2 },
  rowTitleBold: { fontWeight: '700' },
  rowBody2: { ...typography.caption, color: colors.textMuted, marginBottom: 4 },
  rowTime: { ...typography.meta, color: colors.textMuted },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.blue600, marginTop: 6, flexShrink: 0 },
});
