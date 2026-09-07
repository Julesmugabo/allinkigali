/**
 * SellerDashboardScreen.js — Dashboard y'umufatanyabikorwa (seller dashboard).
 *
 * Same responsive sidebar/segment pattern as the admin dashboards (copy the
 * useWindowDimensions/sidebarOpen/backdrop-drawer code from
 * NewsAdminDashboardScreen.js if this needs touching again). Three segments:
 * Overview (availability, stats, a real "grow your business" checklist),
 * Requests (the inbox), and Insights (profile views, response health) —
 * pulled out of one long scroll into organized sections, matching how the
 * admin side is already structured.
 *
 * This screen is opened from two different places — a seller's own Me tab
 * (nested inside 'Main'), and the Sales Partners admin dashboard (a
 * completely separate top-level stack) — route.params.viaAdmin says which,
 * because a couple of things behave differently: the "preview as customer"
 * button needs a different navigation target in each case, and the "your
 * businesses" switcher only makes sense for a real signed-in owner, not an
 * admin browsing someone else's listing.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, useWindowDimensions, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import EmptyState from '../components/common/EmptyState';
import SellerRequestRow from '../components/seller/SellerRequestRow';
import AdminSidebar, { SIDEBAR_BREAKPOINT } from '../components/admin/AdminSidebar';

import { useBusinesses } from '../context/BusinessContext';
import { useBookings } from '../context/BookingContext';
import { useUser } from '../context/UserContext';
import { colors, typography, spacing, radius, gutter, shadows } from '../theme';

const DAY_MS = 24 * 60 * 60 * 1000;
const SEGMENTS = [
  { key: 'overview', label: 'Overview' },
  { key: 'requests', label: 'Requests' },
  { key: 'insights', label: 'Insights' },
];

function computeStats(bookings) {
  const now = Date.now();
  const thisWeek = bookings.filter((b) => now - new Date(b.createdAt).getTime() <= 7 * DAY_MS).length;
  const thisMonth = bookings.filter((b) => now - new Date(b.createdAt).getTime() <= 30 * DAY_MS).length;

  const responded = bookings.filter((b) => b.respondedAt);
  const handled = bookings.filter((b) => b.status === 'handled').length;
  let avgResponseLabel = 'Nta makuru arahari';
  if (responded.length) {
    const avgMinutes =
      responded.reduce((sum, b) => sum + (new Date(b.respondedAt) - new Date(b.createdAt)) / 60000, 0) /
      responded.length;
    avgResponseLabel =
      avgMinutes < 60 ? `Iminota ${Math.round(avgMinutes)}` : `Amasaha ${Math.round(avgMinutes / 60)}`;
  }
  const handledRateLabel = responded.length ? `${Math.round((handled / responded.length) * 100)}%` : 'Nta makuru arahari';

  return { thisWeek, thisMonth, avgResponseLabel, handledRateLabel };
}

export default function SellerDashboardScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= SIDEBAR_BREAKPOINT;
  const viaAdmin = Boolean(route.params?.viaAdmin);

  const { getBusinessById, updateBusiness, getBusinessesByOwner } = useBusinesses();
  const { getBookingsForBusiness, updateBookingStatus } = useBookings();
  const { user } = useUser();

  const business = getBusinessById(route.params?.businessId);
  const [segment, setSegment] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(isWide);

  const bookings = useMemo(
    () => (business ? getBookingsForBusiness(business.id) : []),
    [business, getBookingsForBusiness]
  );

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort((a, b) => {
        if (a.status === 'new' && b.status !== 'new') return -1;
        if (a.status !== 'new' && b.status === 'new') return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      }),
    [bookings]
  );

  const stats = useMemo(() => computeStats(bookings), [bookings]);

  // Only meaningful for a real signed-in owner looking at their own
  // account — an admin browsing a listing has no business seeing (or being
  // offered to switch into) some unrelated customer's other listings.
  const myBusinesses = useMemo(
    () => (!viaAdmin && user ? getBusinessesByOwner(user.id) : []),
    [viaAdmin, user, getBusinessesByOwner]
  );

  const checklist = useMemo(() => {
    if (!business) return [];
    return [
      { key: 'photo', label: "Shyiraho ifoto y'ubucuruzi", done: Boolean(business.image) },
      { key: 'description', label: 'Andika ibisobanuro birambuye', done: Boolean(business.description?.trim()) },
      { key: 'highlights', label: "Andika impamvu abantu bakwifuza", done: Boolean(business.highlights?.length) },
      { key: 'verified', label: 'Tegereza ko ubuyobozi bwemeza ubucuruzi bwawe', done: Boolean(business.verified) },
      { key: 'responded', label: 'Subiza icyifuzo cya mbere', done: bookings.some((b) => b.status !== 'new') },
    ];
  }, [business, bookings]);

  const conversionLabel = useMemo(() => {
    const views = business?.views || 0;
    if (!views) return null;
    return `${Math.round((bookings.length / views) * 100)}%`;
  }, [business, bookings.length]);

  const selectSegment = useCallback(
    (key) => {
      setSegment(key);
      if (!isWide) setSidebarOpen(false);
    },
    [isWide]
  );

  const switchBusiness = useCallback(
    (id) => {
      navigation.setParams({ businessId: id });
      if (!isWide) setSidebarOpen(false);
    },
    [navigation, isWide]
  );

  const handleToggleAvailable = useCallback(
    (value) => {
      if (business) updateBusiness(business.id, { isAvailableNow: value });
    },
    [business, updateBusiness]
  );

  const handleMarkHandled = useCallback((id) => updateBookingStatus(id, 'handled'), [updateBookingStatus]);
  const handleMarkNoResponse = useCallback((id) => updateBookingStatus(id, 'no_response'), [updateBookingStatus]);

  const handlePreview = useCallback(() => {
    if (viaAdmin) {
      // Stays inside AdminNavigator's own stack (BusinessDetail is
      // registered there too), so its back button returns here correctly.
      navigation.navigate('BusinessDetail', { businessId: business.id, viaAdmin: true });
    } else {
      // 'Main' first: from the seller's own AccountStack, a bare 'ShopTab'
      // target wouldn't resolve any differently, but spelling out the full
      // path keeps this call correct even if this screen's own place in the
      // tree ever changes.
      navigation.navigate('Main', {
        screen: 'ShopTab',
        params: { screen: 'BusinessDetail', params: { businessId: business.id } },
      });
    }
  }, [navigation, viaAdmin, business]);

  const sidebarSections = useMemo(() => {
    const sections = [];
    if (myBusinesses.length > 1) {
      sections.push({
        label: 'YOUR BUSINESSES',
        items: myBusinesses.map((b) => ({
          key: b.id,
          label: b.name,
          icon: b.icon || 'store-outline',
          onPress: () => switchBusiness(b.id),
        })),
      });
    }
    sections.push({
      label: 'DASHBOARD',
      items: [
        { key: 'overview', label: 'Overview', icon: 'view-dashboard-outline', onPress: () => selectSegment('overview') },
        {
          key: 'requests',
          label: 'Requests',
          icon: 'inbox-outline',
          badge: bookings.filter((b) => b.status === 'new').length || null,
          onPress: () => selectSegment('requests'),
        },
        { key: 'insights', label: 'Insights', icon: 'chart-line', onPress: () => selectSegment('insights') },
      ],
    });
    sections.push({
      label: 'ACTIONS',
      items: [
        {
          key: 'edit',
          label: 'Hindura ubucuruzi',
          icon: 'pencil-outline',
          onPress: () => navigation.navigate('SalesPartner', { businessId: business.id }),
        },
        { key: 'plans', label: 'Igenamigambi', icon: 'crown-outline', onPress: () => navigation.navigate('SellerPlans') },
      ],
    });
    return sections;
  }, [myBusinesses, switchBusiness, selectSegment, bookings, navigation, business]);

  if (!business) {
    return (
      <GradientBackground>
        <View style={styles.emptyWrap}>
          <EmptyState tone="dark" icon="alert-circle-outline" title="Ubucuruzi ntibubonetse" />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View style={styles.body}>
        {isWide && sidebarOpen ? (
          <AdminSidebar brandTitle={business.name} brandSubtitle="YOUR DASHBOARD" sections={sidebarSections} activeKey={segment} />
        ) : null}

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: spacing.huge }]}
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
            <Text style={styles.title} numberOfLines={1}>{business.name}</Text>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Subira inyuma"
              style={styles.backButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textOnNavy} />
            </Pressable>
          </View>

          {/* --- Segments --------------------------------------------------- */}
          <View style={styles.segmentRow}>
            {SEGMENTS.map((option) => {
              const active = segment === option.key;
              const badge = option.key === 'requests' ? bookings.filter((b) => b.status === 'new').length : 0;
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

          {segment === 'overview' ? (
            <View>
              <View style={styles.quickRow}>
                <Pressable onPress={handlePreview} style={styles.quickAction} accessibilityRole="button">
                  <MaterialCommunityIcons name="eye-outline" size={16} color={colors.blue300} />
                  <Text style={styles.quickActionLabel}>Reba nk'uko abakiriya babibona</Text>
                </Pressable>
                <Pressable
                  onPress={() => navigation.navigate('SalesPartner', { businessId: business.id })}
                  style={styles.quickAction}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.blue300} />
                  <Text style={styles.quickActionLabel}>Hindura ubucuruzi</Text>
                </Pressable>
              </View>

              <View style={styles.card}>
                <View style={styles.availableRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.availableTitle}>Ndahari ubu</Text>
                    <Text style={styles.availableSubtitle}>
                      {business.isAvailableNow ? 'Abakiriya babona ko uhari' : 'Abakiriya babona ko ufunze/wuzuye'}
                    </Text>
                  </View>
                  <Switch
                    value={Boolean(business.isAvailableNow)}
                    onValueChange={handleToggleAvailable}
                    trackColor={{ false: 'rgba(255,255,255,0.2)', true: colors.success }}
                    thumbColor={colors.white}
                  />
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <MaterialCommunityIcons name="star" size={16} color="#F5B942" />
                  <Text style={styles.statValue}>{business.rating || '—'}</Text>
                  <Text style={styles.statLabel}>{business.reviewCount || 0} ibitekerezo</Text>
                </View>
                <View style={styles.statCard}>
                  <MaterialCommunityIcons name="calendar-week-outline" size={16} color={colors.blue300} />
                  <Text style={styles.statValue}>{stats.thisWeek}</Text>
                  <Text style={styles.statLabel}>Iki cyumweru</Text>
                </View>
                <View style={styles.statCard}>
                  <MaterialCommunityIcons name="calendar-month-outline" size={16} color={colors.blue300} />
                  <Text style={styles.statValue}>{stats.thisMonth}</Text>
                  <Text style={styles.statLabel}>Uku kwezi</Text>
                </View>
              </View>

              <Text style={styles.sectionLabel}>Kwongera ubucuruzi bwawe</Text>
              <View style={styles.checklistCard}>
                {checklist.map((item) => (
                  <Pressable
                    key={item.key}
                    onPress={() =>
                      !item.done && item.key !== 'verified' && item.key !== 'responded'
                        ? navigation.navigate('SalesPartner', { businessId: business.id })
                        : undefined
                    }
                    style={styles.checklistRow}
                  >
                    <MaterialCommunityIcons
                      name={item.done ? 'check-circle' : 'circle-outline'}
                      size={18}
                      color={item.done ? colors.success : colors.textOnNavyFaint}
                    />
                    <Text style={[styles.checklistLabel, item.done && styles.checklistLabelDone]}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : segment === 'insights' ? (
            <View>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <MaterialCommunityIcons name="eye-outline" size={16} color={colors.blue300} />
                  <Text style={styles.statValue}>{business.views || 0}</Text>
                  <Text style={styles.statLabel}>Abarebye</Text>
                </View>
                <View style={styles.statCard}>
                  <MaterialCommunityIcons name="inbox-outline" size={16} color={colors.blue300} />
                  <Text style={styles.statValue}>{bookings.length}</Text>
                  <Text style={styles.statLabel}>Ibyifuzo byose</Text>
                </View>
                <View style={styles.statCard}>
                  <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.success} />
                  <Text style={styles.statValue}>{stats.handledRateLabel}</Text>
                  <Text style={styles.statLabel}>Uko wasubije</Text>
                </View>
              </View>

              <View style={styles.responseCard}>
                <MaterialCommunityIcons name="clock-fast" size={15} color={colors.blue300} />
                <Text style={styles.responseText}>Igihe usanzwe usubiza: {stats.avgResponseLabel}</Text>
              </View>

              {conversionLabel ? (
                <View style={styles.responseCard}>
                  <MaterialCommunityIcons name="chart-line" size={15} color={colors.blue300} />
                  <Text style={styles.responseText}>
                    {conversionLabel} by'abarebye ubucuruzi bwawe basabye serivisi
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View>
              {sortedBookings.length ? (
                sortedBookings.map((booking) => (
                  <SellerRequestRow
                    key={booking.id}
                    booking={booking}
                    phone={business.phone}
                    onMarkHandled={handleMarkHandled}
                    onMarkNoResponse={handleMarkNoResponse}
                  />
                ))
              ) : (
                <EmptyState
                  tone="dark"
                  icon="inbox-outline"
                  title="Nta cyifuzo urahabwa"
                  message="Igihe umuntu azasaba iyi serivisi, bizagaragara hano."
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
              <AdminSidebar brandTitle={business.name} brandSubtitle="YOUR DASHBOARD" sections={sidebarSections} activeKey={segment} />
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
  emptyWrap: { flex: 1, justifyContent: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.white, letterSpacing: -0.3, marginHorizontal: spacing.md },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    padding: 3,
    marginBottom: spacing.lg,
  },
  segment: { flex: 1, height: 34, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: colors.blue500 },
  segmentLabel: { fontSize: 12, color: colors.textOnNavyFaint },
  segmentLabelActive: { color: colors.white, fontWeight: '600' },
  quickRow: { flexDirection: 'row', marginBottom: spacing.lg },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    height: 40,
    marginRight: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  quickActionLabel: { fontSize: 11.5, color: colors.textOnNavy, marginLeft: 4, textAlign: 'center' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  availableRow: { flexDirection: 'row', alignItems: 'center' },
  availableTitle: { ...typography.bodyStrong, color: colors.white },
  availableSubtitle: { ...typography.caption, color: colors.textOnNavyFaint, marginTop: 2 },
  statsRow: { flexDirection: 'row', marginBottom: spacing.md },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginRight: spacing.sm,
  },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.white, marginTop: 4 },
  statLabel: { fontSize: 10, color: colors.textOnNavyFaint, marginTop: 2, textAlign: 'center' },
  responseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(55,138,221,0.16)',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  responseText: { ...typography.caption, color: colors.blue300, marginLeft: spacing.xs, flexShrink: 1 },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.blue300,
    letterSpacing: 0.3,
    marginBottom: spacing.md,
  },
  checklistCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  checklistRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  checklistLabel: { ...typography.body, fontSize: 13, color: colors.textOnNavy, marginLeft: spacing.sm },
  checklistLabelDone: { color: colors.textOnNavyFaint, textDecorationLine: 'line-through' },
});
