/**
 * NewsScreen.js — Ecran y'amakuru (the default tab).
 *
 * Sticky header, then a single FlatList: date, hero story, "most read" rail,
 * and the latest stories. Using one list (rather than a ScrollView full of
 * lists) keeps scrolling smooth as the feed grows.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';

import NewsHeader from '../components/news/NewsHeader';
import HeroCard from '../components/news/HeroCard';
import TrendingRail from '../components/news/TrendingRail';
import NewsListItem from '../components/news/NewsListItem';
import AdBox from '../components/news/AdBox';
import SectionLabel from '../components/common/SectionLabel';
import EmptyState from '../components/common/EmptyState';

import { useNews } from '../context/NewsContext';
import { useAds } from '../context/AdsContext';
import { formatLongDate } from '../utils/date';
import { colors, typography, spacing, gutter } from '../theme';

export default function NewsScreen({ navigation }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { categoriesWithAll, getFeed, incrementArticleView } = useNews();
  const { getAdAfter } = useAds();

  // refreshKey is in the deps so pull-to-refresh recomputes relative times.
  const feed = useMemo(() => getFeed(activeCategory), [getFeed, activeCategory, refreshKey]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Swap this timeout for your real fetch when the API is ready.
    setTimeout(() => {
      setRefreshKey((k) => k + 1);
      setIsRefreshing(false);
    }, 900);
  }, []);

  const handleArticlePress = useCallback(
    (article) => {
      // Counts a real read, which is what the News dashboard's view stats
      // are built from.
      if (!article?.id) return;
      incrementArticleView(article.id);
      navigation.navigate('ArticleDetail', { id: article.id });
    },
    [incrementArticleView, navigation]
  );

  // The News admin anchors each ad to a real article's id ("show this right
  // after that story") rather than a raw position, so placement survives
  // articles being added/archived above it. One combined list keeps the
  // hero, ads and latest stories all inside the same scrollable FlatList —
  // nothing here is a separately-scrolling or pinned block.
  const heroAd = feed.hero ? getAdAfter(feed.hero.id) : null;

  const feedItems = useMemo(() => {
    const items = [];
    feed.latest.forEach((article) => {
      items.push({ rowKey: article.id, kind: 'article', article });
      const ad = getAdAfter(article.id);
      if (ad) items.push({ rowKey: ad.id, kind: 'ad', ad });
    });
    return items;
  }, [feed.latest, getAdAfter]);

  const listHeader = useMemo(
    () => (
      <View>
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>{formatLongDate()}</Text>
          <View style={styles.liveDot} />
        </View>

        <HeroCard article={feed.hero} onPress={handleArticlePress} />

        {heroAd ? <AdBox ad={heroAd} style={styles.heroAdSpacing} /> : null}

        {feed.trending.length ? (
          <>
            <SectionLabel title="BISOMWA CYANE" />
            <TrendingRail articles={feed.trending} onArticlePress={handleArticlePress} />
          </>
        ) : null}

        <SectionLabel title="AMAKURU MASHYA" actionLabel="Byose" onActionPress={() => {}} />
      </View>
    ),
    [feed, heroAd, handleArticlePress]
  );

  return (
    <View style={styles.container}>
      <NewsHeader
        categories={categoriesWithAll}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onNotificationsPress={() => {}}
        unreadCount={2}
      />

      <FlatList
        data={feedItems}
        keyExtractor={(item) => item.rowKey}
        renderItem={({ item }) =>
          item.kind === 'ad' ? (
            <AdBox ad={item.ad} />
          ) : (
            <NewsListItem article={item.article} onPress={handleArticlePress} />
          )
        }
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <EmptyState
            icon="newspaper-variant-outline"
            title="Nta makuru ari muri iki gice"
            message="Hitamo ikindi gice cyangwa ukurure hasi kugira ngo uvugurure."
          />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.blue500}
            colors={[colors.blue500]}
          />
        }
        // Perf: keeps long feeds light on memory. `removeClippedSubviews` is
        // deliberately NOT used here — on react-native-web it can leave
        // off-screen rows (including this header, with the hero card) stuck
        // un-repainted when scrolling back up.
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={9}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  dateLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.blue600,
    letterSpacing: 0.3,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.blue500,
  },
  heroAdSpacing: { marginTop: spacing.md },
});
