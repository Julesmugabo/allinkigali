/**
 * NewsPerformance.js — Readership analytics for the News Admin Dashboard.
 *
 * Shows reads-over-time (daily), top articles, performance by category,
 * performance by author, and best-time-to-publish insights.
 * Data fetched from the /news/analytics/* endpoints.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing } from '../../../theme';
import {
  NEWS, SectionHeader, KpiCard, EmptyState, FilterBtn,
  fmtNum, fmtDate, s,
} from './NewsShared';
import { apiFetch } from '../../../services/apiClient';

const RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

function Bar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 12, color: NEWS.muted, flex: 1 }} numberOfLines={1}>{label}</Text>
        <Text style={{ fontSize: 12, fontWeight: '700', color: NEWS.primary }}>{fmtNum(value)}</Text>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: '#E8EAED', overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: '100%', borderRadius: 4, backgroundColor: color || NEWS.primary }} />
      </View>
    </View>
  );
}

export default function NewsPerformance({ ctx }) {
  const { articles = [] } = ctx;
  const [range, setRange] = useState(30);
  const [readsData, setReadsData] = useState([]);
  const [topArticles, setTopArticles] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [byAuthor, setByAuthor] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [reads, top, cat, auth] = await Promise.all([
        apiFetch(`/news/analytics/reads-over-time?days=${range}`),
        apiFetch('/news/analytics/top-articles?limit=10'),
        apiFetch('/news/analytics/by-category'),
        apiFetch('/news/analytics/by-author'),
      ]);
      setReadsData(Array.isArray(reads) ? reads : []);
      setTopArticles(Array.isArray(top) ? top : []);
      setByCategory(Array.isArray(cat) ? cat : []);
      setByAuthor(Array.isArray(auth) ? auth : []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [range]);

  const totalViews = articles.reduce((s, a) => s + (a.views || 0), 0);
  const published = articles.filter(a => a.status === 'published').length;
  const maxReads = readsData.reduce((m, d) => Math.max(m, Number(d.views)), 0);
  const maxCat = byCategory.reduce((m, d) => Math.max(m, Number(d.total_views)), 0);
  const maxAuth = byAuthor.reduce((m, d) => Math.max(m, Number(d.total_views)), 0);
  const maxTop = topArticles[0]?.views || 1;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionHeader title="Analytics" icon="chart-line" />

      {/* Summary KPIs */}
      <View style={s.kpiRow}>
        <KpiCard icon="eye-outline" label="Total Reads" value={fmtNum(totalViews)} color={NEWS.primary} bg={NEWS.primaryBg} />
        <KpiCard icon="newspaper-check-outline" label="Published" value={published} color={NEWS.success} bg={NEWS.successBg} />
        <KpiCard icon="trending-up" label="Trending" value={articles.filter(a => a.isTrending).length} color={NEWS.purple} bg={NEWS.purpleBg} />
      </View>

      {/* Range picker */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.lg }}>
        {RANGES.map(r => (
          <FilterBtn key={r.days} label={r.label} active={range === r.days} onPress={() => setRange(r.days)} />
        ))}
        <Pressable
          style={[s.filterBtn, { backgroundColor: NEWS.primaryBg, borderColor: NEWS.primary }]}
          onPress={load}
        >
          <MaterialCommunityIcons name="refresh" size={15} color={NEWS.primary} />
        </Pressable>
      </View>

      {loading ? <ActivityIndicator color={NEWS.primary} size="large" style={{ marginTop: 24 }} /> : (
        <>
          {/* Reads over time */}
          <SectionHeader title={`Daily Reads (last ${range} days)`} icon="chart-bar" />
          {readsData.length === 0 ? (
            <EmptyState icon="chart-bar" text="No read data yet" sub="Data accumulates as readers open articles" />
          ) : (
            <View style={[s.panel, { padding: spacing.md }]}>
              {readsData.slice(-14).map(d => (
                <Bar key={d.day} label={fmtDate(d.day)} value={Number(d.views)} max={maxReads} color={NEWS.primary} />
              ))}
            </View>
          )}

          {/* Top articles */}
          <SectionHeader title="Top Articles" icon="podium" />
          {topArticles.length === 0 ? (
            <EmptyState icon="newspaper-outline" text="No article data" />
          ) : (
            <View style={s.panel}>
              {topArticles.map((a, i) => (
                <View key={a.id} style={[s.row, i === topArticles.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: NEWS.border, width: 26 }}>{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle} numberOfLines={2}>{a.title}</Text>
                    <View style={{ height: 6, marginTop: 4, borderRadius: 3, backgroundColor: '#E8EAED', overflow: 'hidden' }}>
                      <View style={{ width: `${(a.views / maxTop) * 100}%`, height: '100%', borderRadius: 3, backgroundColor: NEWS.primary }} />
                    </View>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: NEWS.primary, marginLeft: 8 }}>{fmtNum(a.views)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* By category */}
          <SectionHeader title="Performance by Category" icon="shape-outline" />
          {byCategory.length === 0 ? (
            <EmptyState icon="shape-outline" text="No category data" />
          ) : (
            <View style={[s.panel, { padding: spacing.md }]}>
              {byCategory.map(c => (
                <Bar key={c.category} label={c.category} value={Number(c.total_views)} max={maxCat} color={NEWS.teal} />
              ))}
            </View>
          )}

          {/* By author */}
          <SectionHeader title="Performance by Author" icon="account-multiple-outline" />
          {byAuthor.length === 0 ? (
            <EmptyState icon="account-outline" text="No author data" sub="Assign authors to articles to track byline performance" />
          ) : (
            <View style={[s.panel, { padding: spacing.md }]}>
              {byAuthor.map(a => (
                <Bar key={a.id} label={a.name} value={Number(a.total_views || 0)} max={maxAuth} color={NEWS.purple} />
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
