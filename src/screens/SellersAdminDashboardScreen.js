/**
 * SellersAdminDashboardScreen.js — Ubuyobozi bw'abafatanyabikorwa (Sales
 * Partners admin dashboard) — "the heart of the business."
 *
 * Same sidebar/segment/toggle pattern as the News dashboard (copy that
 * screen's responsive sidebar code if this needs touching again — see the
 * memory notes on why it's not factored into a shared hook yet).
 *
 * Four segments: Pending Approval (new, unverified sellers), All Sellers
 * (the full directory), All Requests (every booking, across every seller —
 * not just one seller's own inbox, which is what SellerDashboardScreen
 * shows), and Categories (what sellers are actually registering under,
 * including custom ones — see getCategoryCounts in businessSearch.js).
 *
 * Every number is real, computed from BusinessContext/BookingContext.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, Alert, useWindowDimensions, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import TextField from '../components/common/TextField';
import EmptyState from '../components/common/EmptyState';
import AdminStatCard from '../components/admin/AdminStatCard';
import AdminBusinessRow from '../components/admin/AdminBusinessRow';
import AdminSidebar, { SIDEBAR_BREAKPOINT } from '../components/admin/AdminSidebar';

import { useBusinesses } from '../context/BusinessContext';
import { useBookings } from '../context/BookingContext';
import { useFliers } from '../context/FliersContext';
import { setToken } from '../services/apiClient';
import { categoryLabel, getCategoryCounts } from '../services/businessSearch';
import { normalise } from '../utils/format';
import { colors, typography, spacing, radius, gutter, shadows } from '../theme';

const SEGMENTS = [
  { key: 'pending', label: 'Pending' },
  { key: 'all', label: 'All Sellers' },
  { key: 'requests', label: 'Requests' },
  { key: 'categories', label: 'Categories' },
  { key: 'fliers', label: 'Fliers' },
];

const REQUEST_STATUS_META = {
  new: { label: 'New', color: colors.blue500 },
  handled: { label: 'Handled', color: colors.success },
  no_response: { label: 'No response', color: colors.warning },
};

export default function SellersAdminDashboardScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= SIDEBAR_BREAKPOINT;
  // Opened from the Director dashboard rather than the password gate — exit
  // should return there instead of leaving Admin entirely (same viaAdmin
  // pattern already used for BusinessDetail/SellerDashboard).
  const viaDirector = Boolean(route?.params?.viaDirector);
  const exitTarget = viaDirector ? 'DirectorAdminDashboard' : 'Main';

  // Only a real exit (not "back to Director") ends the actual session.
  const handleExit = useCallback(async () => {
    if (!viaDirector) await setToken(null);
    navigation.navigate(exitTarget);
  }, [viaDirector, exitTarget, navigation]);

  const { businesses, approveBusiness, deleteBusiness } = useBusinesses();
  const { bookings } = useBookings();
  const { fliers, deleteFlier } = useFliers();

  const [segment, setSegment] = useState(route?.params?.segment || 'pending');
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(isWide);

  const stats = useMemo(() => {
    const verified = businesses.filter((b) => b.verified).length;
    const pending = businesses.filter((b) => !b.verified).length;
    const responded = bookings.filter((b) => b.respondedAt);
    let avgResponseLabel = 'No data yet';
    if (responded.length) {
      const avgMinutes =
        responded.reduce((sum, b) => sum + (new Date(b.respondedAt) - new Date(b.createdAt)) / 60000, 0) /
        responded.length;
      avgResponseLabel = avgMinutes < 60 ? `${Math.round(avgMinutes)} min` : `${Math.round(avgMinutes / 60)} hr`;
    }
    return { total: businesses.length, verified, pending, totalRequests: bookings.length, avgResponseLabel };
  }, [businesses, bookings]);

  // Counted once per bookings-change rather than a fresh filter over every
  // booking for every seller row rendered.
  const requestCountByBusiness = useMemo(() => {
    const counts = new Map();
    bookings.forEach((b) => counts.set(b.businessId, (counts.get(b.businessId) || 0) + 1));
    return counts;
  }, [bookings]);
  const requestCountFor = useCallback(
    (businessId) => requestCountByBusiness.get(businessId) || 0,
    [requestCountByBusiness]
  );

  const selectSegment = useCallback(
    (key) => {
      setSegment(key);
      if (!isWide) setSidebarOpen(false);
    },
    [isWide]
  );

  const sidebarSections = useMemo(
    () => [
      {
        label: 'DASHBOARD',
        items: [
          {
            key: 'pending',
            label: 'Pending Approval',
            icon: 'account-clock-outline',
            badge: stats.pending || null,
            onPress: () => selectSegment('pending'),
          },
          { key: 'all', label: 'All Sellers', icon: 'store-outline', onPress: () => selectSegment('all') },
          { key: 'requests', label: 'All Requests', icon: 'inbox-outline', onPress: () => selectSegment('requests') },
          { key: 'categories', label: 'Categories', icon: 'shape-outline', onPress: () => selectSegment('categories') },
          {
            key: 'fliers',
            label: 'Fliers',
            icon: 'image-multiple-outline',
            badge: fliers.length || null,
            onPress: () => selectSegment('fliers'),
          },
        ],
      },
      {
        label: 'ACTIONS',
        items: [
          {
            key: 'newFlier',
            label: 'New Flier',
            icon: 'image-multiple-outline',
            onPress: () => navigation.navigate('FlierEditor'),
          },
          {
            key: 'exit',
            label: viaDirector ? 'Back to Director Dashboard' : 'Exit Admin',
            icon: viaDirector ? 'arrow-left' : 'exit-to-app',
            onPress: handleExit,
          },
        ],
      },
    ],
    [stats.pending, fliers.length, selectSegment, navigation, viaDirector, handleExit]
  );

  const visibleBusinesses = useMemo(() => {
    const q = normalise(search);
    const base =
      segment === 'pending' ? businesses.filter((b) => !b.verified) : businesses;
    if (!q) return base;
    return base.filter((b) =>
      normalise([b.name, b.category, b.location].join(' ')).includes(q)
    );
  }, [businesses, segment, search]);

  const categoryCounts = useMemo(() => getCategoryCounts(businesses), [businesses]);

  const handleReject = useCallback(
    (business) => {
      Alert.alert(
        'Reject this seller?',
        `"${business.name}" hasn't been approved yet, so this removes the listing entirely (not an archive — it was never live).`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reject', style: 'destructive', onPress: () => deleteBusiness(business.id) },
        ]
      );
    },
    [deleteBusiness]
  );

  const handleView = useCallback(
    (business) => {
      // Stays inside AdminNavigator's own stack (BusinessDetail is registered
      // there too) so the screen's own back button returns here correctly —
      // no need to leave Admin for the real customer app just to look.
      navigation.navigate('BusinessDetail', { businessId: business.id, viaAdmin: true });
    },
    [navigation]
  );

  const handleEdit = useCallback(
    (business) => {
      navigation.navigate('SalesPartner', { businessId: business.id });
    },
    [navigation]
  );

  const handleOpenDashboard = useCallback(
    (business) => {
      navigation.navigate('SellerDashboard', { businessId: business.id, viaAdmin: true });
    },
    [navigation]
  );

  // A Map built once per businesses-change, rather than a fresh linear scan
  // for every flier row rendered — matters once there are real numbers of
  // both businesses and fliers, not just the handful seeded today.
  const businessNameById = useMemo(() => new Map(businesses.map((b) => [b.id, b.name])), [businesses]);
  const businessNameFor = useCallback(
    (id) => businessNameById.get(id) || 'Ubucuruzi bwasibwe',
    [businessNameById]
  );

  const handleDeleteFlier = useCallback(
    (flier) => {
      Alert.alert('Delete flier', 'Remove this flier from the Shop tab?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteFlier(flier.id) },
      ]);
    },
    [deleteFlier]
  );

  const sortedRequests = useMemo(() => [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [bookings]);

  return (
    <GradientBackground>
      <View style={styles.body}>
        {isWide && sidebarOpen ? (
          <AdminSidebar brandSubtitle="ADMIN · SELLERS" sections={sidebarSections} activeKey={segment} />
        ) : null}

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: spacing.huge }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Pressable
              onPress={() => setSidebarOpen((v) => !v)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              style={styles.backButton}
            >
              <MaterialCommunityIcons name={sidebarOpen ? 'menu-open' : 'menu'} size={20} color={colors.textOnNavy} />
            </Pressable>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>Sales Partners Dashboard</Text>
              <Text style={styles.subtitle}>Every seller on the platform, in one place</Text>
            </View>
            <Pressable
              onPress={handleExit}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={viaDirector ? 'Back to Director dashboard' : 'Exit admin'}
              style={styles.backButton}
            >
              <MaterialCommunityIcons name={viaDirector ? 'arrow-left' : 'exit-to-app'} size={20} color={colors.textOnNavy} />
            </Pressable>
          </View>

          {/* --- Stats --------------------------------------------------- */}
          <View style={styles.statsRow}>
            <AdminStatCard icon="store-outline" value={stats.total} label="Total sellers" style={styles.statSpacing} />
            <AdminStatCard icon="check-decagram-outline" value={stats.verified} label="Verified" tint={colors.success} style={styles.statSpacing} />
          </View>
          <View style={styles.statsRow}>
            <AdminStatCard icon="account-clock-outline" value={stats.pending} label="Pending approval" tint={colors.warning} style={styles.statSpacing} />
            <AdminStatCard icon="inbox-outline" value={stats.totalRequests} label="Total requests" tint={colors.blue500} style={styles.statSpacing} />
          </View>
          <View style={styles.responseCard}>
            <MaterialCommunityIcons name="clock-fast" size={15} color={colors.blue300} />
            <Text style={styles.responseText}>Platform-wide average response time: {stats.avgResponseLabel}</Text>
          </View>

          {/* --- Segments -------------------------------------------------- */}
          <View style={styles.segmentRow}>
            {SEGMENTS.map((option) => {
              const active = segment === option.key;
              const badge = option.key === 'pending' ? stats.pending : option.key === 'fliers' ? fliers.length : 0;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => selectSegment(option.key)}
                  accessibilityRole="button"
                  style={[styles.segment, active && styles.segmentActive]}
                >
                  <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]} numberOfLines={1}>
                    {option.label}
                    {badge ? ` (${badge})` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* --- Categories segment ---------------------------------------- */}
          {segment === 'categories' ? (
            <View>
              <Text style={styles.sectionNote}>
                What sellers are actually registering under — including categories nobody predefined.
              </Text>
              {categoryCounts.length ? (
                categoryCounts.map((c) => (
                  <View key={c.category} style={styles.categoryRow}>
                    <View style={styles.categoryBody}>
                      <Text style={styles.categoryLabel}>{c.label}</Text>
                      <Text style={styles.categoryCount}>
                        {c.count} {c.count === 1 ? 'seller' : 'sellers'}
                        {!c.isPreset ? ' · custom category' : ''}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <EmptyState tone="dark" icon="shape-outline" title="No categories yet" />
              )}
            </View>
          ) : segment === 'requests' ? (
            /* --- All Requests segment -------------------------------------- */
            <View>
              {sortedRequests.length ? (
                sortedRequests.map((booking) => {
                  const statusMeta = REQUEST_STATUS_META[booking.status] || REQUEST_STATUS_META.new;
                  return (
                    <View key={booking.id} style={styles.requestRow}>
                      <View style={styles.requestTop}>
                        <Text style={styles.requestBusiness} numberOfLines={1}>
                          {booking.businessName}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: `${statusMeta.color}22` }]}>
                          <Text style={[styles.statusLabel, { color: statusMeta.color }]}>{statusMeta.label}</Text>
                        </View>
                      </View>
                      <Text style={styles.requestMeta}>
                        {booking.itemLabel || `Qty: ${booking.quantity}`} · {booking.date}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <EmptyState
                  tone="dark"
                  icon="inbox-outline"
                  title="No requests yet"
                  message="Every customer request, across every seller, will show up here."
                />
              )}
            </View>
          ) : segment === 'fliers' ? (
            /* --- Fliers segment (Shop tab ad carousel) ---------------------- */
            <View>
              <Pressable onPress={() => navigation.navigate('FlierEditor')} style={styles.newFlierButton} accessibilityRole="button">
                <MaterialCommunityIcons name="plus" size={16} color={colors.white} />
                <Text style={styles.newFlierLabel}>New flier</Text>
              </Pressable>

              {fliers.length ? (
                fliers.map((flier) => (
                  <View key={flier.id} style={styles.flierRow}>
                    <View style={styles.flierThumb}>
                      {flier.imageUri ? (
                        <Image source={{ uri: flier.imageUri }} style={styles.flierThumbImage} resizeMode="cover" />
                      ) : (
                        <MaterialCommunityIcons name="image-outline" size={18} color={colors.blue300} />
                      )}
                    </View>
                    <View style={styles.categoryBody}>
                      <Text style={styles.categoryLabel} numberOfLines={1}>
                        {businessNameFor(flier.businessId)}
                      </Text>
                      <Text style={styles.categoryCount}>Shows in the Shop tab carousel</Text>
                    </View>
                    <Pressable
                      onPress={() => navigation.navigate('FlierEditor', { flierId: flier.id })}
                      accessibilityRole="button"
                      accessibilityLabel="Edit flier"
                      style={styles.flierAction}
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.blue300} />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteFlier(flier)}
                      accessibilityRole="button"
                      accessibilityLabel="Delete flier"
                      style={[styles.flierAction, styles.flierDelete]}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.danger} />
                    </Pressable>
                  </View>
                ))
              ) : (
                <EmptyState
                  tone="dark"
                  icon="image-multiple-outline"
                  title="No fliers yet"
                  message="Fliers you add appear in an auto-scrolling strip below the search bar on the Shop tab."
                />
              )}
            </View>
          ) : (
            /* --- Pending / All Sellers segments ----------------------------- */
            <View>
              <TextField
                label="Search"
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name, category or location"
                icon="magnify"
              />

              {visibleBusinesses.length ? (
                visibleBusinesses.map((business) => (
                  <AdminBusinessRow
                    key={business.id}
                    business={business}
                    categoryLabel={categoryLabel(business.category)}
                    requestCount={requestCountFor(business.id)}
                    mode={segment === 'pending' ? 'pending' : 'manage'}
                    onApprove={approveBusiness}
                    onReject={handleReject}
                    onView={handleView}
                    onEdit={handleEdit}
                    onOpenDashboard={handleOpenDashboard}
                  />
                ))
              ) : (
                <EmptyState
                  tone="dark"
                  icon={segment === 'pending' ? 'check-all' : 'store-search-outline'}
                  title={segment === 'pending' ? 'Nothing waiting for approval' : 'No sellers found'}
                  message={
                    segment === 'pending'
                      ? 'New registrations will appear here for review.'
                      : 'Try a different search.'
                  }
                />
              )}
            </View>
          )}
        </ScrollView>

        {!isWide && sidebarOpen ? (
          <View style={StyleSheet.absoluteFill}>
            <Pressable
              style={[StyleSheet.absoluteFill, styles.backdrop]}
              onPress={() => setSidebarOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Close sidebar"
            />
            <View style={styles.drawer}>
              <AdminSidebar brandSubtitle="ADMIN · SELLERS" sections={sidebarSections} activeKey={segment} />
            </View>
          </View>
        ) : null}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, flexDirection: 'row' },
  flex: { flex: 1 },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.45)' },
  drawer: { position: 'absolute', left: 0, top: 0, bottom: 0, ...shadows.floating },
  content: { paddingHorizontal: gutter },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  titleWrap: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700', color: colors.white, letterSpacing: -0.3 },
  subtitle: { ...typography.caption, color: colors.textOnNavyFaint, marginTop: 2 },
  statsRow: { flexDirection: 'row', marginBottom: spacing.md },
  statSpacing: { marginRight: spacing.md },
  responseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(55,138,221,0.16)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  responseText: { ...typography.caption, color: colors.blue300, marginLeft: spacing.sm, flexShrink: 1 },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    padding: 3,
    marginBottom: spacing.lg,
  },
  segment: { flex: 1, height: 34, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: colors.blue500 },
  segmentLabel: { fontSize: 11.5, color: colors.textOnNavyFaint },
  segmentLabelActive: { color: colors.white, fontWeight: '600' },
  sectionNote: { ...typography.caption, color: colors.textOnNavyFaint, marginBottom: spacing.md, lineHeight: 16 },
  categoryRow: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  categoryBody: { flex: 1 },
  categoryLabel: { ...typography.bodyStrong, fontSize: 13.5, color: colors.white },
  categoryCount: { ...typography.caption, color: colors.textOnNavyFaint, marginTop: 2 },
  requestRow: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  requestTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  requestBusiness: { flex: 1, ...typography.bodyStrong, fontSize: 13, color: colors.white, marginRight: spacing.sm },
  requestMeta: { ...typography.caption, color: colors.textOnNavyFaint, marginTop: 4 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  statusLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  newFlierButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blue500,
    borderRadius: radius.md,
    height: 46,
    marginBottom: spacing.lg,
  },
  newFlierLabel: { fontSize: 13.5, fontWeight: '600', color: colors.white, marginLeft: spacing.xs },
  flierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  flierThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(133,183,235,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  flierThumbImage: { width: '100%', height: '100%' },
  flierAction: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  flierDelete: { backgroundColor: 'rgba(208,52,44,0.16)' },
});
