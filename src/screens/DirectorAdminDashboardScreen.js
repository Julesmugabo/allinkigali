/**
 * DirectorAdminDashboardScreen.js — Ubuyobozi bukuru (Managing Director dashboard).
 *
 * Same sidebar/segment/toggle shell as the News and Sales Partners
 * dashboards (copy the responsive sidebar code from one of those if this
 * needs touching again). Unlike those two, this one doesn't manage anything
 * itself — it's a platform-wide read-only view stitched together from
 * BusinessContext/BookingContext/NewsContext, plus a fast way to jump into
 * either of the two working dashboards ("MANAGE" sidebar section, and the
 * quick-access cards on Overview) without leaving Admin or re-entering the
 * password gate.
 *
 * Every number here is real and computed live from in-memory state. There
 * are deliberately no growth percentages, trend arrows, or revenue/financial
 * figures — nothing in this app tracks history over time yet, and there is
 * no payment data anywhere in the platform, so anything like that would be
 * fabricated. "Counted this session" is as far as any of this goes.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import EmptyState from '../components/common/EmptyState';
import AdminStatCard from '../components/admin/AdminStatCard';
import AdminSidebar, { SIDEBAR_BREAKPOINT } from '../components/admin/AdminSidebar';

import { useBusinesses } from '../context/BusinessContext';
import { useBookings } from '../context/BookingContext';
import { useNews } from '../context/NewsContext';
import { setToken } from '../services/apiClient';
import { getCategoryCounts } from '../services/businessSearch';
import { colors, typography, spacing, radius, gutter, shadows } from '../theme';

const SEGMENTS = [
  { key: 'overview', label: 'Overview' },
  { key: 'sellers', label: 'Sellers' },
  { key: 'news', label: 'News' },
];

// Sellers type this field in free text on their own registration form (see
// SalesPartnerScreen) — there's no real geocoding behind it, so this is a
// best-effort read of what they actually wrote, not a map. A platform-wide
// seller ("Kigali yose") gets its own bucket instead of being force-fit into
// a neighborhood it didn't name.
function deriveArea(location) {
  if (!location) return 'Ntacyanditswe';
  const cleaned = location.split(/[—-]/)[0].trim();
  if (/kigali yose/i.test(cleaned)) return 'Kigali yose (byose)';
  return cleaned.split(',')[0].trim() || cleaned;
}

export default function DirectorAdminDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= SIDEBAR_BREAKPOINT;

  const { businesses } = useBusinesses();
  const { bookings } = useBookings();
  const { articles, categories: newsCategories, refreshArticles } = useNews();

  const [segment, setSegment] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(isWide);

  const sellerStats = useMemo(() => {
    const verified = businesses.filter((b) => b.verified).length;
    const totalViews = businesses.reduce((sum, b) => sum + (b.views || 0), 0);
    const zeroViews = businesses.filter((b) => !b.views).length;
    const newRequests = bookings.filter((b) => b.status === 'new').length;
    return {
      total: businesses.length,
      verified,
      pending: businesses.length - verified,
      totalViews,
      zeroViews,
      totalRequests: bookings.length,
      newRequests,
    };
  }, [businesses, bookings]);

  const newsStats = useMemo(() => {
    const published = articles.filter((a) => a.status === 'published' && !a.isArchived).length;
    const pending = articles.filter((a) => a.status === 'pending').length;
    const drafts = articles.filter((a) => a.status === 'draft').length;
    const archived = articles.filter((a) => a.isArchived).length;
    const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);
    return { total: articles.length, published, pending, drafts, archived, totalViews };
  }, [articles]);

  const categoryCounts = useMemo(() => getCategoryCounts(businesses), [businesses]);

  const areaCounts = useMemo(() => {
    const counts = new Map();
    businesses.forEach((b) => {
      const area = deriveArea(b.location);
      counts.set(area, (counts.get(area) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count);
  }, [businesses]);

  const topSellersByViews = useMemo(
    () => [...businesses].filter((b) => b.views).sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5),
    [businesses]
  );

  const requestCountByBusiness = useMemo(() => {
    const counts = new Map();
    bookings.forEach((b) => counts.set(b.businessId, (counts.get(b.businessId) || 0) + 1));
    return counts;
  }, [bookings]);

  const topSellersByRequests = useMemo(
    () =>
      businesses
        .map((b) => ({ ...b, requestCount: requestCountByBusiness.get(b.id) || 0 }))
        .filter((b) => b.requestCount)
        .sort((a, b) => b.requestCount - a.requestCount)
        .slice(0, 5),
    [businesses, requestCountByBusiness]
  );

  const newsCategoryCounts = useMemo(() => {
    const counts = new Map();
    articles.forEach((a) => {
      if (!a.category) return;
      counts.set(a.category, (counts.get(a.category) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([key, count]) => ({
        key,
        count,
        label: newsCategories.find((c) => c.key === key)?.label || key,
      }))
      .sort((a, b) => b.count - a.count);
  }, [articles, newsCategories]);

  const topArticlesByViews = useMemo(
    () => [...articles].filter((a) => a.views).sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5),
    [articles]
  );

  const openNews = useCallback(
    (extra) => navigation.navigate('NewsAdminDashboard', { viaDirector: true, ...extra }),
    [navigation]
  );
  const openSellers = useCallback(
    (extra) => navigation.navigate('SellersAdminDashboard', { viaDirector: true, ...extra }),
    [navigation]
  );

  // The top of the admin hierarchy — exiting here always ends the real
  // session (unlike News/Sellers, which only sign out if they weren't
  // reached via this screen), so someone else on the device can't reopen
  // the dashboard without signing in again.
  const handleExit = useCallback(async () => {
    await setToken(null);
    await refreshArticles(); // scope shrinks back to public-only now
    navigation.navigate('Main');
  }, [navigation, refreshArticles]);

  const attentionItems = useMemo(() => {
    const items = [];
    if (sellerStats.pending) {
      items.push({
        key: 'pendingSellers',
        icon: 'account-clock-outline',
        label: `${sellerStats.pending} seller${sellerStats.pending === 1 ? '' : 's'} waiting for approval`,
        onPress: () => openSellers({ segment: 'pending' }),
      });
    }
    if (newsStats.pending) {
      items.push({
        key: 'pendingNews',
        icon: 'clock-outline',
        label: `${newsStats.pending} article${newsStats.pending === 1 ? '' : 's'} waiting for approval`,
        onPress: () => openNews({ segment: 'pending' }),
      });
    }
    if (sellerStats.newRequests) {
      items.push({
        key: 'newRequests',
        icon: 'inbox-arrow-down-outline',
        label: `${sellerStats.newRequests} customer request${sellerStats.newRequests === 1 ? '' : 's'} not yet responded to`,
        onPress: () => openSellers({ segment: 'requests' }),
      });
    }
    if (sellerStats.zeroViews) {
      items.push({
        key: 'zeroViews',
        icon: 'eye-off-outline',
        label: `${sellerStats.zeroViews} seller${sellerStats.zeroViews === 1 ? '' : 's'} with no profile views yet`,
        onPress: () => openSellers({ segment: 'all' }),
      });
    }
    return items;
  }, [sellerStats, newsStats, openSellers, openNews]);

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
          { key: 'overview', label: 'Overview', icon: 'view-dashboard-outline', onPress: () => selectSegment('overview') },
          { key: 'sellers', label: 'Sellers', icon: 'store-outline', onPress: () => selectSegment('sellers') },
          { key: 'news', label: 'News', icon: 'newspaper-variant-outline', onPress: () => selectSegment('news') },
        ],
      },
      {
        label: 'MANAGE',
        items: [
          { key: 'openNews', label: 'News Dashboard', icon: 'newspaper-variant-outline', onPress: () => openNews() },
          { key: 'openSellers', label: 'Sales Partners Dashboard', icon: 'storefront-outline', onPress: () => openSellers() },
        ],
      },
      {
        label: 'ACTIONS',
        items: [{ key: 'exit', label: 'Exit Admin', icon: 'exit-to-app', onPress: handleExit }],
      },
    ],
    [selectSegment, openNews, openSellers, handleExit]
  );

  return (
    <GradientBackground>
      <View style={styles.body}>
        {isWide && sidebarOpen ? (
          <AdminSidebar brandSubtitle="ADMIN · DIRECTOR" sections={sidebarSections} activeKey={segment} />
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
            <View style={styles.titleWrap}>
              <Text style={styles.title}>Director Dashboard</Text>
              <Text style={styles.subtitle}>Platform-wide view across sellers and news</Text>
            </View>
            <Pressable
              onPress={handleExit}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Exit admin"
              style={styles.backButton}
            >
              <MaterialCommunityIcons name="exit-to-app" size={20} color={colors.textOnNavy} />
            </Pressable>
          </View>

          <View style={styles.segmentRow}>
            {SEGMENTS.map((option) => {
              const active = segment === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => selectSegment(option.key)}
                  accessibilityRole="button"
                  style={[styles.segment, active && styles.segmentActive]}
                >
                  <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]} numberOfLines={1}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {segment === 'overview' ? (
            <View>
              <View style={styles.statsRow}>
                <AdminStatCard icon="store-outline" value={sellerStats.total} label="Total sellers" style={styles.statSpacing} />
                <AdminStatCard icon="check-decagram-outline" value={sellerStats.verified} label="Verified sellers" tint={colors.success} style={styles.statSpacing} />
              </View>
              <View style={styles.statsRow}>
                <AdminStatCard icon="inbox-outline" value={sellerStats.totalRequests} label="Total requests" tint={colors.blue500} style={styles.statSpacing} />
                <AdminStatCard icon="newspaper-variant-outline" value={newsStats.total} label="Total articles" style={styles.statSpacing} />
              </View>
              <View style={styles.statsRow}>
                <AdminStatCard icon="check-circle-outline" value={newsStats.published} label="Published articles" tint={colors.success} style={styles.statSpacing} />
                <AdminStatCard icon="clock-outline" value={sellerStats.pending + newsStats.pending} label="Awaiting approval" tint={colors.warning} style={styles.statSpacing} />
              </View>

              <View style={styles.viewsCard}>
                <MaterialCommunityIcons name="eye-outline" size={16} color={colors.blue300} />
                <Text style={styles.viewsText}>
                  {sellerStats.totalViews} seller profile view{sellerStats.totalViews === 1 ? '' : 's'} · {newsStats.totalViews}{' '}
                  article read{newsStats.totalViews === 1 ? '' : 's'} counted this session
                </Text>
              </View>

              <Text style={styles.sectionTitle}>Needs attention</Text>
              {attentionItems.length ? (
                attentionItems.map((item) => (
                  <Pressable key={item.key} onPress={item.onPress} accessibilityRole="button" style={styles.attentionRow}>
                    <View style={styles.attentionIconWell}>
                      <MaterialCommunityIcons name={item.icon} size={16} color={colors.warning} />
                    </View>
                    <Text style={styles.attentionLabel}>{item.label}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textOnNavyFaint} />
                  </Pressable>
                ))
              ) : (
                <EmptyState tone="dark" icon="check-all" title="All caught up" message="Nothing across sellers or news needs attention right now." />
              )}

              <Text style={styles.sectionTitle}>Open a dashboard</Text>
              <Pressable onPress={() => openNews()} accessibilityRole="button" style={styles.quickCard}>
                <View style={styles.quickIconWell}>
                  <MaterialCommunityIcons name="newspaper-variant-outline" size={20} color={colors.blue300} />
                </View>
                <View style={styles.quickBody}>
                  <Text style={styles.quickTitle}>News Dashboard</Text>
                  <Text style={styles.quickMeta}>
                    {newsStats.pending ? `${newsStats.pending} pending approval` : 'All caught up'}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textOnNavyFaint} />
              </Pressable>
              <Pressable onPress={() => openSellers()} accessibilityRole="button" style={styles.quickCard}>
                <View style={styles.quickIconWell}>
                  <MaterialCommunityIcons name="storefront-outline" size={20} color={colors.blue300} />
                </View>
                <View style={styles.quickBody}>
                  <Text style={styles.quickTitle}>Sales Partners Dashboard</Text>
                  <Text style={styles.quickMeta}>
                    {sellerStats.pending ? `${sellerStats.pending} pending approval` : 'All caught up'}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textOnNavyFaint} />
              </Pressable>
            </View>
          ) : segment === 'sellers' ? (
            <View>
              <View style={styles.statsRow}>
                <AdminStatCard icon="store-outline" value={sellerStats.total} label="Total sellers" style={styles.statSpacing} />
                <AdminStatCard icon="account-clock-outline" value={sellerStats.pending} label="Pending approval" tint={colors.warning} style={styles.statSpacing} />
              </View>
              <View style={styles.statsRow}>
                <AdminStatCard icon="eye-outline" value={sellerStats.totalViews} label="Total profile views" tint={colors.blue500} style={styles.statSpacing} />
                <AdminStatCard icon="eye-off-outline" value={sellerStats.zeroViews} label="Sellers with 0 views" tint={colors.danger} style={styles.statSpacing} />
              </View>

              <Text style={styles.sectionTitle}>What sellers are registering under</Text>
              {categoryCounts.length ? (
                categoryCounts.map((c) => (
                  <View key={c.category} style={styles.listRow}>
                    <Text style={styles.listRowLabel}>{c.label}</Text>
                    <Text style={styles.listRowValue}>
                      {c.count} {c.count === 1 ? 'seller' : 'sellers'}
                      {!c.isPreset ? ' · custom' : ''}
                    </Text>
                  </View>
                ))
              ) : (
                <EmptyState tone="dark" icon="shape-outline" title="No sellers yet" />
              )}

              <Text style={styles.sectionTitle}>Where sellers say they are</Text>
              <Text style={styles.sectionNote}>
                Read straight from each seller's own "location" text — not real geocoding, just what they typed.
              </Text>
              {areaCounts.length ? (
                areaCounts.map((a) => (
                  <View key={a.area} style={styles.listRow}>
                    <Text style={styles.listRowLabel}>{a.area}</Text>
                    <Text style={styles.listRowValue}>
                      {a.count} {a.count === 1 ? 'seller' : 'sellers'}
                    </Text>
                  </View>
                ))
              ) : (
                <EmptyState tone="dark" icon="map-marker-outline" title="No sellers yet" />
              )}

              <Text style={styles.sectionTitle}>Top sellers by profile views</Text>
              {topSellersByViews.length ? (
                topSellersByViews.map((b, index) => (
                  <View key={b.id} style={styles.listRow}>
                    <Text style={styles.listRowLabel}>
                      {index + 1}. {b.name}
                    </Text>
                    <Text style={styles.listRowValue}>{b.views} views</Text>
                  </View>
                ))
              ) : (
                <EmptyState tone="dark" icon="eye-outline" title="No profile views yet" message="Views are counted from real customer taps in Shop search — nothing here yet this session." />
              )}

              <Text style={styles.sectionTitle}>Top sellers by requests</Text>
              {topSellersByRequests.length ? (
                topSellersByRequests.map((b, index) => (
                  <View key={b.id} style={styles.listRow}>
                    <Text style={styles.listRowLabel}>
                      {index + 1}. {b.name}
                    </Text>
                    <Text style={styles.listRowValue}>
                      {b.requestCount} {b.requestCount === 1 ? 'request' : 'requests'}
                    </Text>
                  </View>
                ))
              ) : (
                <EmptyState tone="dark" icon="inbox-outline" title="No requests yet" />
              )}
            </View>
          ) : (
            <View>
              <View style={styles.statsRow}>
                <AdminStatCard icon="newspaper-variant-outline" value={newsStats.total} label="Total articles" style={styles.statSpacing} />
                <AdminStatCard icon="check-circle-outline" value={newsStats.published} label="Published" tint={colors.success} style={styles.statSpacing} />
              </View>
              <View style={styles.statsRow}>
                <AdminStatCard icon="clock-outline" value={newsStats.pending} label="Pending approval" tint={colors.warning} style={styles.statSpacing} />
                <AdminStatCard icon="eye-outline" value={newsStats.totalViews} label="Total reads" tint={colors.blue500} style={styles.statSpacing} />
              </View>

              <Text style={styles.sectionTitle}>Articles by category</Text>
              {newsCategoryCounts.length ? (
                newsCategoryCounts.map((c) => (
                  <View key={c.key} style={styles.listRow}>
                    <Text style={styles.listRowLabel}>{c.label}</Text>
                    <Text style={styles.listRowValue}>
                      {c.count} {c.count === 1 ? 'article' : 'articles'}
                    </Text>
                  </View>
                ))
              ) : (
                <EmptyState tone="dark" icon="shape-outline" title="No articles yet" />
              )}

              <Text style={styles.sectionTitle}>Top articles by reads</Text>
              {topArticlesByViews.length ? (
                topArticlesByViews.map((a, index) => (
                  <View key={a.id} style={styles.listRow}>
                    <Text style={styles.listRowLabel} numberOfLines={1}>
                      {index + 1}. {a.title}
                    </Text>
                    <Text style={styles.listRowValue}>{a.views} reads</Text>
                  </View>
                ))
              ) : (
                <EmptyState tone="dark" icon="eye-outline" title="No reads yet" message="Reads are counted from real taps in the News tab — nothing here yet this session." />
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
              <AdminSidebar brandSubtitle="ADMIN · DIRECTOR" sections={sidebarSections} activeKey={segment} />
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
  statsRow: { flexDirection: 'row', marginBottom: spacing.md },
  statSpacing: { marginRight: spacing.md },
  viewsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(55,138,221,0.16)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  viewsText: { ...typography.caption, color: colors.blue300, marginLeft: spacing.sm, flexShrink: 1 },
  sectionTitle: { ...typography.bodyStrong, fontSize: 14, color: colors.white, marginTop: spacing.md, marginBottom: spacing.sm },
  sectionNote: { ...typography.caption, color: colors.textOnNavyFaint, marginBottom: spacing.md, lineHeight: 16 },
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(186,117,23,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(186,117,23,0.3)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  attentionIconWell: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(186,117,23,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  attentionLabel: { flex: 1, ...typography.body, fontSize: 13, color: colors.textOnNavy },
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  quickIconWell: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(133,183,235,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  quickBody: { flex: 1 },
  quickTitle: { ...typography.bodyStrong, fontSize: 13.5, color: colors.white },
  quickMeta: { ...typography.caption, color: colors.textOnNavyFaint, marginTop: 2 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  listRowLabel: { flex: 1, ...typography.bodyStrong, fontSize: 13, color: colors.white, marginRight: spacing.sm },
  listRowValue: { ...typography.caption, color: colors.textOnNavyFaint },
});
