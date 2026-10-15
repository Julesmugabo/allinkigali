/**
 * NewsFeedWide.js — the desktop-shaped feed: category strip + date under the
 * top nav, a breaking strip when something is flagged, then a 3-column body
 * (timestamped latest on the left, hero + top stories + a grid in the
 * center, trending + an ad in the right rail). Only ever rendered from
 * NewsFeed.web.js once the viewport is wide — see useIsWideWeb.
 *
 * Reuses the same cards as the phone feed (HeroCard, NewsListItem) so a
 * design change to either one applies to both layouts automatically.
 */
import React, { useMemo } from 'react';
import { View, Text, Pressable, Image, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import WebContainer from '../../web/layout/WebContainer';
import HeroCard from '../../components/news/HeroCard';
import NewsTagline from '../../components/news/NewsTagline';
import NewsListItem from '../../components/news/NewsListItem';
import SideAd from '../../components/news/ads/SideAd';
import { useAds } from '../../context/AdsContext';
import FeedSkeleton from '../../components/news/FeedSkeleton';
import EmptyState from '../../components/common/EmptyState';

import { formatLongDate, timeAgo } from '../../utils/date';
import { colors, typography, spacing, radius } from '../../theme';
import RestoPromo from '../../components/news/RestoPromo';

const LEFT_AD_MIN_WIDTH = 1200;

export default function NewsFeedWide({
  categories,
  activeCategory,
  onCategoryChange,
  feed,
  handleArticlePress,
  handleStoryPress,
  isLoading,
  loadFailed,
  articles,
  reload,
  onSeeAllPress,
}) {
  // Web ads: the first runs on the right; a second (if any) on the left,
  // which only shows when the screen is wide enough for both columns.
  const { webAds } = useAds();
  const { width } = useWindowDimensions();
  const rightAd = webAds[0] || null;
  const leftAd = width >= LEFT_AD_MIN_WIDTH ? webAds[1] || null : null;
  const breaking = useMemo(() => articles.filter((a) => a.isBreaking), [articles]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <WebContainer style={styles.skeletonPad}>
          <FeedSkeleton />
        </WebContainer>
      </View>
    );
  }

  if (loadFailed && !articles.length) {
    return (
      <View style={styles.container}>
        <WebContainer style={styles.skeletonPad}>
          <EmptyState
            icon="wifi-off"
            title="Ntibyashoboye gufungura amakuru"
            message="Reba internet yawe hanyuma ongera ugerageze."
            actionLabel="Ongera ugerageze"
            onActionPress={reload}
          />
        </WebContainer>
      </View>
    );
  }

  const [topStory1, topStory2, ...restLatest] = feed.latest;
  const timeline = feed.latest.slice(0, 8);

  return (
    <View style={styles.container}>
      <View style={styles.subBar}>
        <WebContainer style={styles.subBarRow}>
          <View style={styles.categoryRow}>
            {categories.map((category) => {
              const isActive = category.key === activeCategory;
              return (
                <Pressable
                  key={category.key}
                  onPress={() => onCategoryChange(category.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  style={styles.categoryTab}
                >
                  <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>
                    {category.label}
                  </Text>
                  {isActive ? <View style={styles.categoryUnderline} /> : null}
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.dateLabel}>{formatLongDate()}</Text>
        </WebContainer>
      </View>

      {breaking.length ? (
        <View style={styles.breakingBar}>
          <WebContainer style={styles.breakingRow}>
            <View style={styles.breakingTag}>
              <View style={styles.breakingDot} />
              <Text style={styles.breakingTagText}>BREAKING</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.breakingScroll}>
              {breaking.map((article, i) => (
                <Pressable key={article.id} onPress={() => handleArticlePress(article)} style={styles.breakingItem}>
                  <Text style={styles.breakingText} numberOfLines={1}>
                    {article.title}
                  </Text>
                  {i < breaking.length - 1 ? <Text style={styles.breakingSep}>•</Text> : null}
                </Pressable>
              ))}
            </ScrollView>
          </WebContainer>
        </View>
      ) : null}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <WebContainer>
          <NewsTagline style={styles.tagline} />
          <RestoPromo />
          <View style={styles.columns}>
            {/* Left: timestamped headline stream */}
            <View style={styles.leftCol}>
              <Text style={styles.colTitle}>AMAKURU MASHYA</Text>
              {timeline.map((article) => {
                const tint = colors.categoryTint[article.category] || colors.blue100;
                const accent = colors.category[article.category] || colors.blue600;
                return (
                  <Pressable key={article.id} onPress={() => handleArticlePress(article)} style={styles.timelineRow}>
                    <View style={[styles.timelineThumb, { backgroundColor: tint }]}>
                      {article.imageUrl ? (
                        <Image source={{ uri: article.imageUrl }} style={styles.timelineThumbImage} resizeMode="cover" />
                      ) : (
                        <MaterialCommunityIcons name={article.icon || 'newspaper-variant'} size={16} color={accent} />
                      )}
                    </View>
                    <View style={styles.timelineBody}>
                      <Text style={styles.timelineTime}>{timeAgo(article.publishedAt)}</Text>
                      <Text style={styles.timelineTitle} numberOfLines={2}>
                        {article.title}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
              {leftAd ? <SideAd ad={leftAd} style={styles.adSpacing} /> : null}
            </View>

            {/* Center: hero + top stories + grid */}
            <View style={styles.centerCol}>
              <HeroCard article={feed.hero} onPress={handleArticlePress} onStoryPress={handleStoryPress} />

              {(topStory1 || topStory2) && (
                <View style={styles.topStoriesRow}>
                  {topStory1 ? (
                    <View style={styles.topStoryHalf}>
                      <NewsListItem article={topStory1} onPress={handleArticlePress} />
                    </View>
                  ) : null}
                  {topStory2 ? (
                    <View style={styles.topStoryHalf}>
                      <NewsListItem article={topStory2} onPress={handleArticlePress} />
                    </View>
                  ) : null}
                </View>
              )}

              {restLatest.length ? (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.colTitle}>IBINDI</Text>
                    {onSeeAllPress ? (
                      <Pressable onPress={onSeeAllPress}>
                        <Text style={styles.seeAll}>Byose</Text>
                      </Pressable>
                    ) : null}
                  </View>
                  <View style={styles.grid}>
                    {restLatest.map((article) => (
                      <View key={article.id} style={styles.gridCell}>
                        <NewsListItem article={article} onPress={handleArticlePress} />
                      </View>
                    ))}
                  </View>
                </>
              ) : null}
            </View>

            {/* Right: trending + ad */}
            <View style={styles.rightCol}>
              <Text style={styles.colTitle}>BISOMWA CYANE</Text>
              {feed.trending.slice(0, 6).map((article, i) => (
                <Pressable key={article.id} onPress={() => handleArticlePress(article)} style={styles.trendingRow}>
                  <Text style={styles.trendingRank}>{i + 1}</Text>
                  <Text style={styles.trendingTitle} numberOfLines={3}>
                    {article.title}
                  </Text>
                </Pressable>
              ))}

              {rightAd ? <SideAd ad={rightAd} style={styles.adSpacing} /> : null}
            </View>
          </View>
        </WebContainer>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  skeletonPad: { paddingTop: spacing.xl },
  scrollContent: { paddingBottom: spacing.huge },
  tagline: { marginTop: spacing.xxl, marginBottom: spacing.sm },

  subBar: {
    backgroundColor: colors.navy800,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderOnNavy,
  },
  subBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTab: {
    position: 'relative',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  categoryLabel: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textOnNavyFaint,
  },
  categoryLabelActive: {
    color: colors.blue300,
  },
  categoryUnderline: {
    position: 'absolute',
    bottom: 0,
    left: spacing.md,
    right: spacing.md,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: colors.blue500,
  },
  dateLabel: {
    ...typography.caption,
    color: colors.textOnNavyFaint,
    marginLeft: spacing.lg,
  },

  breakingBar: { backgroundColor: colors.breaking },
  breakingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  breakingTag: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.lg },
  breakingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.white, marginRight: spacing.xs },
  breakingTagText: { ...typography.caption, fontWeight: '700', letterSpacing: 0.6, color: colors.white },
  breakingScroll: { flex: 1 },
  breakingItem: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.lg },
  breakingText: { ...typography.body, fontSize: 13, fontWeight: '600', color: colors.white },
  breakingSep: { color: 'rgba(255,255,255,0.5)', marginLeft: spacing.lg },

  columns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: spacing.xl,
    gap: spacing.xxl,
  },
  colTitle: {
    ...typography.sectionTitle,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  seeAll: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.blue500,
    marginBottom: spacing.md,
  },

  leftCol: { width: 280 },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  timelineThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  timelineThumbImage: { width: '100%', height: '100%' },
  timelineBody: { flex: 1, marginLeft: spacing.sm, minWidth: 0 },
  timelineTime: {
    ...typography.meta,
    color: colors.blue600,
    fontWeight: '600',
    marginBottom: 2,
  },
  timelineTitle: {
    ...typography.body,
    fontSize: 13.5,
    color: colors.textPrimary,
    lineHeight: 18,
  },

  centerCol: { flex: 1, minWidth: 0 },
  topStoriesRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  topStoryHalf: { flex: 1, minWidth: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridCell: { width: '48.5%' },

  rightCol: { width: 300 },
  trendingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  trendingRank: {
    ...typography.sectionTitle,
    width: 22,
    color: colors.blue500,
    fontSize: 15,
  },
  trendingTitle: {
    flex: 1,
    ...typography.body,
    fontSize: 13.5,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  adSpacing: { marginTop: spacing.lg },
});
