/**
 * ArticleDetailWide.js — desktop reading layout: a 700px text column (about
 * 70 characters a line, the comfortable measure) beside a 300px rail of
 * trending stories and an ad, with the hero photo capped at 420px instead of
 * filling the screen. Only rendered from ArticleDetailScreen.web.js once the
 * viewport is wide — see useIsWideWeb.
 */
import React, { useMemo } from 'react';
import { View, Text, Image, ScrollView, Pressable, Linking, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import GradientBackground from '../../components/common/GradientBackground';
import WebContainer from '../../web/layout/WebContainer';
import ArticleLabels from '../../components/news/ArticleLabels';
import MarkdownBody from '../../components/news/MarkdownBody';
import AdBox from '../../components/news/AdBox';
import { useNews } from '../../context/NewsContext';
import { useAds } from '../../context/AdsContext';
import { timeAgo } from '../../utils/date';
import { colors, typography, spacing, radius } from '../../theme';

export default function ArticleDetailWide({ route, navigation }) {
  const { getArticleById, categories, getStoryById, incrementArticleView, getFeed } = useNews();
  const { getAdAfter } = useAds();
  const article = getArticleById(route.params?.id);

  const categoryLabel = article ? categories.find((c) => c.key === article.category)?.label || '' : '';
  const story = article?.storyId ? getStoryById(article.storyId) : null;

  // Same trending source as the feed's right rail, minus the story being read.
  const trending = useMemo(
    () => getFeed('all').trending.filter((a) => a.id !== article?.id).slice(0, 5),
    [getFeed, article?.id]
  );
  const ad = article ? getAdAfter(article.id) : null;

  const openArticle = (a) => {
    incrementArticleView(a.id);
    navigation.push('ArticleDetail', { id: a.id });
  };

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <WebContainer>
          <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={colors.blue300} />
            <Text style={styles.backText}>Subira inyuma</Text>
          </Pressable>

          <View style={styles.columns}>
            <View style={styles.main}>
              {categoryLabel ? <Text style={styles.category}>{categoryLabel.toUpperCase()}</Text> : null}
              <Text style={styles.title}>{article.title}</Text>

              <View style={styles.metaRow}>
                <View style={styles.sourceChip}>
                  <MaterialCommunityIcons name="open-in-new" size={12} color={colors.blue300} />
                  <Text style={styles.sourceText}>{article.source}</Text>
                </View>
                <Text style={styles.time}>{timeAgo(article.publishedAt)}</Text>
              </View>

              <View style={styles.imageWell}>
                {article.imageUrl ? (
                  // "cover" inside a capped box: fills the frame, crops the edges
                  // instead of ever growing taller than 420px.
                  <Image source={{ uri: article.imageUrl }} style={styles.image} resizeMode="cover" />
                ) : (
                  <MaterialCommunityIcons name="newspaper-variant-outline" size={64} color="rgba(133,183,235,0.2)" />
                )}
                <ArticleLabels article={article} style={styles.labels} />
              </View>

              {article.body?.trim() ? (
                <MarkdownBody text={article.body} large />
              ) : (
                <Text style={styles.bodyMissing}>Iyi nkuru ntabwo ifite umwandiko wuzuye kugeza ubu.</Text>
              )}

              {story ? (
                <Pressable
                  onPress={() => navigation.navigate('Story', { storyId: story.id })}
                  accessibilityRole="button"
                  style={styles.storyLink}
                >
                  <MaterialCommunityIcons name="update" size={16} color={colors.blue300} />
                  <Text style={styles.linkText}>
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
                  <MaterialCommunityIcons name="link-variant" size={16} color={colors.blue300} />
                  <Text style={styles.linkText}>Soma inkuru yuzuye kuri {article.source}</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.rail}>
              {trending.length ? (
                <>
                  <Text style={styles.railTitle}>BISOMWA CYANE</Text>
                  {trending.map((a, i) => (
                    <Pressable key={a.id} onPress={() => openArticle(a)} style={styles.trendingRow}>
                      <Text style={styles.trendingRank}>{i + 1}</Text>
                      <Text style={styles.trendingTitle} numberOfLines={3}>
                        {a.title}
                      </Text>
                    </Pressable>
                  ))}
                </>
              ) : null}
              {ad ? <AdBox ad={ad} style={styles.adSpacing} /> : null}
            </View>
          </View>
        </WebContainer>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { ...typography.body, color: colors.textOnNavy },
  scroll: { paddingTop: spacing.xl, paddingBottom: spacing.huge },

  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: spacing.lg },
  backText: { ...typography.body, fontSize: 14, fontWeight: '600', color: colors.blue300, marginLeft: 6 },

  columns: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 48 },
  main: { width: '100%', maxWidth: 700, flexShrink: 1 },
  rail: { width: 300 },

  category: { ...typography.caption, fontWeight: '700', letterSpacing: 0.6, color: colors.blue500, marginBottom: spacing.sm },
  title: { ...typography.screenTitle, fontSize: 38, lineHeight: 46, color: colors.white, marginBottom: spacing.md },
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

  imageWell: {
    width: '100%',
    height: 420,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(2,28,54,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  image: { width: '100%', height: '100%' },
  labels: { position: 'absolute', bottom: spacing.sm, left: spacing.md, right: spacing.md },

  bodyMissing: { ...typography.body, fontSize: 15, fontStyle: 'italic', color: colors.textOnNavyFaint, marginBottom: spacing.xl },
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
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(55,138,221,0.16)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  linkText: { flex: 1, ...typography.caption, color: colors.blue300, marginLeft: spacing.sm, fontWeight: '600' },

  railTitle: { ...typography.sectionTitle, color: colors.textOnNavyFaint, marginBottom: spacing.md },
  trendingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(133,183,235,0.2)',
  },
  trendingRank: { ...typography.sectionTitle, width: 22, color: colors.blue500, fontSize: 15 },
  trendingTitle: { flex: 1, ...typography.body, fontSize: 14, lineHeight: 19, color: colors.textOnNavy },
  adSpacing: { marginTop: spacing.lg },
});
