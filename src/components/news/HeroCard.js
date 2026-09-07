/**
 * HeroCard.js — Ikarita nkuru y'inkuru y'ingenzi.
 * The lead story. Shows a photo when the article has one, and falls back to the
 * navy "globe well" from the mockup when it doesn't.
 */
import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import BrandLogo from './BrandLogo';
import Badge from '../common/Badge';
import { useNews } from '../../context/NewsContext';
import { timeAgo } from '../../utils/date';
import { colors, typography, spacing, radius } from '../../theme';

export default function HeroCard({ article, onPress }) {
  const { categories } = useNews();
  if (!article) return null;

  const categoryLabel = (categories.find((c) => c.key === article.category)?.label || '').toUpperCase();

  return (
    <Pressable
      onPress={() => onPress && onPress(article)}
      accessibilityRole="button"
      accessibilityLabel={article.title}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.imageWell}>
        {article.imageUrl ? (
          <Image source={{ uri: article.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <BrandLogo size={104} showMeridians opacity={0.13} />
          </View>
        )}

        {article.isBreaking ? (
          <Badge
            label="BREAKING"
            color={colors.white}
            backgroundColor={colors.breaking}
            style={styles.breakingBadge}
          />
        ) : null}

        {categoryLabel ? (
          <Badge
            label={categoryLabel}
            color={colors.blue300}
            backgroundColor="rgba(55,138,221,0.22)"
            borderColor="rgba(55,138,221,0.4)"
            style={styles.categoryBadge}
          />
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={3}>
          {article.title}
        </Text>

        <View style={styles.footer}>
          <View style={styles.sourceChip}>
            <MaterialCommunityIcons name="open-in-new" size={11} color={colors.blue300} />
            <Text style={styles.sourceText}>{article.source}</Text>
          </View>
          <Text style={styles.time}>{timeAgo(article.publishedAt)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.navy800,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.92 },
  imageWell: {
    height: 168,
    backgroundColor: colors.navy700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  breakingBadge: { position: 'absolute', top: spacing.md, left: spacing.md },
  categoryBadge: { position: 'absolute', top: spacing.md, right: spacing.md },
  body: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.heroTitle,
    color: colors.textOnNavy,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24,95,165,0.35)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(55,138,221,0.35)',
    borderRadius: radius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  sourceText: {
    ...typography.meta,
    color: colors.blue300,
    marginLeft: 4,
    fontWeight: '500',
  },
  time: {
    ...typography.meta,
    color: 'rgba(133,183,235,0.5)',
  },
});
