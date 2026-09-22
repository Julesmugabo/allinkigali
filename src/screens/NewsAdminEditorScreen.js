/**
 * NewsAdminEditorScreen.js — Kwandika/guhindura inkuru (news editor).
 *
 * Create mode when opened with no params, edit mode with { articleId }.
 * The three destinations from the mockup are kept: publish now, save as a
 * draft, or submit for approval (which lands in the dashboard's Pending
 * queue). Same form conventions as SalesPartnerForm.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import GradientBackground from '../components/common/GradientBackground';
import TextField from '../components/common/TextField';
import PrimaryButton from '../components/common/PrimaryButton';
import EmptyState from '../components/common/EmptyState';

import { useNews } from '../context/NewsContext';
import { colors, typography, spacing, radius, gutter } from '../theme';

// A thumbnail icon per category so the editor stays short — the feed cards
// need an icon, but asking an editor to pick one is friction they don't need.
const CATEGORY_ICONS = {
  world: 'earth',
  africa: 'map',
  politics: 'gavel',
  business: 'chart-line',
  sport: 'trophy',
  science: 'dna',
};

const DESTINATIONS = [
  { key: 'published', label: 'Publish now', icon: 'check-circle-outline' },
  { key: 'draft', label: 'Save as draft', icon: 'content-save-outline' },
  { key: 'pending', label: 'Submit for approval', icon: 'send-outline' },
];

export default function NewsAdminEditorScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { categories, addArticle, updateArticle, getArticleById } = useNews();

  const editingId = route?.params?.articleId || null;
  const existing = useMemo(() => (editingId ? getArticleById(editingId) : null), [editingId, getArticleById]);

  const [title, setTitle] = useState(existing?.title || '');
  const [category, setCategory] = useState(existing?.category || categories[0]?.key || '');
  const [source, setSource] = useState(existing?.source || '');
  const [sourceUrl, setSourceUrl] = useState(existing?.sourceUrl || '');
  const [body, setBody] = useState(existing?.body || '');
  const [imageUrl, setImageUrl] = useState(existing?.imageUrl || null);
  const [isBreaking, setIsBreaking] = useState(Boolean(existing?.isBreaking));
  const [destination, setDestination] = useState(existing?.status || 'published');
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const pickPhoto = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Ntibyakunze', 'Dukeneye uruhushya rwo kubona amafoto yawe.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [16, 9],
    });

    if (!result.canceled && result.assets?.length) {
      setImageUrl(result.assets[0].uri);
    }
  }, []);

  const validate = useCallback(() => {
    const next = {};
    if (!title.trim()) next.title = 'Write a headline.';
    if (!category) next.category = 'Pick a category.';
    if (!source.trim()) next.source = 'Name the source (e.g. BBC News).';
    if (!body.trim()) next.body = 'Write the article.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [title, category, source, body]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setIsSaving(true);

    const payload = {
      title: title.trim(),
      category,
      source: source.trim(),
      sourceUrl: sourceUrl.trim() || null,
      body: body.trim(),
      imageUrl: imageUrl || null,
      isBreaking,
      status: destination,
      icon: CATEGORY_ICONS[category] || 'newspaper-variant-outline',
    };

    // addArticle/updateArticle now write to our own backend and resolve to
    // null on failure (a rejected request, a dropped connection, ...)
    // rather than throwing — must be awaited and checked, or a failed save
    // would silently navigate back as if it had worked.
    const result = editingId ? await updateArticle(editingId, payload) : await addArticle(payload);
    setIsSaving(false);

    if (!result) {
      setErrors({ title: 'Ntibyashobotse kubika. Gerageza nanone.' });
      return;
    }

    navigation.goBack();
  }, [validate, title, category, source, sourceUrl, body, imageUrl, isBreaking, destination, editingId, updateArticle, addArticle, navigation]);

  if (editingId && !existing) {
    return (
      <GradientBackground>
        <View style={styles.emptyWrap}>
          <EmptyState tone="dark" icon="alert-circle-outline" title="Article not found" />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.huge },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.backButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textOnNavy} />
            </Pressable>
            <Text style={styles.title}>{editingId ? 'Edit article' : 'New article'}</Text>
          </View>

          <Pressable onPress={pickPhoto} accessibilityRole="button" accessibilityLabel="Shyiraho ifoto" style={styles.photoPicker}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.photo} resizeMode="cover" />
            ) : (
              <>
                <MaterialCommunityIcons name="camera-plus-outline" size={26} color={colors.blue300} />
                <Text style={styles.photoLabel}>Shyiraho ifoto y'inkuru (si ngombwa)</Text>
              </>
            )}
          </Pressable>

          <TextField
            label="Headline"
            value={title}
            onChangeText={setTitle}
            placeholder="Write the headline in Kinyarwanda..."
            icon="format-title"
            error={errors.title}
            multiline
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.chipRow}>
            {categories.map((option) => {
              const active = category === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setCategory(option.key)}
                  accessibilityRole="button"
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}

          <TextField
            label="Source"
            value={source}
            onChangeText={setSource}
            placeholder="BBC News, CNN, Reuters..."
            icon="link-variant"
            error={errors.source}
          />

          <TextField
            label="Source link (optional)"
            value={sourceUrl}
            onChangeText={setSourceUrl}
            placeholder="https://..."
            icon="web"
            autoCapitalize="none"
          />

          <TextField
            label="Full article"
            value={body}
            onChangeText={setBody}
            placeholder="Write the full story here in Kinyarwanda..."
            error={errors.body}
            multiline
          />

          <Pressable
            onPress={() => setIsBreaking((v) => !v)}
            accessibilityRole="button"
            style={styles.breakingRow}
          >
            <MaterialCommunityIcons
              name={isBreaking ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={20}
              color={isBreaking ? colors.breaking : colors.blue300}
            />
            <Text style={styles.breakingLabel}>Mark as breaking news</Text>
          </Pressable>

          <Text style={styles.label}>Destination</Text>
          <View style={styles.destinationList}>
            {DESTINATIONS.map((option) => {
              const active = destination === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setDestination(option.key)}
                  accessibilityRole="button"
                  style={[styles.destination, active && styles.destinationActive]}
                >
                  <MaterialCommunityIcons
                    name={option.icon}
                    size={16}
                    color={active ? colors.white : colors.blue300}
                  />
                  <Text style={[styles.destinationLabel, active && styles.destinationLabelActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <PrimaryButton
            label={editingId ? 'Save changes' : 'Save article'}
            icon="check"
            onPress={handleSave}
            loading={isSaving}
            style={styles.submit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: gutter },
  emptyWrap: { flex: 1, justifyContent: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.white, letterSpacing: -0.3 },
  photoPicker: {
    height: 140,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.3)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  photoLabel: { ...typography.caption, color: colors.blue300, marginTop: spacing.sm },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.blue300,
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.3)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 34,
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  chipLabel: { fontSize: 12.5, color: colors.textOnNavy },
  chipLabelActive: { color: colors.white, fontWeight: '600' },
  errorText: { ...typography.caption, color: colors.breaking, marginBottom: spacing.md },
  breakingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  breakingLabel: { ...typography.body, fontSize: 13.5, color: colors.textOnNavy, marginLeft: spacing.sm },
  destinationList: { marginBottom: spacing.xl },
  destination: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.3)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    marginBottom: spacing.sm,
  },
  destinationActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  destinationLabel: { ...typography.body, fontSize: 13.5, color: colors.textOnNavy, marginLeft: spacing.sm },
  destinationLabelActive: { color: colors.white, fontWeight: '600' },
  submit: { marginBottom: spacing.xl },
});
