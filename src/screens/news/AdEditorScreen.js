/**
 * AdEditorScreen.js — Kwandika itangazo (ad create/edit).
 *
 * Create mode when opened with no params, edit mode with { adId }. The News
 * admin picks a type (photo or video), picks the media itself from their
 * device, and picks which published article the ad should appear right
 * after in the real feed — anchoring to an article id rather than a raw
 * position so placement survives articles being added or archived later.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, StyleSheet } from 'react-native';
import { showAlert } from '../../utils/showAlert';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';

import GradientBackground from '../../components/common/GradientBackground';
import PrimaryButton from '../../components/common/PrimaryButton';
import EmptyState from '../../components/common/EmptyState';

import { useNews } from '../../context/NewsContext';
import { useAds } from '../../context/AdsContext';
import { colors, typography, spacing, radius, gutter } from '../../theme';

const TYPES = [
  { key: 'photo', label: 'Ifoto', icon: 'image-outline' },
  { key: 'video', label: 'Videwo', icon: 'play-circle-outline' },
];

export default function AdEditorScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { articles } = useNews();
  const { addAd, updateAd, getAdById } = useAds();

  const editingId = route?.params?.adId || null;
  const existing = useMemo(() => (editingId ? getAdById(editingId) : null), [editingId, getAdById]);

  const [type, setType] = useState(existing?.type || 'photo');
  const [mediaUri, setMediaUri] = useState(existing?.mediaUri || null);
  const [afterArticleId, setAfterArticleId] = useState(existing?.afterArticleId || null);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Only articles a reader can actually scroll past today — anchoring to a
  // draft, pending, rejected or archived article would place the ad
  // somewhere it can never actually render.
  const eligibleArticles = useMemo(
    () => articles.filter((a) => a.status === 'published' && !a.isArchived),
    [articles]
  );

  const pickMedia = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('Ntibyakunze', 'Dukeneye uruhushya rwo kubona amafoto/amavidewo yawe.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.length) {
      setMediaUri(result.assets[0].uri);
    }
  }, [type]);

  const handleSave = useCallback(async () => {
    if (!mediaUri) {
      setError(type === 'video' ? 'Hitamo videwo.' : 'Hitamo ifoto.');
      return;
    }
    if (!afterArticleId) {
      setError('Hitamo inkuru iri tangazo rizakurikira.');
      return;
    }
    setError('');
    setIsSaving(true);

    const payload = { type, mediaUri, afterArticleId };

    try {
      const result = editingId ? await updateAd(editingId, payload) : await addAd(payload);
      if (!result) {
        setError('Ntibyashobotse kubika itangazo. Gerageza nanone.');
        return;
      }
      navigation.goBack();
    } finally {
      setIsSaving(false);
    }
  }, [mediaUri, afterArticleId, type, editingId, updateAd, addAd, navigation]);

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.huge }]}
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
          <Text style={styles.title}>{editingId ? 'Hindura itangazo' : 'Itangazo rishya'}</Text>
        </View>

        <Text style={styles.label}>Ubwoko</Text>
        <View style={styles.chipRow}>
          {TYPES.map((option) => {
            const active = type === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => {
                  setType(option.key);
                  setMediaUri(null);
                }}
                accessibilityRole="button"
                style={[styles.chip, active && styles.chipActive]}
              >
                <MaterialCommunityIcons name={option.icon} size={15} color={active ? colors.white : colors.blue300} />
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={pickMedia} accessibilityRole="button" style={styles.mediaPicker}>
          {mediaUri ? (
            type === 'video' ? (
              <Video source={{ uri: mediaUri }} style={styles.media} resizeMode={ResizeMode.COVER} useNativeControls isLooping />
            ) : (
              <Image source={{ uri: mediaUri }} style={styles.media} resizeMode="cover" />
            )
          ) : (
            <>
              <MaterialCommunityIcons
                name={type === 'video' ? 'video-plus-outline' : 'image-plus'}
                size={28}
                color={colors.blue300}
              />
              <Text style={styles.mediaLabel}>{type === 'video' ? 'Hitamo videwo' : 'Hitamo ifoto'}</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.label}>Rizagaragara nyuma y'iyi nkuru</Text>
        {eligibleArticles.length ? (
          <View style={styles.articleList}>
            {eligibleArticles.map((article) => {
              const active = afterArticleId === article.id;
              return (
                <Pressable
                  key={article.id}
                  onPress={() => setAfterArticleId(article.id)}
                  accessibilityRole="button"
                  style={[styles.articleRow, active && styles.articleRowActive]}
                >
                  <MaterialCommunityIcons
                    name={active ? 'radiobox-marked' : 'radiobox-blank'}
                    size={18}
                    color={active ? colors.blue500 : colors.blue300}
                  />
                  <Text style={styles.articleTitle} numberOfLines={2}>
                    {article.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <EmptyState tone="dark" icon="newspaper-variant-outline" title="Nta nkuru zisohotse" message="Sohora inkuru mbere yo gushyiraho itangazo." />
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryButton
          label={editingId ? 'Bika impinduka' : 'Bika itangazo'}
          icon="check"
          onPress={handleSave}
          loading={isSaving}
          style={styles.submit}
        />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter },
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
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.blue300,
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
  },
  chipRow: { flexDirection: 'row', marginBottom: spacing.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.3)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 36,
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  chipLabel: { fontSize: 12.5, color: colors.textOnNavy, marginLeft: spacing.xs },
  chipLabelActive: { color: colors.white, fontWeight: '600' },
  mediaPicker: {
    height: 160,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.3)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  media: { width: '100%', height: '100%' },
  mediaLabel: { ...typography.caption, color: colors.blue300, marginTop: spacing.sm },
  articleList: { marginBottom: spacing.md },
  articleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  articleRowActive: { backgroundColor: 'rgba(55,138,221,0.18)', borderColor: colors.blue500 },
  articleTitle: { flex: 1, ...typography.body, fontSize: 13, color: colors.textOnNavy, marginLeft: spacing.sm },
  errorText: { ...typography.caption, color: colors.breaking, marginBottom: spacing.md },
  submit: { marginBottom: spacing.xl, marginTop: spacing.sm },
});
