/**
 * NewsAdminDashboardScreen.js — Ubuyobozi bw'amakuru (News admin dashboard).
 *
 * Adapted from the desktop CMS mockups: the stat cards stay, the wide table
 * becomes cards, and the sidebar sections also exist as three segments
 * (All Articles / Pending Approval / Categories) under one set of stats —
 * that fallback keeps the dashboard fully usable with the sidebar closed,
 * on any screen size. The sidebar itself is a toggle (the menu button in the
 * top bar), open by default on desktop-width screens, closed on a phone.
 *
 * Every number here is real — counted from NewsContext. There are no growth
 * percentages or reader charts because nothing tracks history yet; views are
 * counted only from actual taps in the News tab from this session onward.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, useWindowDimensions, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import TextField from '../components/common/TextField';
import PrimaryButton from '../components/common/PrimaryButton';
import EmptyState from '../components/common/EmptyState';
import AdminStatCard from '../components/admin/AdminStatCard';
import AdminArticleRow from '../components/admin/AdminArticleRow';
import AdminSidebar, { SIDEBAR_BREAKPOINT } from '../components/admin/AdminSidebar';

import { useNews } from '../context/NewsContext';
import { useAds } from '../context/AdsContext';
import { setToken } from '../services/apiClient';
import { normalise } from '../utils/format';
import { colors, typography, spacing, radius, gutter, shadows } from '../theme';

const SEGMENTS = [
  { key: 'all', label: 'All Articles' },
  { key: 'pending', label: 'Pending' },
  { key: 'archived', label: 'Archived' },
  { key: 'categories', label: 'Categories' },
  { key: 'stories', label: 'Stories' },
  { key: 'ads', label: 'Ads' },
];

export default function NewsAdminDashboardScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= SIDEBAR_BREAKPOINT;
  // Opened from the Director dashboard rather than the password gate — exit
  // should return there instead of leaving Admin entirely (same viaAdmin
  // pattern already used for BusinessDetail/SellerDashboard).
  const viaDirector = Boolean(route?.params?.viaDirector);
  const exitTarget = viaDirector ? 'DirectorAdminDashboard' : 'Main';

  const {
    articles,
    categories,
    stories,
    deleteArticle,
    approveArticle,
    rejectArticle,
    archiveArticles,
    unarchiveArticle,
    addCategory,
    updateCategory,
    deleteCategory,
    refreshArticles,
    addStory,
    updateStory,
    deleteStory,
  } = useNews();
  const { ads, deleteAd } = useAds();

  // Only a real exit (not "back to Director") ends the actual session —
  // going back up to Director just navigates, since that admin is still
  // signed in and hasn't asked to leave the admin area at all.
  const handleExit = useCallback(async () => {
    if (!viaDirector) {
      await setToken(null);
      await refreshArticles(); // scope shrinks back to public-only now
    }
    navigation.navigate(exitTarget);
  }, [viaDirector, exitTarget, navigation, refreshArticles]);

  const [segment, setSegment] = useState(route?.params?.segment || 'all');
  const [search, setSearch] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [renamingKey, setRenamingKey] = useState(null);
  const [renameText, setRenameText] = useState('');
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [sortByViews, setSortByViews] = useState(false);
  // Open by default on a desktop-width screen, closed on a phone — but
  // always a toggle, on either size, via the menu button in the top bar.
  const [sidebarOpen, setSidebarOpen] = useState(isWide);
  // Multi-select, for "pick a few and archive them, leave the rest alone" —
  // archiving is bulk on purpose since that's exactly how it'll be used day
  // to day (clear out yesterday's news, keep what's still relevant).
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const stats = useMemo(() => {
    const published = articles.filter((a) => a.status === 'published' && !a.isArchived).length;
    const drafts = articles.filter((a) => a.status === 'draft').length;
    const pending = articles.filter((a) => a.status === 'pending').length;
    const archived = articles.filter((a) => a.isArchived).length;
    const views = articles.reduce((sum, a) => sum + (a.views || 0), 0);
    return { total: articles.length, published, drafts, pending, archived, views };
  }, [articles]);

  const categoryLabelFor = useCallback(
    (key) => categories.find((c) => c.key === key)?.label || key,
    [categories]
  );

  const visibleArticles = useMemo(() => {
    const q = normalise(search);
    let base;
    if (segment === 'pending') base = articles.filter((a) => a.status === 'pending' && !a.isArchived);
    else if (segment === 'archived') base = articles.filter((a) => a.isArchived);
    else base = articles.filter((a) => !a.isArchived);
    if (q) {
      base = base.filter((a) =>
        normalise([a.title, a.source, categoryLabelFor(a.category)].join(' ')).includes(q)
      );
    }
    return sortByViews ? [...base].sort((a, b) => (b.views || 0) - (a.views || 0)) : base;
  }, [articles, segment, search, categoryLabelFor, sortByViews]);

  const toggleSelectMode = useCallback(() => {
    setSelectMode((v) => !v);
    setSelectedIds(new Set());
  }, []);

  const toggleSelected = useCallback((id) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleArchiveSelected = useCallback(() => {
    if (!selectedIds.size) return;
    archiveArticles(Array.from(selectedIds));
    setSelectedIds(new Set());
    setSelectMode(false);
  }, [selectedIds, archiveArticles]);

  // One pass over articles to count-by-category, instead of re-scanning the
  // full articles list once per category.
  const categoryCounts = useMemo(() => {
    const counts = new Map();
    articles.forEach((a) => counts.set(a.category, (counts.get(a.category) || 0) + 1));
    return categories.map((c) => ({ ...c, count: counts.get(c.key) || 0 }));
  }, [categories, articles]);

  const selectSegment = useCallback(
    (key) => {
      setSegment(key);
      setSelectMode(false);
      setSelectedIds(new Set());
      // On a phone the sidebar is a drawer over the content, so picking
      // something closes it; on desktop it stays open as a fixed panel.
      if (!isWide) setSidebarOpen(false);
    },
    [isWide]
  );

  const sidebarSections = useMemo(
    () => [
      {
        label: 'DASHBOARD',
        items: [
          { key: 'all', label: 'All Articles', icon: 'file-document-multiple-outline', onPress: () => selectSegment('all') },
          {
            key: 'pending',
            label: 'Pending Approval',
            icon: 'clock-outline',
            badge: stats.pending || null,
            onPress: () => selectSegment('pending'),
          },
          {
            key: 'archived',
            label: 'Archived',
            icon: 'archive-outline',
            badge: stats.archived || null,
            onPress: () => selectSegment('archived'),
          },
          { key: 'categories', label: 'Categories', icon: 'shape-outline', onPress: () => selectSegment('categories') },
          { key: 'stories', label: 'Stories', icon: 'update', badge: stories.length || null, onPress: () => selectSegment('stories') },
          { key: 'ads', label: 'Ads', icon: 'bullhorn-outline', badge: ads.length || null, onPress: () => selectSegment('ads') },
        ],
      },
      {
        label: 'ACTIONS',
        items: [
          {
            key: 'new',
            label: 'New Article',
            icon: 'plus-circle-outline',
            onPress: () => navigation.navigate('NewsAdminEditor'),
          },
          {
            key: 'newAd',
            label: 'New Ad',
            icon: 'bullhorn-outline',
            onPress: () => navigation.navigate('AdEditor'),
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
    [stats.pending, stats.archived, stories.length, ads.length, selectSegment, navigation, viaDirector, handleExit]
  );

  const handleDelete = useCallback(
    (article) => {
      Alert.alert('Delete article', `Delete "${article.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteArticle(article.id) },
      ]);
    },
    [deleteArticle]
  );

  const handleAddCategory = useCallback(() => {
    const label = newCategory.trim();
    if (!label) return;
    addCategory(label);
    setNewCategory('');
  }, [newCategory, addCategory]);

  const handleDeleteCategory = useCallback(
    async (category) => {
      const removed = await deleteCategory(category.key);
      if (!removed) {
        Alert.alert(
          'Category in use',
          `"${category.label}" still has articles. Move or delete those articles first.`
        );
      }
    },
    [deleteCategory]
  );

  const startRenameCategory = useCallback((category) => {
    setRenamingKey(category.key);
    setRenameText(category.label);
  }, []);

  const cancelRenameCategory = useCallback(() => {
    setRenamingKey(null);
    setRenameText('');
  }, []);

  const saveRenameCategory = useCallback(() => {
    const label = renameText.trim();
    if (label) updateCategory(renamingKey, { label });
    setRenamingKey(null);
    setRenameText('');
  }, [renamingKey, renameText, updateCategory]);

  // A Map built once per articles-change, rather than a fresh linear scan
  // for every ad row rendered — matters once there are real numbers of both
  // articles and ads, not just the handful seeded today.
  const articleTitleById = useMemo(() => new Map(articles.map((a) => [a.id, a.title])), [articles]);
  const articleTitleFor = useCallback(
    (id) => articleTitleById.get(id) || 'Inkuru yasibwe',
    [articleTitleById]
  );

  const handleDeleteAd = useCallback(
    (ad) => {
      Alert.alert('Delete ad', 'Remove this ad from the News feed?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteAd(ad.id) },
      ]);
    },
    [deleteAd]
  );

  const storyCounts = useMemo(() => {
    const counts = new Map();
    articles.forEach((a) => {
      if (a.storyId) counts.set(a.storyId, (counts.get(a.storyId) || 0) + 1);
    });
    return stories.map((s) => ({ ...s, count: counts.get(s.id) || 0 }));
  }, [stories, articles]);

  const handleAddStory = useCallback(() => {
    const title = newStoryTitle.trim();
    if (!title) return;
    addStory(title);
    setNewStoryTitle('');
  }, [newStoryTitle, addStory]);

  const handleToggleStoryLive = useCallback(
    (story) => updateStory(story.id, { isLive: !story.isLive }),
    [updateStory]
  );

  const handleDeleteStory = useCallback(
    (story) => {
      Alert.alert(
        'Delete story',
        `Delete "${story.title}"? Its articles stay, they just stop being grouped together.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteStory(story.id) },
        ]
      );
    },
    [deleteStory]
  );

  return (
    <GradientBackground>
      <View style={styles.body}>
        {/* Desktop: a fixed panel that pushes the content over. */}
        {isWide && sidebarOpen ? (
          <AdminSidebar brandSubtitle="ADMIN · NEWS" sections={sidebarSections} activeKey={segment} />
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
            <Text style={styles.title}>News Dashboard</Text>
            <Text style={styles.subtitle}>Manage everything readers see in the News tab</Text>
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

        {/* --- Stats ------------------------------------------------------ */}
        <View style={styles.statsRow}>
          <AdminStatCard icon="file-document-outline" value={stats.total} label="Total articles" style={styles.statSpacing} />
          <AdminStatCard icon="check-circle-outline" value={stats.published} label="Published" tint={colors.success} style={styles.statSpacing} />
        </View>
        <View style={styles.statsRow}>
          <AdminStatCard icon="pencil-outline" value={stats.drafts} label="Drafts" tint={colors.warning} style={styles.statSpacing} />
          <AdminStatCard icon="clock-outline" value={stats.pending} label="Pending approval" tint={colors.blue500} style={styles.statSpacing} />
        </View>
        <View style={styles.statsRow}>
          <AdminStatCard icon="archive-outline" value={stats.archived} label="Archived" tint={colors.blue300} style={styles.statSpacing} />
          <View style={styles.statSpacing} />
        </View>
        <View style={styles.viewsCard}>
          <MaterialCommunityIcons name="eye-outline" size={16} color={colors.blue300} />
          <Text style={styles.viewsText}>
            {stats.views} article {stats.views === 1 ? 'read' : 'reads'} counted this session
          </Text>
        </View>

        <PrimaryButton
          label="New article"
          icon="plus"
          onPress={() => navigation.navigate('NewsAdminEditor')}
          style={styles.newButton}
        />

        {/* --- Segments --------------------------------------------------- */}
        <View style={styles.segmentRow}>
          {SEGMENTS.map((option) => {
            const active = segment === option.key;
            const badge =
              option.key === 'pending'
                ? stats.pending
                : option.key === 'archived'
                ? stats.archived
                : option.key === 'stories'
                ? stories.length
                : option.key === 'ads'
                ? ads.length
                : 0;
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

        {/* --- Select-to-archive toolbar ----------------------------------- */}
        {segment === 'all' ? (
          <View style={styles.selectRow}>
            {selectMode ? (
              <>
                <Text style={styles.selectCount}>{selectedIds.size} selected</Text>
                <View style={styles.selectActions}>
                  <Pressable onPress={toggleSelectMode} style={styles.ghostAction} accessibilityRole="button">
                    <Text style={styles.ghostLabel}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleArchiveSelected}
                    disabled={!selectedIds.size}
                    style={[styles.archiveAction, !selectedIds.size && styles.archiveActionDisabled]}
                    accessibilityRole="button"
                  >
                    <MaterialCommunityIcons name="archive-arrow-down-outline" size={14} color={colors.white} />
                    <Text style={styles.archiveActionLabel}>Archive selected</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Pressable onPress={toggleSelectMode} style={styles.selectToggle} accessibilityRole="button">
                  <MaterialCommunityIcons name="checkbox-multiple-marked-outline" size={15} color={colors.blue300} />
                  <Text style={styles.selectToggleLabel}>Select to archive</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSortByViews((v) => !v)}
                  style={styles.selectToggle}
                  accessibilityRole="button"
                  accessibilityLabel={sortByViews ? 'Sort by newest' : 'Sort by most viewed'}
                >
                  <MaterialCommunityIcons
                    name={sortByViews ? 'eye-check' : 'eye-outline'}
                    size={15}
                    color={sortByViews ? colors.white : colors.blue300}
                  />
                  <Text style={[styles.selectToggleLabel, sortByViews && styles.sortActiveLabel]}>Most viewed</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : null}

        {/* --- Categories segment ----------------------------------------- */}
        {segment === 'categories' ? (
          <View>
            <View style={styles.addCategoryRow}>
              <TextField
                label="Add a category"
                value={newCategory}
                onChangeText={setNewCategory}
                placeholder="e.g. Technology"
                icon="shape-outline"
                style={styles.addCategoryField}
                onSubmitEditing={handleAddCategory}
              />
              <Pressable
                onPress={handleAddCategory}
                accessibilityRole="button"
                accessibilityLabel="Add category"
                style={styles.addCategoryButton}
              >
                <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
              </Pressable>
            </View>

            {categoryCounts.map((category) =>
              renamingKey === category.key ? (
                <View key={category.key} style={styles.categoryRow}>
                  <TextField
                    value={renameText}
                    onChangeText={setRenameText}
                    style={styles.renameField}
                    onSubmitEditing={saveRenameCategory}
                  />
                  <Pressable onPress={saveRenameCategory} accessibilityRole="button" accessibilityLabel="Save name" style={styles.categoryAction}>
                    <MaterialCommunityIcons name="check" size={16} color={colors.success} />
                  </Pressable>
                  <Pressable onPress={cancelRenameCategory} accessibilityRole="button" accessibilityLabel="Cancel rename" style={styles.categoryAction}>
                    <MaterialCommunityIcons name="close" size={16} color={colors.textOnNavyFaint} />
                  </Pressable>
                </View>
              ) : (
                <View key={category.key} style={styles.categoryRow}>
                  <View style={styles.categoryBody}>
                    <Text style={styles.categoryLabel}>{category.label}</Text>
                    <Text style={styles.categoryCount}>
                      {category.count} {category.count === 1 ? 'article' : 'articles'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => startRenameCategory(category)}
                    accessibilityRole="button"
                    accessibilityLabel={`Rename ${category.label}`}
                    style={styles.categoryAction}
                  >
                    <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.blue300} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteCategory(category)}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${category.label}`}
                    style={[styles.categoryAction, styles.categoryDelete]}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.danger} />
                  </Pressable>
                </View>
              )
            )}
          </View>
        ) : segment === 'stories' ? (
          /* --- Stories segment -------------------------------------------- */
          <View>
            <View style={styles.addCategoryRow}>
              <TextField
                label="Start a new live story"
                value={newStoryTitle}
                onChangeText={setNewStoryTitle}
                placeholder="e.g. Intambara muri Iran"
                icon="update"
                style={styles.addCategoryField}
                onSubmitEditing={handleAddStory}
              />
              <Pressable
                onPress={handleAddStory}
                accessibilityRole="button"
                accessibilityLabel="Add story"
                style={styles.addCategoryButton}
              >
                <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
              </Pressable>
            </View>

            {storyCounts.length ? (
              storyCounts.map((story) => (
                <View key={story.id} style={styles.categoryRow}>
                  <View style={styles.categoryBody}>
                    <View style={styles.storyTitleRow}>
                      {story.isLive ? <View style={styles.liveDot} /> : null}
                      <Text style={styles.categoryLabel} numberOfLines={1}>
                        {story.title}
                      </Text>
                    </View>
                    <Text style={styles.categoryCount}>
                      {story.count} {story.count === 1 ? 'update' : 'updates'} · {story.isLive ? 'Live' : 'Ended'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleToggleStoryLive(story)}
                    accessibilityRole="button"
                    accessibilityLabel={story.isLive ? 'Mark story ended' : 'Reopen story'}
                    style={styles.categoryAction}
                  >
                    <MaterialCommunityIcons
                      name={story.isLive ? 'stop-circle-outline' : 'play-circle-outline'}
                      size={16}
                      color={colors.blue300}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteStory(story)}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${story.title}`}
                    style={[styles.categoryAction, styles.categoryDelete]}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.danger} />
                  </Pressable>
                </View>
              ))
            ) : (
              <EmptyState
                tone="dark"
                icon="update"
                title="No live stories yet"
                message="Start one here, or from the article editor, to group updates on an ongoing event."
              />
            )}
          </View>
        ) : segment === 'ads' ? (
          /* --- Ads segment ------------------------------------------------ */
          <View>
            <PrimaryButton
              label="New ad"
              icon="plus"
              onPress={() => navigation.navigate('AdEditor')}
              style={styles.newButton}
            />

            {ads.length ? (
              ads.map((ad) => (
                <View key={ad.id} style={styles.adRow}>
                  <View style={styles.adThumb}>
                    <MaterialCommunityIcons
                      name={ad.type === 'video' ? 'play-circle-outline' : 'image-outline'}
                      size={20}
                      color={colors.blue300}
                    />
                  </View>
                  <View style={styles.categoryBody}>
                    <Text style={styles.categoryLabel}>{ad.type === 'video' ? 'Video ad' : 'Photo ad'}</Text>
                    <Text style={styles.categoryCount} numberOfLines={1}>
                      After: {articleTitleFor(ad.afterArticleId)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => navigation.navigate('AdEditor', { adId: ad.id })}
                    accessibilityRole="button"
                    accessibilityLabel="Edit ad"
                    style={styles.categoryAction}
                  >
                    <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.blue300} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteAd(ad)}
                    accessibilityRole="button"
                    accessibilityLabel="Delete ad"
                    style={[styles.categoryAction, styles.categoryDelete]}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.danger} />
                  </Pressable>
                </View>
              ))
            ) : (
              <EmptyState
                tone="dark"
                icon="bullhorn-outline"
                title="No ads yet"
                message="Ads you create appear inline in the News tab, right after the article you choose."
              />
            )}
          </View>
        ) : (
          /* --- Article lists -------------------------------------------- */
          <View>
            <TextField
              label="Search"
              value={search}
              onChangeText={setSearch}
              placeholder="Search by title, source or category"
              icon="magnify"
            />

            {visibleArticles.length ? (
              visibleArticles.map((article) => (
                <AdminArticleRow
                  key={article.id}
                  article={article}
                  categoryLabel={categoryLabelFor(article.category)}
                  mode={
                    segment === 'pending'
                      ? 'approve'
                      : segment === 'archived'
                      ? 'archived'
                      : selectMode
                      ? 'select'
                      : 'manage'
                  }
                  onEdit={(a) => navigation.navigate('NewsAdminEditor', { articleId: a.id })}
                  onDelete={handleDelete}
                  onApprove={approveArticle}
                  onReject={rejectArticle}
                  onRestore={unarchiveArticle}
                  selected={selectedIds.has(article.id)}
                  onToggleSelect={toggleSelected}
                />
              ))
            ) : (
              <EmptyState
                tone="dark"
                icon={segment === 'pending' ? 'check-all' : segment === 'archived' ? 'archive-outline' : 'newspaper-variant-outline'}
                title={
                  segment === 'pending'
                    ? 'Nothing waiting for approval'
                    : segment === 'archived'
                    ? 'No archived articles'
                    : 'No articles found'
                }
                message={
                  segment === 'pending'
                    ? 'Articles submitted for approval will appear here.'
                    : segment === 'archived'
                    ? 'Articles you archive stay here, never deleted, until you restore them.'
                    : 'Try a different search, or create a new article.'
                }
              />
            )}
          </View>
        )}
        </ScrollView>

        {/* Phone: an overlay drawer instead of a fixed panel, since there's
            no room to push the content over. Tapping the backdrop sends it
            away, same as tapping the menu button again. */}
        {!isWide && sidebarOpen ? (
          <View style={StyleSheet.absoluteFill}>
            <Pressable
              style={[StyleSheet.absoluteFill, styles.backdrop]}
              onPress={() => setSidebarOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Close sidebar"
            />
            <View style={styles.drawer}>
              <AdminSidebar brandSubtitle="ADMIN · NEWS" sections={sidebarSections} activeKey={segment} />
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
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  selectToggle: { flexDirection: 'row', alignItems: 'center' },
  selectToggleLabel: { ...typography.caption, color: colors.blue300, fontWeight: '600', marginLeft: spacing.xs },
  selectCount: { ...typography.caption, color: colors.textOnNavy, fontWeight: '600' },
  sortActiveLabel: { color: colors.white },
  selectActions: { flexDirection: 'row', alignItems: 'center' },
  ghostAction: { paddingHorizontal: spacing.sm, height: 32, justifyContent: 'center' },
  ghostLabel: { fontSize: 12, color: colors.textOnNavyFaint },
  archiveAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blue500,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 32,
    marginLeft: spacing.sm,
  },
  archiveActionDisabled: { opacity: 0.4 },
  archiveActionLabel: { fontSize: 12, fontWeight: '600', color: colors.white, marginLeft: 4 },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    ...shadows.floating,
  },
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
  title: { fontSize: 20, fontWeight: '700', color: colors.white, letterSpacing: -0.3 },
  subtitle: { ...typography.caption, color: colors.textOnNavyFaint, marginTop: 2 },
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
  viewsText: { ...typography.caption, color: colors.blue300, marginLeft: spacing.sm },
  newButton: { marginBottom: spacing.xl },
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
  addCategoryRow: { flexDirection: 'row', alignItems: 'flex-start' },
  addCategoryField: { flex: 1, marginRight: spacing.sm },
  addCategoryButton: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.blue500,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  categoryAction: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  categoryDelete: { backgroundColor: 'rgba(208,52,44,0.16)' },
  storyTitleRow: { flexDirection: 'row', alignItems: 'center' },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.breaking,
    marginRight: spacing.xs,
  },
  renameField: { flex: 1, marginBottom: 0 },
  adRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  adThumb: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(133,183,235,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
});
