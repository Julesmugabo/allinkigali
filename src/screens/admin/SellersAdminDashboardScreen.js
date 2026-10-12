/**
 * SellersAdminDashboardScreen.js — Admin dashboard for managing restaurants,
 * coffee shops, delivery settings, and pending listing applications.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  ActivityIndicator, Alert, StyleSheet, useWindowDimensions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../../components/common/GradientBackground';
import EmptyState from '../../components/common/EmptyState';
import AdminStatCard from '../../components/admin/AdminStatCard';
import AdminSidebar, { SIDEBAR_BREAKPOINT } from '../../components/admin/AdminSidebar';

import { apiFetch } from '../../services/apiClient';
import { colors, typography, spacing, radius, gutter, shadows } from '../../theme';

const SEGMENTS = [
  { key: 'pending',     label: 'Pending' },
  { key: 'restaurants', label: 'Restaurants' },
  { key: 'coffeeShops', label: 'Coffee Shops' },
  { key: 'deliveries',  label: 'Deliveries' },
];

const STATUS_COLOR = { open: '#60C080', closed: '#E05050', pending: '#F5C518', approved: '#60C080', declined: '#E05050' };

export default function SellersAdminDashboardScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= SIDEBAR_BREAKPOINT;
  const viaDirector = Boolean(route?.params?.viaDirector);

  const handleExit = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const [segment, setSegment] = useState(route?.params?.segment || 'pending');
  const [sidebarOpen, setSidebarOpen] = useState(isWide);

  // Data
  const [places, setPlaces]           = useState([]);  // restaurants + coffee shops
  const [pending, setPending]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [actionId, setActionId]       = useState(null); // id being actioned

  const loadPlaces = useCallback(async () => {
    try {
      const data = await apiFetch('/admin/restaurants-list');
      setPlaces(data);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }, []);

  const loadPending = useCallback(async () => {
    try {
      const data = await apiFetch('/pending-listings');
      setPending(data);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadPlaces(), loadPending()]).finally(() => setLoading(false));
  }, [loadPlaces, loadPending]);

  const reload = useCallback(() => {
    loadPlaces();
    loadPending();
  }, [loadPlaces, loadPending]);

  // Approve / decline pending listing
  const handleListingAction = useCallback(async (id, action) => {
    setActionId(id);
    try {
      await apiFetch(`/pending-listings/${id}/${action}`, { method: 'POST' });
      await Promise.all([loadPending(), loadPlaces()]);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setActionId(null);
    }
  }, [loadPending, loadPlaces]);

  // Toggle a field on a restaurant or coffee shop
  const patchPlace = useCallback(async (place, fields) => {
    setActionId(place.id);
    try {
      const endpoint = place.type === 'restaurant'
        ? `/admin/restaurants/${place.id}`
        : `/admin/coffee-shops/${place.id}`;
      await apiFetch(endpoint, { method: 'PATCH', body: JSON.stringify(fields) });
      await loadPlaces();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setActionId(null);
    }
  }, [loadPlaces]);

  const restaurants = places.filter(p => p.type === 'restaurant');
  const coffeeShops = places.filter(p => p.type === 'coffeeshop');
  const deliveries  = restaurants; // delivery settings only apply to restaurants

  const stats = {
    pending:         pending.filter(p => p.status === 'pending').length,
    restaurants:     restaurants.length,
    coffeeShops:     coffeeShops.length,
    deliveryEnabled: restaurants.filter(r => r.delivery_enabled).length,
  };

  const selectSegment = useCallback((key) => {
    setSegment(key);
    if (!isWide) setSidebarOpen(false);
  }, [isWide]);

  const sidebarSections = [
    {
      label: 'MANAGE',
      items: [
        { key: 'pending',     label: 'Pending Applications', icon: 'account-clock-outline', badge: stats.pending || null, onPress: () => selectSegment('pending') },
        { key: 'restaurants', label: 'Restaurants',          icon: 'silverware-fork-knife',  onPress: () => selectSegment('restaurants') },
        { key: 'coffeeShops', label: 'Coffee Shops',         icon: 'coffee-outline',         onPress: () => selectSegment('coffeeShops') },
        { key: 'deliveries',  label: 'Deliveries',           icon: 'moped-outline',          onPress: () => selectSegment('deliveries') },
      ],
    },
    {
      label: 'ACTIONS',
      items: [
        { key: 'refresh', label: 'Refresh', icon: 'refresh', onPress: reload },
        { key: 'exit', label: viaDirector ? 'Back to Director Dashboard' : 'Exit Admin', icon: viaDirector ? 'arrow-left' : 'exit-to-app', onPress: handleExit },
      ],
    },
  ];

  return (
    <GradientBackground>
      <View style={styles.body}>
        {isWide && sidebarOpen ? (
          <AdminSidebar brandSubtitle="ADMIN · PLACES" sections={sidebarSections} activeKey={segment} />
        ) : null}

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: spacing.huge }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar */}
          <View style={styles.topBar}>
            <Pressable onPress={handleExit} hitSlop={10} style={styles.iconBtn}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textOnNavy} />
            </Pressable>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>Places Dashboard</Text>
              <Text style={styles.subtitle}>Restaurants, coffee shops &amp; deliveries</Text>
            </View>
            <Pressable onPress={() => setSidebarOpen(v => !v)} hitSlop={10} style={[styles.iconBtn, { marginLeft: spacing.md }]}>
              <MaterialCommunityIcons name={sidebarOpen ? 'menu-open' : 'menu'} size={20} color={colors.textOnNavy} />
            </Pressable>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <AdminStatCard icon="account-clock-outline" value={stats.pending}     label="Pending apps"    tint={colors.warning} style={styles.statGap} />
            <AdminStatCard icon="silverware-fork-knife" value={stats.restaurants} label="Restaurants"     style={styles.statGap} />
          </View>
          <View style={styles.statsRow}>
            <AdminStatCard icon="coffee-outline"        value={stats.coffeeShops}     label="Coffee shops"   style={styles.statGap} />
            <AdminStatCard icon="moped-outline"         value={stats.deliveryEnabled} label="Delivery active" tint={colors.success} style={styles.statGap} />
          </View>

          {/* Segment tabs */}
          <View style={styles.segRow}>
            {SEGMENTS.map(s => {
              const active = segment === s.key;
              const badge = s.key === 'pending' ? stats.pending : 0;
              return (
                <Pressable key={s.key} onPress={() => selectSegment(s.key)} style={[styles.seg, active && styles.segActive]}>
                  <Text style={[styles.segLabel, active && styles.segLabelActive]} numberOfLines={1}>
                    {s.label}{badge ? ` (${badge})` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {loading ? (
            <ActivityIndicator color={colors.white} style={{ marginTop: spacing.xl }} />
          ) : segment === 'pending' ? (
            <PendingSegment
              items={pending.filter(p => p.status === 'pending')}
              actionId={actionId}
              onApprove={id => handleListingAction(id, 'approve')}
              onDecline={id => Alert.alert('Decline application', 'This will notify the applicant.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Decline', style: 'destructive', onPress: () => handleListingAction(id, 'decline') },
              ])}
            />
          ) : segment === 'restaurants' ? (
            <PlacesSegment
              items={restaurants}
              actionId={actionId}
              onToggleOpen={place => patchPlace(place, { open_status: place.open_status === 'open' ? 'closed' : 'open' })}
            />
          ) : segment === 'coffeeShops' ? (
            <PlacesSegment
              items={coffeeShops}
              actionId={actionId}
              onToggleOpen={place => patchPlace(place, { open_status: place.open_status === 'open' ? 'closed' : 'open' })}
            />
          ) : (
            <DeliveriesSegment
              items={deliveries}
              actionId={actionId}
              onToggle={place => patchPlace(place, { delivery_enabled: !place.delivery_enabled })}
              onSaveFee={(place, fee, time) => patchPlace(place, { delivery_fee: parseFloat(fee), estimated_time: time })}
            />
          )}
        </ScrollView>

        {!isWide && sidebarOpen ? (
          <View style={StyleSheet.absoluteFill}>
            <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={() => setSidebarOpen(false)} />
            <View style={styles.drawer}>
              <AdminSidebar brandSubtitle="ADMIN · PLACES" sections={sidebarSections} activeKey={segment} />
            </View>
          </View>
        ) : null}
      </View>
    </GradientBackground>
  );
}

const TYPE_ICON = {
  restaurant:    'silverware-fork-knife',
  coffeeshop:    'coffee-outline',
  wedding_venue: 'flower-outline',
  delivery:      'moped',
};
const TYPE_LABEL = {
  restaurant:    'Restaurant',
  coffeeshop:    'Café',
  wedding_venue: 'Wedding Venue',
  delivery:      'Delivery',
};

// ─── Pending Applications ────────────────────────────────────────────────────
function PendingSegment({ items, actionId, onApprove, onDecline }) {
  if (!items.length) return (
    <EmptyState tone="dark" icon="check-all" title="No pending applications" message="New registrations will appear here." />
  );
  return (
    <View>
      {items.map(item => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardRow}>
            <MaterialCommunityIcons
              name={TYPE_ICON[item.type] || 'store-outline'}
              size={18} color={colors.blue300} style={{ marginRight: spacing.sm }}
            />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.business_name || item.businessName}</Text>
              <Text style={styles.cardMeta}>{item.location} · {item.phone}</Text>
              <Text style={styles.cardMeta}>{item.email}</Text>
              {item.notes ? <Text style={[styles.cardMeta, { marginTop: 2 }]}>{item.notes}</Text> : null}
            </View>
            <View style={[styles.badge, { backgroundColor: `${STATUS_COLOR.pending}22` }]}>
              <Text style={[styles.badgeText, { color: STATUS_COLOR.pending }]}>
                {TYPE_LABEL[item.type] || item.type}
              </Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => onApprove(item.id)}
              disabled={actionId === item.id}
            >
              {actionId === item.id
                ? <ActivityIndicator size="small" color={colors.white} />
                : <>
                    <MaterialCommunityIcons name="check-circle-outline" size={14} color={colors.white} />
                    <Text style={styles.actionBtnText}>Access granted</Text>
                  </>}
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.declineBtn]}
              onPress={() => onDecline(item.id)}
              disabled={actionId === item.id}
            >
              <Text style={[styles.actionBtnText, { color: colors.danger }]}>Decline</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Restaurants / Coffee Shops ───────────────────────────────────────────────
function PlacesSegment({ items, actionId, onToggleOpen }) {
  if (!items.length) return (
    <EmptyState tone="dark" icon="store-search-outline" title="None yet" />
  );
  return (
    <View>
      {items.map(place => {
        const isOpen = place.open_status === 'open';
        return (
          <View key={place.id} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{place.name}</Text>
                <Text style={styles.cardMeta}>{place.location}</Text>
                {place.phone ? <Text style={styles.cardMeta}>{place.phone}</Text> : null}
              </View>
              <Pressable
                onPress={() => onToggleOpen(place)}
                disabled={actionId === place.id}
                style={[styles.togglePill, { backgroundColor: isOpen ? `${STATUS_COLOR.open}22` : `${STATUS_COLOR.closed}22` }]}
              >
                {actionId === place.id
                  ? <ActivityIndicator size="small" color={colors.white} />
                  : <Text style={[styles.toggleText, { color: isOpen ? STATUS_COLOR.open : STATUS_COLOR.closed }]}>
                      {isOpen ? 'Open' : 'Closed'}
                    </Text>}
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Deliveries ───────────────────────────────────────────────────────────────
function DeliveriesSegment({ items, actionId, onToggle, onSaveFee }) {
  const [editing, setEditing] = useState(null); // place id being edited
  const [fee, setFee]         = useState('');
  const [time, setTime]       = useState('');

  const startEdit = (place) => {
    setEditing(place.id);
    setFee(place.delivery_fee != null ? String(place.delivery_fee) : '');
    setTime(place.estimated_time || '');
  };

  if (!items.length) {
    return (
      <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
        <MaterialCommunityIcons name="moped-outline" size={48} color={colors.textOnNavyFaint} />
        <Text style={{ color: colors.textOnNavyFaint, fontSize: 14 }}>No restaurants with delivery set up yet.</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.sectionNote}>
        Toggle delivery on/off and set the fee and estimated time per restaurant.
      </Text>
      {items.map(place => {
        const enabled = place.delivery_enabled;
        const isEditing = editing === place.id;
        return (
          <View key={place.id} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{place.name}</Text>
                <Text style={styles.cardMeta}>{place.location}</Text>
                {!isEditing && enabled ? (
                  <Text style={styles.cardMeta}>
                    Fee: {place.delivery_fee != null ? `${place.delivery_fee} RWF` : '—'}
                    {'  ·  '}
                    ETA: {place.estimated_time || '—'}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={() => onToggle(place)}
                disabled={actionId === place.id}
                style={[styles.togglePill, { backgroundColor: enabled ? `${STATUS_COLOR.open}22` : 'rgba(255,255,255,0.08)' }]}
              >
                {actionId === place.id && !isEditing
                  ? <ActivityIndicator size="small" color={colors.white} />
                  : <Text style={[styles.toggleText, { color: enabled ? STATUS_COLOR.open : colors.textOnNavyFaint }]}>
                      {enabled ? 'On' : 'Off'}
                    </Text>}
              </Pressable>
            </View>

            {enabled && !isEditing ? (
              <Pressable onPress={() => startEdit(place)} style={styles.editLink}>
                <Text style={styles.editLinkText}>Edit fee &amp; time</Text>
              </Pressable>
            ) : null}

            {isEditing ? (
              <View style={styles.editRow}>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Fee (RWF)</Text>
                  <TextInput
                    style={styles.editInput}
                    value={fee}
                    onChangeText={setFee}
                    keyboardType="numeric"
                    placeholder="e.g. 1000"
                    placeholderTextColor={colors.textOnNavyFaint}
                  />
                </View>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Est. time</Text>
                  <TextInput
                    style={styles.editInput}
                    value={time}
                    onChangeText={setTime}
                    placeholder="e.g. 30-45 min"
                    placeholderTextColor={colors.textOnNavyFaint}
                  />
                </View>
                <Pressable
                  style={[styles.actionBtn, styles.approveBtn, { marginTop: spacing.lg + 2, paddingHorizontal: spacing.md }]}
                  onPress={() => { onSaveFee(place, fee, time); setEditing(null); }}
                >
                  <Text style={styles.actionBtnText}>Save</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, { marginTop: spacing.lg + 2, backgroundColor: 'rgba(255,255,255,0.08)' }]}
                  onPress={() => setEditing(null)}
                >
                  <Text style={[styles.actionBtnText, { color: colors.textOnNavyFaint }]}>Cancel</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  body:       { flex: 1, flexDirection: 'row' },
  flex:       { flex: 1 },
  backdrop:   { backgroundColor: 'rgba(0,0,0,0.45)' },
  drawer:     { position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 1, ...shadows.floating },
  content:    { paddingHorizontal: gutter },
  topBar:     { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  iconBtn: {
    width: 38, height: 38, borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  titleWrap:  { flex: 1, marginLeft: spacing.md },
  title:      { fontSize: 18, fontWeight: '700', color: colors.white, letterSpacing: -0.3 },
  subtitle:   { ...typography.caption, color: colors.textOnNavyFaint, marginTop: 2 },
  statsRow:   { flexDirection: 'row', marginBottom: spacing.md },
  statGap:    { marginRight: spacing.md },
  segRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    padding: 3,
    marginBottom: spacing.lg,
  },
  seg:            { flex: 1, height: 34, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  segActive:      { backgroundColor: colors.blue500 },
  segLabel:       { fontSize: 11, color: colors.textOnNavyFaint },
  segLabelActive: { color: colors.white, fontWeight: '600' },
  sectionNote:    { ...typography.caption, color: colors.textOnNavyFaint, marginBottom: spacing.md, lineHeight: 16 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardRow:    { flexDirection: 'row', alignItems: 'center' },
  cardBody:   { flex: 1 },
  cardTitle:  { ...typography.bodyStrong, fontSize: 13.5, color: colors.white },
  cardMeta:   { ...typography.caption, color: colors.textOnNavyFaint, marginTop: 2 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, marginLeft: spacing.sm },
  badgeText:  { fontSize: 10, fontWeight: '700' },
  actionRow:  { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: {
    flex: 1, height: 38, borderRadius: radius.sm,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
  },
  approveBtn: { backgroundColor: colors.blue500 },
  declineBtn: { backgroundColor: 'rgba(208,52,44,0.16)', borderWidth: 1, borderColor: 'rgba(208,52,44,0.3)' },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: colors.white },
  togglePill: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill, marginLeft: spacing.sm, minWidth: 56, alignItems: 'center',
  },
  toggleText: { fontSize: 12, fontWeight: '700' },
  editLink:   { marginTop: spacing.sm },
  editLinkText: { ...typography.caption, color: colors.blue300, fontWeight: '600' },
  editRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  editField:  { flex: 1 },
  editLabel:  { ...typography.caption, color: colors.textOnNavyFaint, marginBottom: spacing.xs },
  editInput: {
    height: 38, borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(133,183,235,0.3)',
    paddingHorizontal: spacing.sm,
    color: colors.white, fontSize: 13,
  },
});
