/**
 * TrendingRail.js — Amakuru asomwa cyane (horizontal "most read" rail).
 * The rank numbers are meaningful here — this list really is ordered by how
 * much each story is being read — so the 01/02/03 markers stay.
 * App ads (when running) take the 2nd and 4th card spots, same size as the
 * story cards; stories keep their own rank numbers around them.
 */
import React from 'react';
import { FlatList, View, Text, Pressable, StyleSheet } from 'react-native';

import { useNews } from '../../context/NewsContext';
import TrendAdCard from './ads/TrendAdCard';
import { colors, typography, spacing, radius, gutter } from '../../theme';

const CARD_WIDTH = 148;

function TrendCard({ article, rank, onPress }) {
  const { categories } = useNews();
  const categoryLabel = (categories.find((c) => c.key === article.category)?.label || '').toUpperCase();

  return (
    <Pressable
      onPress={() => onPress && onPress(article)}
      accessibilityRole="button"
      accessibilityLabel={`${rank}. ${article.title}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.rank}>{String(rank).padStart(2, '0')}</Text>
      <Text style={styles.category}>{categoryLabel}</Text>
      <Text style={styles.title} numberOfLines={4}>
        {article.title}
      </Text>
    </Pressable>
  );
}

const AD_SPOTS = [1, 3]; // 2nd and 4th card

function withAds(articles, ads) {
  const items = articles.map((article, i) => ({ key: article.id, article, rank: i + 1 }));
  AD_SPOTS.forEach((spot, i) => {
    if (ads[i] && items.length >= spot) items.splice(spot, 0, { key: `ad-${ads[i].id}`, ad: ads[i] });
  });
  return items;
}

export default function TrendingRail({ articles = [], ads = [], onArticlePress }) {
  if (!articles.length) return null;

  return (
    <FlatList
      data={withAds(articles, ads)}
      keyExtractor={(item) => item.key}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.list}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
      renderItem={({ item }) => (item.ad
        ? <TrendAdCard ad={item.ad} width={CARD_WIDTH} />
        : <TrendCard article={item.article} rank={item.rank} onPress={onArticlePress} />)}
    />
  );
}

const styles = StyleSheet.create({
  list: { marginHorizontal: -gutter },
  content: { paddingHorizontal: gutter, paddingVertical: 2 },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.navy800,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  pressed: { opacity: 0.9 },
  rank: {
    ...typography.trendNumber,
    color: 'rgba(133,183,235,0.2)',
    lineHeight: 26,
    marginBottom: spacing.xs,
  },
  category: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: colors.blue500,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.trendTitle,
    color: colors.blue300,
  },
});
