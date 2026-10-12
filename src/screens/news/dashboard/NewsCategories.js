/**
 * NewsCategories.js — Category management for the News Admin Dashboard.
 *
 * Lets the admin add, rename, and delete categories. Deletion is blocked
 * by the backend if any articles still use the category.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { showAlert } from '../../../utils/showAlert';
import { colors, spacing, radius } from '../../../theme';
import { NEWS, SectionHeader, EmptyState, ActionBtn, s } from './NewsShared';

export default function NewsCategories({ ctx }) {
  const { articles = [], categories = [], addCategory, updateCategory, deleteCategory } = ctx;

  const [newCategory, setNewCategory] = useState('');
  const [renamingKey, setRenamingKey] = useState(null);
  const [renameText, setRenameText] = useState('');

  const categoryCounts = useMemo(() => {
    const counts = new Map();
    articles.forEach(a => counts.set(a.category, (counts.get(a.category) || 0) + 1));
    return categories.map(c => ({ ...c, count: counts.get(c.key) || 0 }));
  }, [categories, articles]);

  const handleAdd = useCallback(() => {
    const label = newCategory.trim();
    if (!label) return;
    addCategory(label);
    setNewCategory('');
  }, [newCategory, addCategory]);

  const handleDelete = useCallback(async (category) => {
    const removed = await deleteCategory(category.key);
    if (!removed) {
      showAlert('Category in use', `"${category.label}" still has articles. Move or delete those first.`);
    }
  }, [deleteCategory]);

  const saveRename = useCallback(() => {
    const label = renameText.trim();
    if (label) updateCategory(renamingKey, { label });
    setRenamingKey(null);
  }, [renamingKey, renameText, updateCategory]);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionHeader title="Categories" icon="shape-outline">
        <ActionBtn label="Add Category" icon="plus" onPress={handleAdd} color={NEWS.primary} />
      </SectionHeader>

      {/* Add form */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
        <TextInput
          style={[s.input, { flex: 1, marginBottom: 0 }]}
          placeholder="New category name"
          placeholderTextColor={NEWS.muted}
          value={newCategory}
          onChangeText={setNewCategory}
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

      {categoryCounts.length === 0 ? (
        <EmptyState icon="shape-outline" text="No categories yet" sub="Add categories to organise articles" />
      ) : (
        <View style={s.panel}>
          {categoryCounts.map((cat, i) => (
            <View key={cat.key} style={[s.row, i === categoryCounts.length - 1 && { borderBottomWidth: 0 }]}>
              {renamingKey === cat.key ? (
                <>
                  <TextInput
                    style={[s.input, { flex: 1, marginBottom: 0 }]}
                    value={renameText}
                    onChangeText={setRenameText}
                    onSubmitEditing={saveRename}
                    autoFocus
                  />
                  <Pressable style={{ padding: 8 }} onPress={saveRename}>
                    <MaterialCommunityIcons name="check" size={18} color={NEWS.success} />
                  </Pressable>
                  <Pressable style={{ padding: 8 }} onPress={() => setRenamingKey(null)}>
                    <MaterialCommunityIcons name="close" size={18} color={NEWS.muted} />
                  </Pressable>
                </>
              ) : (
                <>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle}>{cat.label}</Text>
                    <Text style={s.rowMeta}>{cat.count} article{cat.count !== 1 ? 's' : ''}</Text>
                  </View>
                  <Pressable
                    style={{ padding: 8 }}
                    onPress={() => { setRenamingKey(cat.key); setRenameText(cat.label); }}
                  >
                    <MaterialCommunityIcons name="pencil-outline" size={16} color={NEWS.primary} />
                  </Pressable>
                  <Pressable style={{ padding: 8 }} onPress={() => handleDelete(cat)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={16} color={NEWS.danger} />
                  </Pressable>
                </>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
