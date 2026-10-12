/**
 * NewsArticles.js — Article list and detail editor for the News Admin Dashboard.
 *
 * Shows the article list with search and sort, approval/rejection controls,
 * multi-select archive, and a per-article drawer with new fields:
 * scheduled publish time, author/byline picker, and SEO metadata
 * (slug, meta description, OG image URL).
 */
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Switch } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { showAlert } from '../../../utils/showAlert';
import { spacing } from '../../../theme';
import {
  NEWS, SectionHeader, EmptyState, StatusBadge, ActionBtn, FilterBtn,
  alertMsg, fmtDate, s,
} from './NewsShared';
import { apiFetch } from '../../../services/apiClient';
import { normalise } from '../../../utils/format';

const FILTER_OPTS = [
  { key: 'all',       label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'drafts',    label: 'Drafts' },
  { key: 'pending',   label: 'Pending' },
  { key: 'archived',  label: 'Archived' },
];

export default function NewsArticles({ ctx }) {
  const {
    articles = [], categories = [], authors = [],
    deleteArticle, updateArticle, approveArticle, rejectArticle,
    archiveArticles, unarchiveArticle,
    navigation,
  } = ctx;

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortByViews, setSortByViews] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [expandedId, setExpandedId] = useState(null);
  const [seoEditing, setSeoEditing] = useState({});
  const [scheduling, setScheduling] = useState({});

  const categoryLabelFor = useCallback(
    key => categories.find(c => c.key === key)?.label || key,
    [categories]
  );

  const visible = useMemo(() => {
    const q = normalise(search);
    let base;
    if (filter === 'pending')   base = articles.filter(a => a.status === 'pending' && !a.isArchived);
    else if (filter === 'published') base = articles.filter(a => a.status === 'published' && !a.isArchived);
    else if (filter === 'drafts')    base = articles.filter(a => a.status === 'draft' && !a.isArchived);
    else if (filter === 'archived')  base = articles.filter(a => a.isArchived);
    else base = articles.filter(a => !a.isArchived);
    if (q) base = base.filter(a => normalise([a.title, a.source, categoryLabelFor(a.category)].join(' ')).includes(q));
    return sortByViews ? [...base].sort((a, b) => (b.views || 0) - (a.views || 0)) : base;
  }, [articles, filter, search, categoryLabelFor, sortByViews]);

  const toggleSelected = useCallback(id => {
    setSelectedIds(cur => { const n = new Set(cur); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const handleArchiveSelected = useCallback(() => {
    if (!selectedIds.size) return;
    archiveArticles(Array.from(selectedIds));
    setSelectedIds(new Set()); setSelectMode(false);
  }, [selectedIds, archiveArticles]);

  const saveSeo = useCallback(async (article) => {
    const { slug, metaDescription, ogImage } = seoEditing[article.id] || {};
    try {
      await apiFetch(`/news/articles/${article.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ slug, metaDescription, ogImage }),
      });
      alertMsg('Saved', 'SEO fields updated');
      setSeoEditing(prev => { const n = { ...prev }; delete n[article.id]; return n; });
    } catch (e) { alertMsg('Error', e.message); }
  }, [seoEditing]);

  const saveSchedule = useCallback(async (article) => {
    const { publishAt, authorId } = scheduling[article.id] || {};
    try {
      await apiFetch(`/news/articles/${article.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ publishAt: publishAt || null, authorId: authorId || null }),
      });
      alertMsg('Saved', 'Schedule / author updated');
      setScheduling(prev => { const n = { ...prev }; delete n[article.id]; return n; });
    } catch (e) { alertMsg('Error', e.message); }
  }, [scheduling]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <SectionHeader title="Articles" icon="newspaper-variant-outline">
        <ActionBtn label="New Article" icon="plus" onPress={() => navigation?.navigate('NewsAdminEditor')} color={NEWS.primary} />
      </SectionHeader>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 2 }}>
          {FILTER_OPTS.map(opt => (
            <FilterBtn key={opt.key} label={opt.label} active={filter === opt.key} onPress={() => setFilter(opt.key)} />
          ))}
        </View>
      </ScrollView>

      {/* Search + sort */}
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
        <TextInput
          style={[s.input, { flex: 1, marginBottom: 0 }]}
          placeholder="Search articles…"
          placeholderTextColor={NEWS.muted}
          value={search}
          onChangeText={setSearch}
        />
        <FilterBtn
          label="Views"
          icon={sortByViews ? 'eye-check' : 'eye-outline'}
          active={sortByViews}
          onPress={() => setSortByViews(v => !v)}
        />
      </View>

      {/* Select toolbar */}
      {filter === 'all' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          {selectMode ? (
            <>
              <Text style={{ fontSize: 13, color: NEWS.muted }}>{selectedIds.size} selected</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <FilterBtn label="Cancel" onPress={() => { setSelectMode(false); setSelectedIds(new Set()); }} />
                <ActionBtn label="Archive" icon="archive-arrow-down-outline" onPress={handleArchiveSelected} color={NEWS.warning} disabled={!selectedIds.size} />
              </View>
            </>
          ) : (
            <FilterBtn label="Select to archive" icon="checkbox-multiple-marked-outline" onPress={() => setSelectMode(true)} />
          )}
        </View>
      )}

      {visible.length === 0 ? (
        <EmptyState icon="newspaper-outline" text="No articles" sub="Try a different filter or create a new article" />
      ) : (
        <View style={s.panel}>
          {visible.map((article, i) => {
            const expanded = expandedId === article.id;
            const seo = seoEditing[article.id] || {};
            const sch = scheduling[article.id] || {};
            return (
              <View key={article.id} style={i === visible.length - 1 ? {} : { borderBottomWidth: 1, borderColor: NEWS.border }}>
                {/* Row */}
                <Pressable
                  style={[s.row, { borderBottomWidth: 0 }]}
                  onPress={() => selectMode ? toggleSelected(article.id) : setExpandedId(expanded ? null : article.id)}
                >
                  {selectMode && (
                    <MaterialCommunityIcons
                      name={selectedIds.has(article.id) ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={20} color={selectedIds.has(article.id) ? NEWS.primary : NEWS.muted}
                      style={{ marginRight: 8 }}
                    />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle} numberOfLines={2}>{article.title}</Text>
                    <Text style={s.rowMeta}>
                      {categoryLabelFor(article.category)} · {fmtDate(article.publishedAt)} · {article.views || 0} views
                    </Text>
                  </View>
                  <StatusBadge status={article.isArchived ? 'archived' : article.status} />
                  <MaterialCommunityIcons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={18} color={NEWS.muted} style={{ marginLeft: 6 }}
                  />
                </Pressable>

                {/* Expanded actions + SEO + scheduling */}
                {expanded && (
                  <View style={{ backgroundColor: '#F8F9FA', padding: spacing.md, gap: spacing.sm }}>
                    {/* Action buttons */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      <ActionBtn label="Edit" icon="pencil-outline" color={NEWS.primary}
                        onPress={() => navigation?.navigate('NewsAdminEditor', { articleId: article.id })} />
                      {article.status === 'pending' && (
                        <>
                          <ActionBtn label="Approve" icon="check" color={NEWS.success} onPress={() => approveArticle(article.id)} />
                          <ActionBtn label="Reject" icon="close" color={NEWS.danger} onPress={() => rejectArticle(article.id)} />
                        </>
                      )}
                      {article.isArchived ? (
                        <ActionBtn label="Restore" icon="restore" color={NEWS.teal} onPress={() => unarchiveArticle(article.id)} />
                      ) : (
                        <ActionBtn label="Archive" icon="archive-outline" color={NEWS.warning}
                          onPress={() => archiveArticles([article.id])} />
                      )}
                      <ActionBtn label="Delete" icon="trash-can-outline" color={NEWS.danger}
                        onPress={() => showAlert('Delete', `Delete "${article.title}"?`, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => deleteArticle(article.id) },
                        ])} />
                    </View>

                    {/* Schedule + Author */}
                    <Text style={[s.inputLabel, { marginTop: 8 }]}>Schedule & Author</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.inputLabel}>Publish At (ISO date)</Text>
                        <TextInput
                          style={[s.input, { marginBottom: 0 }]}
                          placeholder="2026-10-15T09:00:00"
                          placeholderTextColor={NEWS.muted}
                          value={sch.publishAt ?? (article.publishAt || '')}
                          onChangeText={v => setScheduling(p => ({ ...p, [article.id]: { ...p[article.id], publishAt: v } }))}
                        />
                      </View>
                    </View>
                    <View>
                      <Text style={s.inputLabel}>Author</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          {authors.filter(a => a.is_active).map(au => (
                            <Pressable
                              key={au.id}
                              style={[s.filterBtn, (sch.authorId ?? article.authorId) === au.id && { backgroundColor: NEWS.primaryBg, borderColor: NEWS.primary }]}
                              onPress={() => setScheduling(p => ({ ...p, [article.id]: { ...p[article.id], authorId: au.id } }))}
                            >
                              <Text style={[s.filterBtnLabel, (sch.authorId ?? article.authorId) === au.id && { color: NEWS.primary }]}>
                                {au.name}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                    <ActionBtn label="Save Schedule/Author" icon="content-save-outline" color={NEWS.teal}
                      onPress={() => saveSchedule(article)} />

                    {/* SEO */}
                    <Text style={[s.inputLabel, { marginTop: 8 }]}>SEO Metadata</Text>
                    <Text style={s.inputLabel}>URL Slug</Text>
                    <TextInput
                      style={[s.input]}
                      placeholder="article-url-slug"
                      placeholderTextColor={NEWS.muted}
                      value={seo.slug ?? (article.slug || '')}
                      onChangeText={v => setSeoEditing(p => ({ ...p, [article.id]: { ...p[article.id], slug: v } }))}
                    />
                    <Text style={s.inputLabel}>Meta Description</Text>
                    <TextInput
                      style={[s.input, { height: 72, textAlignVertical: 'top' }]}
                      placeholder="Short description for search engines (max 160 chars)"
                      placeholderTextColor={NEWS.muted}
                      multiline
                      value={seo.metaDescription ?? (article.metaDescription || '')}
                      onChangeText={v => setSeoEditing(p => ({ ...p, [article.id]: { ...p[article.id], metaDescription: v } }))}
                    />
                    <Text style={s.inputLabel}>OG Image URL</Text>
                    <TextInput
                      style={s.input}
                      placeholder="https://…/og-image.jpg"
                      placeholderTextColor={NEWS.muted}
                      value={seo.ogImage ?? (article.ogImage || '')}
                      onChangeText={v => setSeoEditing(p => ({ ...p, [article.id]: { ...p[article.id], ogImage: v } }))}
                    />
                    <ActionBtn label="Save SEO" icon="content-save-outline" color={NEWS.success}
                      onPress={() => saveSeo(article)} />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
