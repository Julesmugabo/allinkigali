/**
 * NewsAdminEditorScreen.js — Rich text article editor.
 * Toolbar formatting, word count, auto-save draft, pre-publish checklist.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, Image,
  ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GradientBackground from '../../components/common/GradientBackground';
import { useNews } from '../../context/NewsContext';
import { getToken } from '../../services/apiClient';
import { pickAndUpload } from '../../utils/uploadPhoto';
import { showAlert } from '../../utils/showAlert';
import { colors, typography, spacing, radius, gutter } from '../../theme';

function renderInlineEditor(text, baseStyle) {
  const parts = [];
  const re = /(\*\*(.+?)\*\*|_(.+?)_)/g;
  let last = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    if (match[0].startsWith('**')) parts.push({ text: match[2], bold: true });
    else parts.push({ text: match[3], italic: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  if (parts.length === 1 && !parts[0].bold && !parts[0].italic) return null;
  return (
    <Text style={baseStyle}>
      {parts.map((p, i) => (
        <Text key={i} style={[p.bold && { fontWeight: '700' }, p.italic && { fontStyle: 'italic' }]}>{p.text}</Text>
      ))}
    </Text>
  );
}

function BodyPreview({ text }) {
  if (!text?.trim()) return null;
  const blocks = text.split('\n').reduce((acc, line) => {
    if (/^---+$/.test(line.trim())) { acc.push({ type: 'hr' }); return acc; }
    if (line.startsWith('## '))       { acc.push({ type: 'h2', text: line.slice(3) }); return acc; }
    if (line.startsWith('# '))        { acc.push({ type: 'h1', text: line.slice(2) }); return acc; }
    if (line.startsWith('> '))        { acc.push({ type: 'quote', text: line.slice(2) }); return acc; }
    if (/^[-*] /.test(line))          { acc.push({ type: 'bullet', text: line.slice(2) }); return acc; }
    if (line.trim() === '')           { acc.push({ type: 'blank' }); return acc; }
    acc.push({ type: 'para', text: line });
    return acc;
  }, []);

  const base = { fontSize: 14, lineHeight: 22, color: colors.textOnNavy };
  return (
    <View style={{ padding: gutter, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radius.md, marginTop: spacing.sm }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.blue300, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.sm }}>Preview</Text>
      {blocks.map((b, i) => {
        if (b.type === 'hr') return <View key={i} style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: spacing.sm }} />;
        if (b.type === 'blank') return <View key={i} style={{ height: 10 }} />;
        if (b.type === 'h1') return renderInlineEditor(b.text, { ...base, fontSize: 20, fontWeight: '800' }) || <Text key={i} style={{ ...base, fontSize: 20, fontWeight: '800' }}>{b.text}</Text>;
        if (b.type === 'h2') return renderInlineEditor(b.text, { ...base, fontSize: 17, fontWeight: '700' }) || <Text key={i} style={{ ...base, fontSize: 17, fontWeight: '700' }}>{b.text}</Text>;
        if (b.type === 'quote') return (
          <View key={i} style={{ borderLeftWidth: 3, borderLeftColor: colors.blue500, paddingLeft: spacing.md, marginVertical: 4 }}>
            {renderInlineEditor(b.text, { ...base, fontStyle: 'italic' }) || <Text style={{ ...base, fontStyle: 'italic' }}>{b.text}</Text>}
          </View>
        );
        if (b.type === 'bullet') return (
          <View key={i} style={{ flexDirection: 'row', paddingLeft: spacing.sm, marginVertical: 2 }}>
            <Text style={{ ...base, marginRight: spacing.xs }}>•</Text>
            {renderInlineEditor(b.text, base) || <Text style={base}>{b.text}</Text>}
          </View>
        );
        return renderInlineEditor(b.text, base) || <Text key={i} style={base}>{b.text}</Text>;
      })}
    </View>
  );
}

const CATEGORY_ICONS = {
  world: 'earth', africa: 'map', politics: 'gavel',
  business: 'chart-line', sport: 'trophy', science: 'dna',
};

const DESTINATIONS = [
  { key: 'draft',     label: 'Save Draft',          icon: 'content-save-outline',  color: 'rgba(255,255,255,0.12)' },
  { key: 'pending',   label: 'Submit for Approval', icon: 'send-outline',           color: 'rgba(55,138,221,0.35)' },
  { key: 'published', label: 'Publish Now',          icon: 'check-circle-outline',  color: '#1A7A4A' },
];

const TOOLBAR = [
  { key: 'bold',    icon: 'format-bold',          label: 'B',   wrap: ['**', '**'],  placeholder: 'bold text' },
  { key: 'italic',  icon: 'format-italic',         label: 'I',   wrap: ['_', '_'],    placeholder: 'italic text' },
  { key: 'h2',      icon: 'format-header-2',       label: 'H',   prefix: '## ',       placeholder: 'Heading' },
  { key: 'quote',   icon: 'format-quote-close',    label: '"',   prefix: '> ',        placeholder: 'Quote' },
  { key: 'bullet',  icon: 'format-list-bulleted',  label: '•',   prefix: '- ',        placeholder: 'List item' },
  { key: 'divider', icon: 'minus',                 label: '—',   insert: '\n---\n' },
];

const DRAFT_KEY = 'allinkigali-editor-draft';

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

// ── Checklist ────────────────────────────────────────────────────────────────

function Checklist({ title, category, source, body, imageUrl }) {
  const items = [
    { label: 'Headline written',    ok: title.trim().length > 0 },
    { label: 'Category chosen',     ok: !!category },
    { label: 'Article body written',ok: body.trim().length > 50 },
    { label: 'Source named',        ok: source.trim().length > 0 },
    { label: 'Cover image added',   ok: !!imageUrl },
  ];
  const allGood = items.every(i => i.ok);
  return (
    <View style={cl.wrap}>
      <Text style={cl.title}>{allGood ? '✅ Ready to publish' : 'Before you publish'}</Text>
      {items.map(item => (
        <View key={item.label} style={cl.row}>
          <MaterialCommunityIcons
            name={item.ok ? 'check-circle' : 'circle-outline'}
            size={16}
            color={item.ok ? '#60C080' : colors.textOnNavyFaint}
          />
          <Text style={[cl.label, !item.ok && cl.labelMissing]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function NewsAdminEditorScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { categories, stories, addArticle, updateArticle, getArticleById, addStory } = useNews();
  const bodyRef = useRef(null);
  // Use a ref so selection is never lost when toolbar tap briefly blurs the input
  const selectionRef = useRef({ start: 0, end: 0 });

  const editingId = route?.params?.articleId || null;
  const existing  = useMemo(() => editingId ? getArticleById(editingId) : null, [editingId, getArticleById]);

  const [title,       setTitle]       = useState(existing?.title      || '');
  const [category,    setCategory]    = useState(existing?.category   || categories[0]?.key || '');
  const [source,      setSource]      = useState(existing?.source     || '');
  const [sourceUrl,   setSourceUrl]   = useState(existing?.sourceUrl  || '');
  const [body,        setBody]        = useState(existing?.body       || '');
  const [imageUrl,    setImageUrl]    = useState(existing?.imageUrl   || null);
  const [isBreaking,  setIsBreaking]  = useState(Boolean(existing?.isBreaking));
  const [isFeatured,  setIsFeatured]  = useState(Boolean(existing?.isFeatured));
  const [isTrending,  setIsTrending]  = useState(Boolean(existing?.isTrending));
  const [labels,      setLabels]      = useState(existing?.labels     || []);
  const [storyId,     setStoryId]     = useState(existing?.storyId    || null);
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [destination, setDestination] = useState(existing?.status    || 'draft');
  const [errors,      setErrors]      = useState({});
  const [isSaving,    setIsSaving]    = useState(false);
  const [savedAt,     setSavedAt]     = useState(null);
  const [showChecklist, setShowChecklist] = useState(false);
  // bodySelection state drives UI only; selectionRef is always fresh for applyFormat
  const [bodySelection, setBodySelection] = useState({ start: 0, end: 0 });

  const liveStories = useMemo(() => stories.filter(s => s.isLive), [stories]);
  const words = useMemo(() => wordCount(body), [body]);

  // ── Auto-save draft ───────────────────────────────────────────────────────
  useEffect(() => {
    if (editingId) return; // don't auto-save edits of existing articles
    const t = setTimeout(async () => {
      if (!title && !body) return;
      try {
        await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ title, category, source, body, imageUrl }));
        setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch {}
    }, 30000);
    return () => clearTimeout(t);
  }, [title, category, source, body, imageUrl, editingId]);

  // restore auto-saved draft on first open (new article only)
  useEffect(() => {
    if (editingId) return;
    AsyncStorage.getItem(DRAFT_KEY).then(saved => {
      if (!saved) return;
      try {
        const d = JSON.parse(saved);
        if (d.title || d.body) {
          showAlert('Draft restored', 'Your unsaved draft has been restored.', [
            { text: 'Keep it', onPress: () => {
              if (d.title) setTitle(d.title);
              if (d.category) setCategory(d.category);
              if (d.source) setSource(d.source);
              if (d.body) setBody(d.body);
            }},
            { text: 'Start fresh', style: 'destructive', onPress: () => AsyncStorage.removeItem(DRAFT_KEY) },
          ]);
        }
      } catch {}
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Photo picker ──────────────────────────────────────────────────────────
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const pickPhoto = useCallback(async () => {
    try {
      setUploadingPhoto(true);
      const token = await getToken();
      const url = await pickAndUpload(token);
      if (url) setImageUrl(url);
    } catch (e) {
      showAlert('Photo upload failed', e.message || 'Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  }, []);

  // ── Toolbar formatting ────────────────────────────────────────────────────
  const applyFormat = useCallback((tool) => {
    const { start, end } = selectionRef.current;
    const selected = body.slice(start, end);

    let newBody = body;
    let newCursor = end;

    if (tool.insert) {
      newBody = body.slice(0, start) + tool.insert + body.slice(end);
      newCursor = start + tool.insert.length;
    } else if (tool.wrap) {
      const [open, close] = tool.wrap;
      if (selected) {
        // Toggle: if already wrapped, unwrap
        const before = body.slice(Math.max(0, start - open.length), start);
        const after = body.slice(end, end + close.length);
        if (before === open && after === close) {
          newBody = body.slice(0, start - open.length) + selected + body.slice(end + close.length);
          newCursor = start - open.length + selected.length;
        } else {
          newBody = body.slice(0, start) + open + selected + close + body.slice(end);
          newCursor = start + open.length + selected.length;
        }
      } else {
        const text = tool.placeholder;
        newBody = body.slice(0, start) + open + text + close + body.slice(end);
        newCursor = start + open.length + text.length;
      }
    } else if (tool.prefix) {
      const lineStart = body.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = body.indexOf('\n', start);
      const currentLine = body.slice(lineStart, lineEnd === -1 ? body.length : lineEnd);
      // Toggle: if line already has prefix, remove it
      if (currentLine.startsWith(tool.prefix)) {
        newBody = body.slice(0, lineStart) + currentLine.slice(tool.prefix.length) + body.slice(lineEnd === -1 ? body.length : lineEnd);
        newCursor = Math.max(lineStart, start - tool.prefix.length);
      } else {
        const before = start > 0 ? body.slice(0, start) : '';
        const needsNewline = before.length > 0 && !before.endsWith('\n');
        const prefix = (needsNewline ? '\n' : '') + tool.prefix;
        if (selected) {
          newBody = body.slice(0, start) + prefix + selected + body.slice(end);
          newCursor = start + prefix.length + selected.length;
        } else {
          const text = tool.placeholder;
          newBody = body.slice(0, start) + prefix + text + body.slice(end);
          newCursor = start + prefix.length + text.length;
        }
      }
    }

    setBody(newBody);
    setTimeout(() => {
      bodyRef.current?.focus();
      if (Platform.OS === 'web' && bodyRef.current) {
        try { bodyRef.current.setSelectionRange?.(newCursor, newCursor); } catch {}
      }
    }, 50);
  }, [body]);

  // ── Validate + save ───────────────────────────────────────────────────────
  const validate = useCallback(() => {
    const next = {};
    if (!title.trim())    next.title    = 'Headline is required.';
    if (!category)        next.category = 'Choose a category.';
    if (!source.trim())   next.source   = 'Name the source.';
    if (!body.trim())     next.body     = 'Write the article body.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [title, category, source, body]);

  const handleSave = useCallback(async () => {
    if (!validate()) { setShowChecklist(true); return; }
    setIsSaving(true);
    let resolvedStoryId = storyId;
    if (storyId === 'new') {
      if (!newStoryTitle.trim()) {
        setErrors({ story: 'Enter a story title.' });
        setIsSaving(false);
        return;
      }
      const story = await addStory(newStoryTitle.trim());
      if (!story) {
        setErrors({ story: 'Could not create story. Try again.' });
        setIsSaving(false);
        return;
      }
      resolvedStoryId = story.id;
    }
    const payload = {
      title: title.trim(), category,
      source: source.trim(), sourceUrl: sourceUrl.trim() || null,
      body: body.trim(), imageUrl: imageUrl || null,
      isBreaking, isFeatured, isTrending, labels,
      storyId: resolvedStoryId || null,
      status: destination,
      icon: CATEGORY_ICONS[category] || 'newspaper-variant-outline',
    };
    const result = editingId
      ? await updateArticle(editingId, payload)
      : await addArticle(payload);
    setIsSaving(false);
    if (!result) { setErrors({ title: 'Could not save. Please try again.' }); return; }
    AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
    navigation.goBack();
  }, [validate, title, category, source, sourceUrl, body, imageUrl, isBreaking, isFeatured,
      isTrending, labels, storyId, newStoryTitle, addStory, destination, editingId,
      updateArticle, addArticle, navigation]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        {/* ── Top bar ── */}
        <View style={[s.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={10}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.white} />
          </Pressable>
          <Text style={s.topBarTitle}>{editingId ? 'Edit article' : 'New article'}</Text>
          <View style={s.topBarRight}>
            {savedAt && <Text style={s.savedAt}>Saved {savedAt}</Text>}
            <Pressable onPress={() => setShowChecklist(v => !v)} style={s.checklistBtn}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={22} color={colors.blue300} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        >
          {/* ── Cover image ── */}
          <Pressable onPress={pickPhoto} style={s.coverWrap}>
            {imageUrl
              ? <>
                  <Image source={{ uri: imageUrl }} style={s.coverImg} resizeMode="cover" />
                  <Pressable onPress={() => setImageUrl(null)} style={s.coverRemove}>
                    <MaterialCommunityIcons name="close-circle" size={24} color={colors.white} />
                  </Pressable>
                </>
              : <View style={s.coverPlaceholder}>
                  {uploadingPhoto
                    ? <ActivityIndicator color={colors.blue300} />
                    : <>
                        <MaterialCommunityIcons name="image-plus" size={32} color={colors.blue300} />
                        <Text style={s.coverPlaceholderLabel}>Add cover image</Text>
                      </>
                  }
                </View>
            }
          </Pressable>

          <View style={s.form}>
            {/* ── Headline ── */}
            <TextInput
              style={s.headlineInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Write your headline…"
              placeholderTextColor="rgba(255,255,255,0.25)"
              multiline
            />
            {errors.title && <Text style={s.error}>{errors.title}</Text>}

            {/* ── Category chips ── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.categoryScroll}>
              {categories.map(c => (
                <Pressable
                  key={c.key}
                  onPress={() => setCategory(c.key)}
                  style={[s.catChip, category === c.key && s.catChipActive]}
                >
                  <MaterialCommunityIcons name={CATEGORY_ICONS[c.key] || 'tag'} size={13} color={category === c.key ? colors.white : colors.blue300} />
                  <Text style={[s.catChipLabel, category === c.key && s.catChipLabelActive]}>{c.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {errors.category && <Text style={s.error}>{errors.category}</Text>}

            {/* ── Source ── */}
            <View style={s.sourceRow}>
              <MaterialCommunityIcons name="newspaper-variant-outline" size={16} color={colors.blue300} style={{ marginRight: 6 }} />
              <TextInput
                style={s.sourceInput}
                value={source}
                onChangeText={setSource}
                placeholder="Source name (e.g. BBC News)"
                placeholderTextColor="rgba(255,255,255,0.25)"
              />
            </View>
            <View style={s.sourceRow}>
              <MaterialCommunityIcons name="link" size={16} color={colors.blue300} style={{ marginRight: 6 }} />
              <TextInput
                style={s.sourceInput}
                value={sourceUrl}
                onChangeText={setSourceUrl}
                placeholder="Source URL (optional)"
                placeholderTextColor="rgba(255,255,255,0.25)"
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
            {errors.source && <Text style={s.error}>{errors.source}</Text>}

            {/* ── Formatting toolbar ── */}
            <View style={s.toolbar}>
              {TOOLBAR.map(tool => (
                <Pressable
                  key={tool.key}
                  onPress={() => applyFormat(tool)}
                  onStartShouldSetResponder={() => true}
                  {...(Platform.OS === 'web' ? { onMouseDown: e => e.preventDefault() } : {})}
                  style={s.toolBtn}
                  hitSlop={6}
                >
                  <MaterialCommunityIcons name={tool.icon} size={18} color={colors.white} />
                  <Text style={s.toolLabel}>{tool.label}</Text>
                </Pressable>
              ))}
              <View style={{ flex: 1 }} />
              <Text style={s.wordCount}>{words} word{words !== 1 ? 's' : ''}</Text>
            </View>
            <Text style={s.toolbarHint}>Select text, then tap B to bold, I to italic</Text>

            {/* ── Body editor ── */}
            <TextInput
              ref={bodyRef}
              style={s.bodyInput}
              value={body}
              onChangeText={setBody}
              onSelectionChange={e => {
                selectionRef.current = e.nativeEvent.selection;
                setBodySelection(e.nativeEvent.selection);
              }}
              placeholder={'Start writing your article…\n\nTip: Use the toolbar above to format text.\n## for headings  **bold**  _italic_  > for quotes  - for bullets'}
              placeholderTextColor="rgba(255,255,255,0.2)"
              multiline
              textAlignVertical="top"
            />
            {errors.body && <Text style={s.error}>{errors.body}</Text>}

            {/* ── Live preview ── */}
            {body.trim().length > 0 && <BodyPreview text={body} />}

            {/* ── Flags ── */}
            <View style={s.flagsRow}>
              {[
                { key: 'breaking', label: '🔴 Breaking', val: isBreaking, set: setIsBreaking },
                { key: 'featured', label: '⭐ Featured', val: isFeatured, set: setIsFeatured },
                { key: 'trending', label: '🔥 Trending', val: isTrending, set: setIsTrending },
              ].map(f => (
                <Pressable key={f.key} onPress={() => f.set(v => !v)} style={[s.flagChip, f.val && s.flagChipActive]}>
                  <Text style={[s.flagLabel, f.val && s.flagLabelActive]}>{f.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* ── Live story ── */}
            {liveStories.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Link to live story</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                    <Pressable onPress={() => setStoryId(null)} style={[s.storyChip, !storyId && s.storyChipActive]}>
                      <Text style={[s.storyChipLabel, !storyId && s.storyChipLabelActive]}>None</Text>
                    </Pressable>
                    {liveStories.map(st => (
                      <Pressable key={st.id} onPress={() => setStoryId(st.id)} style={[s.storyChip, storyId === st.id && s.storyChipActive]}>
                        <Text style={[s.storyChipLabel, storyId === st.id && s.storyChipLabelActive]}>{st.title}</Text>
                      </Pressable>
                    ))}
                    <Pressable onPress={() => setStoryId('new')} style={[s.storyChip, storyId === 'new' && s.storyChipActive]}>
                      <Text style={[s.storyChipLabel, storyId === 'new' && s.storyChipLabelActive]}>+ New story</Text>
                    </Pressable>
                  </View>
                </ScrollView>
                {storyId === 'new' && (
                  <TextInput
                    style={[s.sourceInput, { marginTop: spacing.sm }]}
                    value={newStoryTitle}
                    onChangeText={setNewStoryTitle}
                    placeholder="Story title…"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                  />
                )}
                {errors.story && <Text style={s.error}>{errors.story}</Text>}
              </View>
            )}

            {/* ── Checklist ── */}
            {showChecklist && (
              <Checklist title={title} category={category} source={source} body={body} imageUrl={imageUrl} />
            )}

            {/* ── Publish destination ── */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Where to send it</Text>
              <View style={s.destRow}>
                {DESTINATIONS.map(d => (
                  <Pressable
                    key={d.key}
                    onPress={() => setDestination(d.key)}
                    style={[s.destBtn, { backgroundColor: d.color }, destination === d.key && s.destBtnActive]}
                  >
                    <MaterialCommunityIcons name={d.icon} size={18} color={colors.white} />
                    <Text style={s.destLabel}>{d.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* ── Sticky save button ── */}
        <View style={[s.saveBar, { paddingBottom: insets.bottom + spacing.sm }]}>
          <Pressable onPress={handleSave} disabled={isSaving} style={[s.saveBtn, isSaving && { opacity: 0.6 }]}>
            {isSaving
              ? <ActivityIndicator color={colors.white} />
              : <>
                  <MaterialCommunityIcons name={DESTINATIONS.find(d => d.key === destination)?.icon || 'check'} size={18} color={colors.white} />
                  <Text style={s.saveBtnLabel}>{DESTINATIONS.find(d => d.key === destination)?.label || 'Save'}</Text>
                </>
            }
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: gutter, paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(133,183,235,0.15)',
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  topBarTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.white },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  savedAt: { fontSize: 11, color: colors.textOnNavyFaint },
  checklistBtn: { padding: 4 },

  coverWrap: { width: '100%', aspectRatio: 16 / 9, backgroundColor: 'rgba(55,138,221,0.1)', marginBottom: spacing.md },
  coverImg: { width: '100%', height: '100%' },
  coverRemove: { position: 'absolute', top: spacing.sm, right: spacing.sm, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12 },
  coverPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  coverPlaceholderLabel: { fontSize: 13, color: colors.blue300 },

  form: { paddingHorizontal: gutter, paddingTop: spacing.md },

  headlineInput: {
    fontSize: 24, fontWeight: '800', color: colors.white,
    lineHeight: 32, marginBottom: spacing.md,
    minHeight: 64,
  },

  categoryScroll: { marginBottom: spacing.sm },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(133,183,235,0.3)', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: spacing.sm, paddingVertical: 6, marginRight: spacing.xs },
  catChipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  catChipLabel: { fontSize: 12, fontWeight: '600', color: colors.textOnNavy },
  catChipLabelActive: { color: colors.white },

  sourceRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(133,183,235,0.15)', paddingVertical: spacing.sm, marginBottom: 4 },
  sourceInput: { flex: 1, fontSize: 14, color: colors.white },

  toolbar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md, paddingHorizontal: spacing.xs,
    paddingVertical: 4, marginTop: spacing.sm,
    borderWidth: 1, borderColor: 'rgba(133,183,235,0.3)',
  },
  toolBtn: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 2 },
  toolLabel: { fontSize: 9, fontWeight: '700', color: colors.blue300, marginTop: 1 },
  toolbarHint: { fontSize: 11, color: colors.textOnNavyFaint, marginTop: 4, marginBottom: spacing.sm },
  wordCount: { fontSize: 11, color: colors.textOnNavyFaint, fontWeight: '600' },

  bodyInput: {
    fontSize: 16, color: colors.white, lineHeight: 26,
    minHeight: 320, textAlignVertical: 'top',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(133,183,235,0.1)',
    marginBottom: spacing.md,
  },

  flagsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  flagChip: { borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(133,183,235,0.25)', paddingHorizontal: spacing.md, paddingVertical: 6 },
  flagChipActive: { backgroundColor: 'rgba(133,183,235,0.2)', borderColor: colors.blue300 },
  flagLabel: { fontSize: 12, color: colors.textOnNavyFaint },
  flagLabelActive: { color: colors.white, fontWeight: '600' },

  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textOnNavyFaint, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.sm },

  storyChip: { borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(133,183,235,0.25)', paddingHorizontal: spacing.md, paddingVertical: 6 },
  storyChipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  storyChipLabel: { fontSize: 12, color: colors.textOnNavy },
  storyChipLabelActive: { color: colors.white, fontWeight: '600' },

  destRow: { gap: spacing.sm },
  destBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.md, padding: spacing.md, borderWidth: 2, borderColor: 'transparent' },
  destBtnActive: { borderColor: colors.white },
  destLabel: { fontSize: 14, fontWeight: '700', color: colors.white },

  saveBar: {
    paddingHorizontal: gutter, paddingTop: spacing.sm,
    backgroundColor: '#042C53',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(133,183,235,0.15)',
  },
  saveBtn: { backgroundColor: colors.blue500, borderRadius: radius.md, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  saveBtnLabel: { fontSize: 15, fontWeight: '700', color: colors.white },

  error: { fontSize: 12, color: '#f87171', marginTop: 2, marginBottom: spacing.sm },
});

const cl = StyleSheet.create({
  wrap: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.2)' },
  title: { fontSize: 13, fontWeight: '700', color: colors.white, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 6 },
  label: { fontSize: 13, color: colors.textOnNavy },
  labelMissing: { color: '#f87171' },
});
