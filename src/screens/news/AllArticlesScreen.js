/**
 * AllArticlesScreen.js — Full paginated article list, reachable via "Byose" on the News tab.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../../components/common/GradientBackground';
import NewsListItem from '../../components/news/NewsListItem';
import { useNews } from '../../context/NewsContext';
import { colors, typography, spacing, radius, gutter } from '../../theme';
import AppTopBar from '../../components/common/AppTopBar';

const PAGE = 20;

export default function AllArticlesScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const initialCategory = route?.params?.category || 'all';
  const { categoriesWithAll, getFeed, incrementArticleView } = useNews();
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const feed = useMemo(() => getFeed(category), [getFeed, category]);

  // Merge hero into the pool so it appears in search results.
  const allArticles = useMemo(() => {
    if (!feed.hero) return feed.latest;
    const inLatest = feed.latest.some(a => a.id === feed.hero.id);
    return inLatest ? feed.latest : [feed.hero, ...feed.latest];
  }, [feed.hero, feed.latest]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allArticles;
    const q = search.toLowerCase();
    return allArticles.filter(a =>
      a.title?.toLowerCase().includes(q) ||
      a.source?.toLowerCase().includes(q) ||
      a.body?.toLowerCase().includes(q)
    );
  }, [allArticles, search]);

  const displayed = useMemo(() => filtered.slice(0, page * PAGE), [filtered, page]);

  const handlePress = useCallback((article) => {
    if (!article?.id) return;
    incrementArticleView(article.id);
    navigation.navigate('ArticleDetail', { id: article.id });
  }, [incrementArticleView, navigation]);

  const handleEndReached = useCallback(() => {
    if (displayed.length < filtered.length) setPage(p => p + 1);
  }, [displayed.length, filtered.length]);

  const changeCategory = useCallback((key) => {
    setCategory(key);
    setPage(1);
  }, []);

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <AppTopBar variant="slim" style={{ paddingHorizontal: gutter, marginTop: spacing.xs }} />
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>All Articles</Text>
          <Text style={styles.count}>{filtered.length}</Text>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={18} color={colors.textOnNavyFaint} style={{ marginRight: spacing.xs }} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={v => { setSearch(v); setPage(1); }}
            placeholder="Search articles…"
            placeholderTextColor={colors.textOnNavyFaint}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={17} color={colors.textOnNavyFaint} />
            </Pressable>
          )}
        </View>

        {/* Category chips */}
        <FlatList
          horizontal
          data={categoriesWithAll}
          keyExtractor={c => c.key}
          showsHorizontalScrollIndicator={false}
          style={styles.catList}
          contentContainerStyle={{ paddingHorizontal: gutter, gap: spacing.xs }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => changeCategory(item.key)}
              style={[styles.catChip, category === item.key && styles.catChipActive]}
            >
              <Text style={[styles.catLabel, category === item.key && styles.catLabelActive]}>{item.label}</Text>
            </Pressable>
          )}
        />

        {/* Articles */}
        <FlatList
          data={displayed}
          keyExtractor={a => a.id}
          renderItem={({ item }) => (
            <NewsListItem article={item} onPress={() => handlePress(item)} />
          )}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: insets.bottom + spacing.xl }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="newspaper-variant-outline" size={48} color={colors.textOnNavyFaint} />
              <Text style={styles.emptyText}>No articles found</Text>
            </View>
          }
        />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: gutter, paddingVertical: spacing.md },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.white },
  count: { fontSize: 13, color: colors.textOnNavyFaint, fontWeight: '600' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: gutter, marginBottom: spacing.sm, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.22)', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  searchInput: { flex: 1, fontSize: 14, color: colors.white },
  catList: { marginBottom: spacing.sm, flexGrow: 0 },
  catChip: { borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(133,183,235,0.25)', paddingHorizontal: spacing.md, paddingVertical: 6 },
  catChipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  catLabel: { fontSize: 12, fontWeight: '600', color: colors.textOnNavy },
  catLabelActive: { color: colors.white },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: spacing.md },
  emptyText: { fontSize: 14, color: colors.textOnNavyFaint },
});
