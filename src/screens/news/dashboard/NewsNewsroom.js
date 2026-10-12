/**
 * NewsNewsroom.js — Newsroom overview tab.
 *
 * Shows KPI tiles (today's reads, published today, pending approval,
 * trending articles), an alert band for editorial issues (pending >4hrs,
 * stale breaking flags, live stories with no recent update), quick-action
 * shortcuts, and a trending-articles panel.
 */
import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing } from '../../../theme';
import {
  NEWS, KpiCard, AlertBanner, EmptyState, SectionHeader,
  ActionBtn, fmtNum, fmtDate, s,
} from './NewsShared';

function hoursAgo(dateStr) {
  if (!dateStr) return 0;
  return (Date.now() - new Date(dateStr).getTime()) / 3_600_000;
}

export default function NewsNewsroom({ ctx }) {
  const { articles = [], stories = [], setSegment, setShowNewArticle } = ctx;

  const today = new Date().toDateString();
  const publishedToday = articles.filter(a => a.status === 'published' && new Date(a.publishedAt).toDateString() === today).length;
  const pendingApproval = articles.filter(a => a.status === 'pending').length;
  const trending = articles.filter(a => a.isTrending && !a.isArchived);
  const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);

  // Alert conditions
  const stalePending = articles.filter(a => a.status === 'pending' && hoursAgo(a.publishedAt) > 4);
  const staleBreaking = articles.filter(a => a.isBreaking && !a.isArchived && hoursAgo(a.publishedAt) > 6);
  const liveStoriesNoUpdate = stories.filter(s => s.isLive).filter(st => {
    const storyArticles = articles.filter(a => a.storyId === st.id);
    const latest = storyArticles.reduce((m, a) => Math.max(m, new Date(a.publishedAt).getTime()), 0);
    return latest ? hoursAgo(new Date(latest)) > 3 : true;
  });

  const topArticles = useMemo(() =>
    [...articles]
      .filter(a => a.status === 'published')
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 8),
    [articles]
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* KPI tiles */}
      <SectionHeader title="Today's Overview" icon="newspaper-variant-outline" />
      <View style={s.kpiRow}>
        <KpiCard icon="eye-outline" label="Total Reads" value={fmtNum(totalViews)} color={NEWS.primary} bg={NEWS.primaryBg} />
        <KpiCard icon="check-circle-outline" label="Published Today" value={publishedToday} color={NEWS.success} bg={NEWS.successBg} />
        <KpiCard icon="clock-outline" label="Awaiting Approval" value={pendingApproval} color={NEWS.warning} bg={NEWS.warningBg} />
        <KpiCard icon="trending-up" label="Trending Now" value={trending.length} color={NEWS.purple} bg={NEWS.purpleBg} />
      </View>

      {/* Alert band */}
      {(stalePending.length > 0 || staleBreaking.length > 0 || liveStoriesNoUpdate.length > 0) && (
        <View style={{ marginBottom: spacing.lg }}>
          <SectionHeader title="Editorial Alerts" icon="alert-circle-outline" />
          {stalePending.length > 0 && (
            <AlertBanner
              icon="clock-alert-outline"
              text={`${stalePending.length} article${stalePending.length > 1 ? 's' : ''} pending approval for over 4 hours`}
              color={NEWS.warning}
            />
          )}
          {staleBreaking.length > 0 && (
            <AlertBanner
              icon="lightning-bolt"
              text={`${staleBreaking.length} breaking flag${staleBreaking.length > 1 ? 's' : ''} older than 6 hours — consider expiring`}
              color={NEWS.danger}
            />
          )}
          {liveStoriesNoUpdate.length > 0 && (
            <AlertBanner
              icon="update"
              text={`${liveStoriesNoUpdate.length} live stor${liveStoriesNoUpdate.length > 1 ? 'ies' : 'y'} with no update in 3+ hours`}
              color={NEWS.teal}
            />
          )}
        </View>
      )}

      {/* Quick actions */}
      <SectionHeader title="Quick Actions" icon="flash-outline" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}>
        <ActionBtn label="New Article" icon="plus" onPress={() => setShowNewArticle && setShowNewArticle(true)} color={NEWS.primary} />
        <ActionBtn label="View Pending" icon="clock-outline" onPress={() => setSegment('pending')} color={NEWS.warning} />
        <ActionBtn label="Categories" icon="tag-outline" onPress={() => setSegment('categories')} color={NEWS.teal} />
        <ActionBtn label="Live Stories" icon="broadcast" onPress={() => setSegment('stories')} color={NEWS.purple} />
        <ActionBtn label="Ad Ops" icon="bullhorn-outline" onPress={() => setSegment('ads')} color={NEWS.success} />
        <ActionBtn label="Analytics" icon="chart-line" onPress={() => setSegment('performance')} color={NEWS.muted} />
      </View>

      {/* Trending panel */}
      <SectionHeader title="Top Articles by Views" icon="fire" />
      {topArticles.length === 0 ? (
        <EmptyState icon="newspaper-outline" text="No published articles yet" />
      ) : (
        <View style={s.panel}>
          {topArticles.map((a, i) => (
            <View key={a.id} style={[s.row, i === topArticles.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: NEWS.border, width: 28 }}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle} numberOfLines={2}>{a.title}</Text>
                <Text style={s.rowMeta}>{a.category} · {fmtDate(a.publishedAt)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: NEWS.primary }}>{fmtNum(a.views)}</Text>
                <Text style={s.rowMeta}>views</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
