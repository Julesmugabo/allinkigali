/**
 * NewsScreen.js — Ecran y'amakuru (the default tab).
 *
 * Owns all the data and handlers; rendering is delegated to NewsFeed, which
 * Metro resolves to the phone-shaped feed (NewsFeedNarrow) on native and a
 * phone-width web browser, or the desktop layout (NewsFeedWide) on a wide
 * web browser — see NewsFeed.web.js. Nothing here needs to know which one
 * is showing.
 */
import React, { useState, useCallback, useMemo } from 'react';

import NewsFeed from './NewsFeed';
import { useNews } from '../../context/NewsContext';
import { useAds, nthAd } from '../../context/AdsContext';
import useUnreadNotifications from '../../hooks/useUnreadNotifications';

const EVERY = 6; // one app ad after every 6 stories

export default function NewsScreen({ navigation }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const unreadCount = useUnreadNotifications();

  const { categoriesWithAll, getFeed, incrementArticleView, isLoading, loadFailed, reload, articles } = useNews();
  const { appAds } = useAds();

  // refreshKey is in the deps so pull-to-refresh recomputes relative times.
  const feed = useMemo(() => getFeed(activeCategory), [getFeed, activeCategory, refreshKey]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await reload();
    } catch {}
    setRefreshKey((k) => k + 1);
    setIsRefreshing(false);
  }, [reload]);

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

  const handleStoryPress = useCallback(
    (story) => navigation.navigate('Story', { storyId: story.id }),
    [navigation]
  );

  const onSeeAllPress = useCallback(
    () => navigation.navigate('AllArticles', { category: activeCategory }),
    [navigation, activeCategory]
  );

  const onNotificationsPress = useCallback(() => navigation.navigate('Notifications'), [navigation]);

  // App ads: the first two take the 2nd and 4th "Bisomwa cyane" cards (one
  // card only when there's a single ad), then one follows every 6 stories,
  // taking turns through the list. The wide web layout uses web ads instead.
  const trendAds = useMemo(() => appAds.slice(0, 2), [appAds]);
  const feedItems = useMemo(() => {
    const items = [];
    let turn = trendAds.length;
    feed.latest.forEach((article, i) => {
      items.push({ rowKey: article.id, kind: 'article', article });
      const ad = (i + 1) % EVERY === 0 ? nthAd(appAds, turn++) : null;
      if (ad) items.push({ rowKey: `ad-${i}-${ad.id}`, kind: 'ad', ad });
    });
    return items;
  }, [feed.latest, appAds, trendAds]);

  return (
    <NewsFeed
      categories={categoriesWithAll}
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      unreadCount={unreadCount}
      onNotificationsPress={onNotificationsPress}
      feed={feed}
      trendAds={trendAds}
      feedItems={feedItems}
      handleArticlePress={handleArticlePress}
      handleStoryPress={handleStoryPress}
      handleRefresh={handleRefresh}
      isRefreshing={isRefreshing}
      isLoading={isLoading}
      loadFailed={loadFailed}
      articles={articles}
      reload={reload}
      onSeeAllPress={onSeeAllPress}
    />
  );
}
