/**
 * NewsListItem.js — Ikarita y'inkuru mu rutonde (feed row).
 * Thumbnail on the left, headline and meta on the right.
 */
import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import ViewCount from './ViewCount';
import ShareIcon from './ShareIcon';
import ArticleLabels from './ArticleLabels';
import { useNews } from '../../context/NewsContext';
import { timeAgo } from '../../utils/date';
import { colors, typography, spacing, radius, shadows } from '../../theme';

export default function NewsListItem({ article, onPress }) {
  const { categories } = useNews();
  const accent = colors.category[article.category] || colors.blue600;
  const tint = colors.categoryTint[article.category] || colors.blue100;
  const categoryLabel = (categories.find((c) => c.key === article.category)?.label || '').toUpperCase();

  return (
    <Pressable
      onPress={() => onPress && onPress(article)}
      accessibilityRole="button"
      accessibilityLabel={article.title}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.thumb, { backgroundColor: tint }]}>
        {article.imageUrl ? (
          <Image source={{ uri: article.imageUrl }} style={styles.thumbImage} resizeMode="cover" />
        ) : (
          <MaterialCommunityIcons name={article.icon || 'newspaper-variant'} size={22} color={accent} />
        )}
      </View>

      <View style={styles.body}>
        <ArticleLabels article={article} style={styles.labels} />
        <Text style={styles.title} numberOfLines={3}>
          {article.title}
        </Text>

        <View style={styles.footer}>
          <View style={styles.timeViews}>
            <Text style={styles.time}>{timeAgo(article.publishedAt)}</Text>
            <ViewCount count={article.views || 0} style={styles.views} />
            <ShareIcon article={article} style={styles.share} />
          </View>
          <View style={styles.tags}>
            {categoryLabel ? (
              <View style={[styles.categoryChip, { backgroundColor: tint }]}>
                <Text style={[styles.category, { color: accent }]} numberOfLines={1}>
                  {categoryLabel}
                </Text>
              </View>
            ) : null}
            <View style={styles.sourceChip}>
              <MaterialCommunityIcons name="open-in-new" size={10} color={colors.blue600} />
              <Text style={styles.sourceText} numberOfLines={1}>
                {article.source}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md - 2,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  pressed: { opacity: 0.9, backgroundColor: '#FBFCFE' },
  thumb: {
    width: 58,
    height: 58,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: { width: '100%', height: '100%' },
  body: { flex: 1, marginLeft: spacing.md - 2, minWidth: 0 },
  labels: { marginBottom: 2 },
  tags: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginLeft: spacing.sm },
  categoryChip: {
    flexShrink: 1,
    borderRadius: radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: spacing.xs,
  },
  category: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    ...typography.cardTitle,
    color: colors.navy800,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeViews: { flexDirection: 'row', alignItems: 'center' },
  views: { marginLeft: spacing.sm },
  share: { marginLeft: spacing.xs + 2 },
  time: {
    ...typography.meta,
    color: colors.textMuted,
  },
  sourceChip: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blue100,
    borderRadius: radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sourceText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: colors.blue600,
    marginLeft: 3,
  },
});
