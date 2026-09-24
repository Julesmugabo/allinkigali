/**
 * ArticleDetailScreen.js — Gusoma inkuru yose (full article reading screen).
 *
 * Reached by tapping any article card in the News tab. Until this screen
 * existed, tapping an article only counted a view and did nothing else —
 * this is what actually lets someone read the story.
 */
import React from 'react';
import { View, Text, Image, ScrollView, Pressable, Linking, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import BrandLogo from '../components/news/BrandLogo';
import Badge from '../components/common/Badge';
import { useNews } from '../context/NewsContext';
import { timeAgo } from '../utils/date';
import { colors, typography, spacing, radius, gutter } from '../theme';

export default function ArticleDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { getArticleById, categories, getStoryById } = useNews();
  const article = getArticleById(route.params?.id);

  const categoryLabel = article ? categories.find((c) => c.key === article.category)?.label || '' : '';
  const story = article?.storyId ? getStoryById(article.storyId) : null;

  if (!article) {
    return (
      <GradientBackground>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Iyi nkuru ntibonetse.</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.huge }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageWell}>
          {article.imageUrl ? (
            <Image source={{ uri: article.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <BrandLogo size={104} showMeridians opacity={0.13} />
          )}

          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Subira inyuma"
            style={[styles.backButton, { top: insets.top + spacing.sm }]}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.white} />
          </Pressable>

          {article.isBreaking ? (
            <Badge label="BREAKING" color={colors.white} backgroundColor={colors.breaking} style={styles.breakingBadge} />
          ) : null}
        </View>

        <View style={styles.content}>
          {categoryLabel ? <Text style={styles.category}>{categoryLabel.toUpperCase()}</Text> : null}
          <Text style={styles.title}>{article.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.sourceChip}>
              <MaterialCommunityIcons name="open-in-new" size={11} color={colors.blue300} />
              <Text style={styles.sourceText}>{article.source}</Text>
            </View>
            <Text style={styles.time}>{timeAgo(article.publishedAt)}</Text>
            <Text style={styles.time}>· {article.views || 0} abasomye</Text>
          </View>

          {article.body?.trim() ? (
            <Text style={styles.body}>{article.body}</Text>
          ) : (
            <Text style={styles.bodyMissing}>Iyi nkuru ntabwo ifite umwandiko wuzuye kugeza ubu.</Text>
          )}

          {story ? (
            <Pressable
              onPress={() => navigation.navigate('Story', { storyId: story.id })}
              accessibilityRole="button"
              accessibilityLabel={`Reba amakuru akurikiranwa: ${story.title}`}
              style={styles.storyLink}
            >
              <MaterialCommunityIcons name="update" size={15} color={colors.blue300} />
              <Text style={styles.storyLinkText}>
                {story.isLive ? 'Amakuru akurikiranwa' : 'Amakuru yarangiye'}: {story.title} — reba ayabanje
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={colors.blue300} />
            </Pressable>
          ) : null}

          {article.sourceUrl ? (
            <Pressable
              onPress={() => Linking.openURL(article.sourceUrl)}
              accessibilityRole="link"
              style={styles.sourceLink}
            >
              <MaterialCommunityIcons name="link-variant" size={15} color={colors.blue300} />
              <Text style={styles.sourceLinkText}>Soma inkuru yuzuye kuri {article.source}</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { ...typography.body, color: colors.textOnNavy },
  imageWell: {
    height: 220,
    backgroundColor: 'rgba(2,28,54,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  backButton: {
    position: 'absolute',
    left: gutter,
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(2,28,54,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakingBadge: { position: 'absolute', bottom: spacing.md, left: gutter },
  content: { paddingHorizontal: gutter, paddingTop: spacing.lg },
  category: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.blue500,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.screenTitle,
    fontSize: 21,
    lineHeight: 27,
    color: colors.white,
    marginBottom: spacing.md,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24,95,165,0.35)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(55,138,221,0.35)',
    borderRadius: radius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginRight: spacing.sm,
  },
  sourceText: { ...typography.meta, color: colors.blue300, marginLeft: 4, fontWeight: '500' },
  time: { ...typography.meta, color: colors.textOnNavyFaint, marginRight: spacing.sm },
  body: {
    ...typography.body,
    fontSize: 14.5,
    lineHeight: 23,
    color: colors.textOnNavy,
    marginBottom: spacing.xl,
  },
  bodyMissing: {
    ...typography.body,
    fontSize: 13.5,
    fontStyle: 'italic',
    color: colors.textOnNavyFaint,
    marginBottom: spacing.xl,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(55,138,221,0.16)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  sourceLinkText: { ...typography.caption, color: colors.blue300, marginLeft: spacing.sm, fontWeight: '600' },
  storyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(208,52,44,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(208,52,44,0.3)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  storyLinkText: {
    flex: 1,
    ...typography.caption,
    color: colors.blue300,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
});
