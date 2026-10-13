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
import { useAds } from '../../context/AdsContext';
import useUnreadNotifications from '../../hooks/useUnreadNotifications';

export default function NewsScreen({ navigation }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const unreadCount = useUnreadNotifications();

  const { categoriesWithAll, getFeed, incrementArticleView, isLoading, loadFailed, reload, articles } = useNews();
  const { getAdAfter } = useAds();

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

  // The News admin anchors each ad to a real article's id ("show this right
  // after that story") rather than a raw position, so placement survives
  // articles being added/archived above it.
  const heroAd = feed.hero ? getAdAfter(feed.hero.id) : null;

  // Only the narrow (phone-shaped) feed interleaves ads between articles —
  // the wide layout places the one ad in its sidebar instead (see heroAd).
  const feedItems = useMemo(() => {
    const items = [];
    feed.latest.forEach((article) => {
      items.push({ rowKey: article.id, kind: 'article', article });
      const ad = getAdAfter(article.id);
      if (ad) items.push({ rowKey: ad.id, kind: 'ad', ad });
    });
    return items;
  }, [feed.latest, getAdAfter]);

  return (
    <NewsFeed
      categories={categoriesWithAll}
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      unreadCount={unreadCount}
      onNotificationsPress={onNotificationsPress}
      feed={feed}
      heroAd={heroAd}
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
