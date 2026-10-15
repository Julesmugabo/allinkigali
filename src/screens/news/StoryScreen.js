/**
 * StoryScreen.js — Amakuru akurikiranwa (a live story's update timeline).
 *
 * Reached from the hero card or an article's detail screen when that
 * article belongs to a story (admin-grouped, e.g. "Intambara muri Iran").
 * Lists every published update in that story, newest first — the same
 * "choose a previous update" browsing the News admin asked for.
 */
import React, { useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../../components/common/GradientBackground';
import NewsListItem from '../../components/news/NewsListItem';
import EmptyState from '../../components/common/EmptyState';

import { useNews } from '../../context/NewsContext';
import { colors, typography, spacing, radius, gutter } from '../../theme';
import AppTopBar from '../../components/common/AppTopBar';

export default function StoryScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { getStoryById, getArticlesForStory, incrementArticleView } = useNews();

  const storyId = route.params?.storyId;
  const story = getStoryById(storyId);
  const updates = getArticlesForStory(storyId);

  const handleArticlePress = useCallback(
    (article) => {
      incrementArticleView(article.id);
      navigation.navigate('ArticleDetail', { id: article.id });
    },
    [incrementArticleView, navigation]
  );

  return (
    <GradientBackground>
      <AppTopBar variant="slim" style={{ paddingHorizontal: gutter, marginTop: spacing.xs }} />
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerText}>
          {story?.isLive ? (
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveLabel}>AMAKURU AKURIKIRANWA</Text>
            </View>
          ) : (
            <Text style={styles.liveLabel}>AMAKURU YARANGIYE</Text>
          )}
          <Text style={styles.title} numberOfLines={2}>
            {story?.title || 'Iki kiganiro ntikibonetse'}
          </Text>
        </View>
      </View>

      <FlatList
        data={updates}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NewsListItem article={item} onPress={handleArticlePress} />}
        ListEmptyComponent={
          <EmptyState
            icon="update"
            title="Nta makuru ari muri iki kiganiro"
            message="Amakuru mashya azagaragara hano uko yasohotse."
            style={{ marginTop: spacing.huge }}
          />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: gutter,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerText: { flex: 1, paddingTop: 4 },
  liveRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.breaking,
    marginRight: spacing.xs,
  },
  liveLabel: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.breaking,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.screenTitle,
    fontSize: 19,
    lineHeight: 24,
    color: colors.white,
  },
  content: {
    paddingHorizontal: gutter,
    paddingBottom: spacing.xl,
  },
});
