/**
 * NewsAuthors.js — Author / byline management for the News Admin Dashboard.
 *
 * Create and manage the list of authors (reporters, editors, contributors).
 * Authors can be assigned to articles from the Articles section.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { showAlert } from '../../../utils/showAlert';
import { spacing } from '../../../theme';
import { NEWS, SectionHeader, EmptyState, ActionBtn, FilterBtn, StatusBadge, alertMsg, s } from './NewsShared';
import { apiFetch } from '../../../services/apiClient';

const ROLES = ['reporter', 'editor', 'contributor'];
const EMPTY_FORM = { name: '', bio: '', email: '', role: 'reporter', avatarUrl: '' };

export default function NewsAuthors({ ctx }) {
  const { authors = [], reloadAuthors } = ctx;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function saveAuthor() {
    if (!form.name.trim()) return alertMsg('Error', 'Name is required');
    setSaving(true);
    try {
      await apiFetch('/news/authors', { method: 'POST', body: JSON.stringify(form) });
      setForm(EMPTY_FORM); setShowForm(false);
      if (reloadAuthors) reloadAuthors();
    } catch (e) { alertMsg('Error', e.message); }
    setSaving(false);
  }

  async function deactivate(author) {
    showAlert('Remove author', `Deactivate "${author.name}"? They won't appear in the author picker.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Deactivate', style: 'destructive', onPress: async () => {
        try {
          await apiFetch(`/news/authors/${author.id}`, { method: 'DELETE' });
          if (reloadAuthors) reloadAuthors();
        } catch (e) { alertMsg('Error', e.message); }
      }},
    ]);
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <SectionHeader title="Authors & Bylines" icon="account-multiple-outline">
        <ActionBtn label="Add Author" icon="plus" color={NEWS.primary} onPress={() => setShowForm(v => !v)} />
      </SectionHeader>

      {showForm && (
        <View style={[s.panel, { padding: spacing.md, marginBottom: spacing.lg }]}>
          <Text style={[s.sectionTitle, { marginBottom: spacing.md }]}>New Author</Text>
          {[
            ['name', 'Full Name *'],
            ['bio', 'Short Bio'],
            ['email', 'Email'],
            ['avatarUrl', 'Avatar URL'],
          ].map(([field, label]) => (
            <View key={field}>
              <Text style={s.inputLabel}>{label}</Text>
              <TextInput
                style={s.input}
                placeholder={label}
                placeholderTextColor={NEWS.muted}
                value={form[field]}
                onChangeText={v => setForm(p => ({ ...p, [field]: v }))}
              />
            </View>
          ))}
          <Text style={s.inputLabel}>Role</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.md }}>
            {ROLES.map(r => (
              <Pressable
                key={r}
                style={[s.filterBtn, form.role === r && { backgroundColor: NEWS.primaryBg, borderColor: NEWS.primary }]}
                onPress={() => setForm(p => ({ ...p, role: r }))}
              >
                <Text style={[s.filterBtnLabel, form.role === r && { color: NEWS.primary }]}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <ActionBtn label={saving ? 'Saving…' : 'Save'} icon="content-save-outline" color={NEWS.success} onPress={saveAuthor} disabled={saving} />
            <ActionBtn label="Cancel" color={NEWS.muted} onPress={() => { setShowForm(false); setForm(EMPTY_FORM); }} />
          </View>
        </View>
      )}

      {authors.length === 0 ? (
        <EmptyState icon="account-outline" text="No authors yet" sub="Add authors to assign bylines to articles" />
      ) : (
        <View style={s.panel}>
          {authors.map((au, i) => (
            <View key={au.id} style={[s.row, i === authors.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: NEWS.primaryBg, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: NEWS.primary }}>
                  {(au.name || '?')[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{au.name}</Text>
                <Text style={s.rowMeta}>{au.role}{au.email ? ` · ${au.email}` : ''}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <StatusBadge status={au.is_active ? 'active' : 'archived'} />
                {au.is_active && (
                  <Pressable style={{ padding: 4 }} onPress={() => deactivate(au)}>
                    <MaterialCommunityIcons name="account-remove-outline" size={16} color={NEWS.danger} />
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
