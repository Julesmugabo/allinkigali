/**
 * NewsListItem.js — Ikarita y'inkuru mu rutonde (feed row).
 * Thumbnail on the left, headline and meta on the right.
 */
import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

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
        <Text style={[styles.category, { color: accent }]}>{categoryLabel}</Text>

        <Text style={styles.title} numberOfLines={3}>
          {article.title}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.time}>{timeAgo(article.publishedAt)}</Text>
          <View style={styles.sourceChip}>
            <MaterialCommunityIcons name="open-in-new" size={10} color={colors.blue600} />
            <Text style={styles.sourceText}>{article.source}</Text>
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
  category: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 3,
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
  time: {
    ...typography.meta,
    color: colors.textMuted,
  },
  sourceChip: {
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
