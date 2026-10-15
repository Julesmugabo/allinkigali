/**
 * NewsFeedNarrow.js — the phone-shaped feed: sticky header, one FlatList
 * (hero, trending rail, latest stories, ads, all in one scroll). This is the
 * feed every platform used before the web redesign, and what native and
 * narrow-web browsers still use — see NewsFeed.web.js for the switch.
 */
import React, { useMemo } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';

import NewsHeader from '../../components/news/NewsHeader';
import HeroCard from '../../components/news/HeroCard';
import TrendingRail from '../../components/news/TrendingRail';
import NewsListItem from '../../components/news/NewsListItem';
import FeedAdItem from '../../components/news/ads/FeedAdItem';
import FeedSkeleton from '../../components/news/FeedSkeleton';
import SectionLabel from '../../components/common/SectionLabel';
import EmptyState from '../../components/common/EmptyState';

import { formatLongDate } from '../../utils/date';
import { colors, typography, spacing, gutter } from '../../theme';
import RestoPromo from '../../components/news/RestoPromo';

export default function NewsFeedNarrow({
  categories,
  activeCategory,
  onCategoryChange,
  unreadCount,
  onNotificationsPress,
  feed,
  trendAds,
  feedItems,
  handleArticlePress,
  handleStoryPress,
  handleRefresh,
  isRefreshing,
  isLoading,
  loadFailed,
  articles,
  reload,
  onSeeAllPress,
}) {
  const listHeader = useMemo(
    () => (
      <View>
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>{formatLongDate()}</Text>
          <View style={styles.liveDot} />
        </View>

        <HeroCard article={feed.hero} onPress={handleArticlePress} onStoryPress={handleStoryPress} />

        {feed.trending.length ? (
          <>
            <SectionLabel title="BISOMWA CYANE" />
            <TrendingRail articles={feed.trending} ads={trendAds} onArticlePress={handleArticlePress} />
          </>
        ) : null}

        <RestoPromo />
        <SectionLabel title="AMAKURU MASHYA" actionLabel="Byose" onActionPress={onSeeAllPress} />
      </View>
    ),
    [feed, trendAds, handleArticlePress, handleStoryPress, onSeeAllPress]
  );

  return (
    <View style={styles.container}>
      <NewsHeader
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
        onNotificationsPress={onNotificationsPress}
        unreadCount={unreadCount}
      />

      <FlatList
        data={isLoading ? [] : feedItems}
        keyExtractor={(item) => item.rowKey}
        renderItem={({ item }) =>
          item.kind === 'ad' ? (
            <FeedAdItem ad={item.ad} />
          ) : (
            <NewsListItem article={item.article} onPress={handleArticlePress} />
          )
        }
        ListHeaderComponent={isLoading ? <FeedSkeleton /> : listHeader}
        ListEmptyComponent={
          isLoading ? null : loadFailed && !articles.length ? (
            <EmptyState
              icon="wifi-off"
              title="Ntibyashoboye gufungura amakuru"
              message="Reba internet yawe hanyuma ongera ugerageze."
              actionLabel="Ongera ugerageze"
              onActionPress={reload}
            />
          ) : (
            <EmptyState
              icon="newspaper-variant-outline"
              title="Nta makuru ari muri iki gice"
              message="Hitamo ikindi gice cyangwa ukurure hasi kugira ngo uvugurure."
            />
          )
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
});
