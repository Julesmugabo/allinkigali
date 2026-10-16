/**
 * ArticleDetailNarrow.js — Gusoma inkuru yose (full article reading screen).
 *
 * Reached by tapping any article card in the News tab. Until this screen
 * existed, tapping an article only counted a view and did nothing else —
 * this is what actually lets someone read the story.
 */
import React from 'react';
import { View, Text, Image, ScrollView, Pressable, Linking, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ArticleLabels from '../../components/news/ArticleLabels';
import MarkdownBody from '../../components/news/MarkdownBody';
import ShareArticleButton from '../../components/news/ShareArticleButton';
import { useNews } from '../../context/NewsContext';
import { timeAgo } from '../../utils/date';
import { colors, typography, spacing, radius, gutter } from '../../theme';
import { reading } from '../../theme/reading';
import AppTopBar from '../../components/common/AppTopBar';

// ── Screen ─────────────────────────────────────────────────────────────────

export default function ArticleDetailNarrow({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { getArticleById, categories, getStoryById } = useNews();
  const article = getArticleById(route.params?.id);

  const categoryLabel = article ? categories.find((c) => c.key === article.category)?.label || '' : '';
  const story = article?.storyId ? getStoryById(article.storyId) : null;

  if (!article) {
    return (
      <View style={styles.page}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Iyi nkuru ntibonetse.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.huge }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageWell}>
          {article.imageUrl ? (
            <Image source={{ uri: article.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <MaterialCommunityIcons name="newspaper-variant-outline" size={64} color="rgba(133,183,235,0.2)" />
          )}

          <AppTopBar variant="overlay" style={{ top: insets.top + spacing.sm }} />

          <ArticleLabels article={article} style={styles.labels} />
        </View>

        <View style={styles.content}>
          {categoryLabel ? <Text style={styles.category}>{categoryLabel.toUpperCase()}</Text> : null}
          <Text style={styles.title}>{article.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.sourceChip}>
              <MaterialCommunityIcons name="open-in-new" size={11} color={reading.accent} />
              <Text style={styles.sourceText}>{article.source}</Text>
            </View>
            <Text style={styles.time}>{timeAgo(article.publishedAt)}</Text>
            <ShareArticleButton article={article} style={styles.share} />
          </View>

          {article.body?.trim() ? (
            <MarkdownBody text={article.body} />
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
              <MaterialCommunityIcons name="update" size={15} color={colors.breaking} />
              <Text style={styles.storyLinkText}>
                {story.isLive ? 'Amakuru akurikiranwa' : 'Amakuru yarangiye'}: {story.title} — reba ayabanje
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={reading.muted} />
            </Pressable>
          ) : null}

          {article.sourceUrl ? (
            <Pressable
              onPress={() => Linking.openURL(article.sourceUrl)}
              accessibilityRole="link"
              style={styles.sourceLink}
            >
              <MaterialCommunityIcons name="link-variant" size={15} color={reading.accent} />
              <Text style={styles.sourceLinkText}>Soma inkuru yuzuye kuri {article.source}</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // The reading page: light and paper-like, easy on the eyes (theme/reading.js).
  page: { flex: 1, backgroundColor: reading.page },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { ...typography.body, color: reading.text },
  imageWell: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.navy800, // behind the photo: keeps the white back button and logo readable
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: StyleSheet.absoluteFillObject, // fills the 16:9 frame on phones and the web alike
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
  labels: { position: 'absolute', bottom: spacing.sm, left: gutter, right: gutter },
  content: { paddingHorizontal: gutter, paddingTop: spacing.lg },
  category: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: reading.accent,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.screenTitle,
    fontSize: 21,
    lineHeight: 27,
    color: reading.heading,
    marginBottom: spacing.md,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: reading.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: reading.accentBorder,
    borderRadius: radius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginRight: spacing.sm,
  },
  sourceText: { ...typography.meta, color: reading.accent, marginLeft: 4, fontWeight: '500' },
  time: { ...typography.meta, color: reading.muted, marginRight: spacing.sm },
  share: { marginLeft: 'auto' },
  bodyMissing: {
    ...typography.body,
    fontSize: 13.5,
    fontStyle: 'italic',
    color: reading.muted,
    marginBottom: spacing.xl,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: reading.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  sourceLinkText: { ...typography.caption, color: reading.accent, marginLeft: spacing.sm, fontWeight: '600' },
  storyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(208,52,44,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(208,52,44,0.3)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  storyLinkText: {
    flex: 1,
    ...typography.caption,
    color: reading.heading,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
});
