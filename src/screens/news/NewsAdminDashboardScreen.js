/**
 * NewsAdminDashboardScreen.js — Thin shell for the News Admin Dashboard.
 *
 * Owns navigation, sidebar, and the shared `ctx` object that every section
 * component receives. All section UIs live in ./dashboard/News*.js — this
 * file only switches between them. Follows the same pattern as
 * src/screens/admin/finance/FinanceDashboardScreen.js.
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, Pressable, ScrollView, Switch, useWindowDimensions, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import GradientBackground from '../../components/common/GradientBackground';
import AdminSidebar, { SIDEBAR_BREAKPOINT } from '../../components/admin/AdminSidebar';
import { useNews } from '../../context/NewsContext';
import { useAds }  from '../../context/AdsContext';
import { apiFetch } from '../../services/apiClient';
import { colors, spacing, radius, typography, gutter } from '../../theme';

import NewsNewsroom    from './dashboard/NewsNewsroom';
import NewsArticles    from './dashboard/NewsArticles';
import NewsCategories  from './dashboard/NewsCategories';
import NewsStories     from './dashboard/NewsStories';
import NewsAds         from './dashboard/NewsAds';
import NewsPerformance from './dashboard/NewsPerformance';
import NewsReports     from './dashboard/NewsReports';
import NewsSettings    from './dashboard/NewsSettings';
import NewsAuthors     from './dashboard/NewsAuthors';

const SEGMENTS = [
  { key: 'newsroom',     label: 'Newsroom',    icon: 'newspaper-variant-outline' },
  { key: 'articles',     label: 'Articles',    icon: 'file-document-multiple-outline' },
  { key: 'categories',   label: 'Categories',  icon: 'shape-outline' },
  { key: 'stories',      label: 'Stories',     icon: 'broadcast' },
  { key: 'ads',          label: 'Ad Ops',      icon: 'bullhorn-outline' },
  { key: 'authors',      label: 'Authors',     icon: 'account-multiple-outline' },
  { key: 'performance',  label: 'Analytics',   icon: 'chart-line' },
  { key: 'reports',      label: 'Reports',     icon: 'file-chart-outline' },
  { key: 'settings',     label: 'Settings',    icon: 'cog-outline' },
];

export default function NewsAdminDashboardScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= SIDEBAR_BREAKPOINT;
  const viaDirector = Boolean(route?.params?.viaDirector);

  const {
    articles, categories, stories,
    deleteArticle, updateArticle, approveArticle, rejectArticle,
    archiveArticles, unarchiveArticle,
    addCategory, updateCategory, deleteCategory,
    addStory, updateStory, deleteStory,
    showViewCounts, updateViewCountSetting,
  } = useNews();
  const { ads, deleteAd } = useAds();

  const [segment, setSegment] = useState(route?.params?.segment || 'newsroom');
  const [sidebarOpen, setSidebarOpen] = useState(isWide);
  const [authors, setAuthors] = useState([]);

  async function loadAuthors() {
    try { setAuthors(await apiFetch('/news/authors')); } catch {}
  }
  useEffect(() => { loadAuthors(); }, []);

  const handleExit = useCallback(() => navigation.goBack(), [navigation]);

  const stats = useMemo(() => {
    const published = articles.filter(a => a.status === 'published' && !a.isArchived).length;
    const drafts    = articles.filter(a => a.status === 'draft').length;
    const pending   = articles.filter(a => a.status === 'pending').length;
    const archived  = articles.filter(a => a.isArchived).length;
    return { total: articles.length, published, drafts, pending, archived };
  }, [articles]);

  const selectSegment = useCallback(key => {
    setSegment(key);
    if (!isWide) setSidebarOpen(false);
  }, [isWide]);

  const sidebarSections = useMemo(() => [
    {
      label: 'DASHBOARD',
      items: SEGMENTS.map(seg => ({
        key: seg.key,
        label: seg.label,
        icon: seg.icon,
        badge: seg.key === 'pending' ? (stats.pending || null)
             : seg.key === 'stories' ? (stories.length || null)
             : seg.key === 'ads'     ? (ads.length || null)
             : null,
        onPress: () => selectSegment(seg.key),
      })),
    },
    {
      label: 'ACTIONS',
      items: [
        { key: 'new',  label: 'New Article', icon: 'plus-circle-outline', onPress: () => navigation.navigate('NewsAdminEditor') },
        { key: 'newAd',label: 'New Ad',      icon: 'bullhorn-outline',    onPress: () => navigation.navigate('AdEditor') },
        { key: 'exit', label: viaDirector ? 'Back to Director' : 'Exit Admin', icon: viaDirector ? 'arrow-left' : 'exit-to-app', onPress: handleExit },
      ],
    },
  ], [stats, stories.length, ads.length, selectSegment, navigation, viaDirector, handleExit]);

  // The `ctx` object passed to every section component.
  const ctx = useMemo(() => ({
    articles, categories, stories, ads, authors,
    deleteArticle, updateArticle, approveArticle, rejectArticle,
    archiveArticles, unarchiveArticle,
    addCategory, updateCategory, deleteCategory,
    addStory, updateStory, deleteStory,
    deleteAd,
    showViewCounts, updateViewCountSetting,
    reloadAuthors: loadAuthors,
    setSegment: selectSegment,
    navigation,
  }), [
    articles, categories, stories, ads, authors,
    deleteArticle, updateArticle, approveArticle, rejectArticle,
    archiveArticles, unarchiveArticle,
    addCategory, updateCategory, deleteCategory,
    addStory, updateStory, deleteStory,
    deleteAd, showViewCounts, updateViewCountSetting, selectSegment, navigation,
  ]);

  function renderContent() {
    switch (segment) {
      case 'newsroom':    return <NewsNewsroom   ctx={ctx} />;
      case 'articles':    return <NewsArticles   ctx={ctx} />;
      case 'categories':  return <NewsCategories ctx={ctx} />;
      case 'stories':     return <NewsStories    ctx={ctx} />;
      case 'ads':         return <NewsAds        ctx={ctx} />;
      case 'authors':     return <NewsAuthors    ctx={ctx} />;
      case 'performance': return <NewsPerformance ctx={ctx} />;
      case 'reports':     return <NewsReports    ctx={ctx} />;
      case 'settings':    return <NewsSettings   ctx={ctx} />;
      default:            return <NewsNewsroom   ctx={ctx} />;
    }
  }

  return (
    <GradientBackground>
      <View style={styles.body}>
        {isWide && sidebarOpen && (
          <AdminSidebar brandSubtitle="ADMIN · NEWS" sections={sidebarSections} activeKey={segment} />
        )}

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: spacing.huge }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar */}
          <View style={styles.topBar}>
            <Pressable onPress={handleExit} hitSlop={10} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textOnNavy} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>News Dashboard</Text>
              <Text style={styles.subtitle}>
                {SEGMENTS.find(s => s.key === segment)?.label || 'Newsroom'}
              </Text>
            </View>
            <Pressable onPress={() => setSidebarOpen(v => !v)} hitSlop={10} style={[styles.backBtn, { marginLeft: spacing.md }]}>
              <MaterialCommunityIcons name={sidebarOpen ? 'menu-open' : 'menu'} size={20} color={colors.textOnNavy} />
            </Pressable>
          </View>

          {/* Horizontal segment tab bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {SEGMENTS.map(seg => {
                const active = segment === seg.key;
                return (
                  <Pressable
                    key={seg.key}
                    onPress={() => selectSegment(seg.key)}
                    style={[styles.tab, active && styles.tabActive]}
                  >
                    <MaterialCommunityIcons name={seg.icon} size={14} color={active ? colors.white : colors.textOnNavyFaint} />
                    <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{seg.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Section content */}
          {renderContent()}
        </ScrollView>

        {/* Phone overlay drawer */}
        {!isWide && sidebarOpen && (
          <View style={StyleSheet.absoluteFill}>
            <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]} onPress={() => setSidebarOpen(false)} />
            <View style={styles.drawer}>
              <AdminSidebar brandSubtitle="ADMIN · NEWS" sections={sidebarSections} activeKey={segment} />
            </View>
          </View>
        )}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  body:  { flex: 1, flexDirection: 'row' },
  flex:  { flex: 1 },
  content: { paddingHorizontal: gutter },
  topBar:  { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  backBtn: {
    width: 38, height: 38, borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  title:    { fontSize: 20, fontWeight: '700', color: colors.white, letterSpacing: -0.3 },
  subtitle: { ...typography.caption, color: colors.textOnNavyFaint, marginTop: 2 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabActive:      { backgroundColor: colors.blue500 },
  tabLabel:       { fontSize: 12, color: colors.textOnNavyFaint },
  tabLabelActive: { color: colors.white, fontWeight: '600' },
  drawer: { position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 1 },
});
