/**
 * NewsStories.js — Live-story management for the News Admin Dashboard.
 *
 * Create, toggle live/ended, and delete story threads. Each story groups
 * related articles in the reader's News tab so they appear as a developing
 * coverage thread rather than separate items.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { showAlert } from '../../../utils/showAlert';
import { spacing } from '../../../theme';
import { NEWS, SectionHeader, EmptyState, ActionBtn, StatusBadge, s, fmtDate } from './NewsShared';

export default function NewsStories({ ctx }) {
  const { articles = [], stories = [], addStory, updateStory, deleteStory } = ctx;

  const [newStoryTitle, setNewStoryTitle] = useState('');

  const storyCounts = useMemo(() => {
    const counts = new Map();
    articles.forEach(a => { if (a.storyId) counts.set(a.storyId, (counts.get(a.storyId) || 0) + 1); });
    return stories.map(s => ({ ...s, count: counts.get(s.id) || 0 }));
  }, [stories, articles]);

  const handleAdd = useCallback(() => {
    const title = newStoryTitle.trim();
    if (!title) return;
    addStory(title);
    setNewStoryTitle('');
  }, [newStoryTitle, addStory]);

  const handleDelete = useCallback((story) => {
    showAlert(
      'Delete story',
      `Delete "${story.title}"? Its articles stay, they just stop being grouped.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteStory(story.id) },
      ]
    );
  }, [deleteStory]);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionHeader title="Live Stories" icon="broadcast">
        <ActionBtn label="New Story" icon="plus" onPress={handleAdd} color={NEWS.primary} />
      </SectionHeader>

      {/* Add form */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
        <TextInput
          style={[s.input, { flex: 1, marginBottom: 0 }]}
          placeholder="Story headline, e.g. Intambara muri Burengerazuba"
          placeholderTextColor={NEWS.muted}
          value={newStoryTitle}
          onChangeText={setNewStoryTitle}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable
          style={{ backgroundColor: NEWS.primary, borderRadius: 8, padding: 12 }}
          onPress={handleAdd}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {storyCounts.length === 0 ? (
        <EmptyState
          icon="update"
          text="No live stories yet"
          sub="Stories group articles on an ongoing event into a developing-coverage thread"
        />
      ) : (
        <View style={s.panel}>
          {storyCounts.map((story, i) => (
            <View key={story.id} style={[s.row, i === storyCounts.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {story.isLive && (
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: NEWS.danger }} />
                  )}
                  <Text style={s.rowTitle} numberOfLines={2}>{story.title}</Text>
                </View>
                <Text style={s.rowMeta}>
                  {story.count} update{story.count !== 1 ? 's' : ''} · {fmtDate(story.createdAt)}
                </Text>
              </View>
              <StatusBadge status={story.isLive ? 'active' : 'ended'} />
              <Pressable
                style={{ padding: 8 }}
                onPress={() => updateStory(story.id, { isLive: !story.isLive })}
              >
                <MaterialCommunityIcons
                  name={story.isLive ? 'stop-circle-outline' : 'play-circle-outline'}
                  size={18}
                  color={story.isLive ? NEWS.danger : NEWS.success}
                />
              </Pressable>
              <Pressable style={{ padding: 8 }} onPress={() => handleDelete(story)}>
                <MaterialCommunityIcons name="trash-can-outline" size={16} color={NEWS.danger} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
