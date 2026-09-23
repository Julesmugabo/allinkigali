/**
 * FlierEditorScreen.js — Kwandika ifliyeri (flier create/edit).
 *
 * Create mode when opened with no params, edit mode with { flierId }. Same
 * shape as AdEditorScreen (News tab ads) but simpler: a flier is always an
 * image, and it promotes one specific business the Sales Partners admin
 * picks from the real seller directory.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import GradientBackground from '../components/common/GradientBackground';
import PrimaryButton from '../components/common/PrimaryButton';
import TextField from '../components/common/TextField';
import EmptyState from '../components/common/EmptyState';

import { useBusinesses } from '../context/BusinessContext';
import { useFliers } from '../context/FliersContext';
import { normalise } from '../utils/format';
import { colors, typography, spacing, radius, gutter } from '../theme';

export default function FlierEditorScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { businesses } = useBusinesses();
  const { addFlier, updateFlier, getFlierById } = useFliers();

  const editingId = route?.params?.flierId || null;
  const existing = useMemo(() => (editingId ? getFlierById(editingId) : null), [editingId, getFlierById]);

  const [imageUri, setImageUri] = useState(existing?.imageUri || null);
  const [businessId, setBusinessId] = useState(existing?.businessId || null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const visibleBusinesses = useMemo(() => {
    const q = normalise(search);
    if (!q) return businesses;
    return businesses.filter((b) => normalise(b.name).includes(q));
  }, [businesses, search]);

  const pickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Ntibyakunze', 'Dukeneye uruhushya rwo kubona amafoto yawe.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.length) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!imageUri) {
      setError('Hitamo ifoto.');
      return;
    }
    if (!businessId) {
      setError('Hitamo ubucuruzi iyi fliyeri izamamaza.');
      return;
    }
    setError('');
    setIsSaving(true);

    const payload = { imageUri, businessId };

    try {
      const result = editingId ? await updateFlier(editingId, payload) : await addFlier(payload);
      if (!result) {
        setError('Ntibyashobotse kubika ifliyeri. Gerageza nanone.');
        return;
      }
      navigation.goBack();
    } finally {
      setIsSaving(false);
    }
  }, [imageUri, businessId, editingId, updateFlier, addFlier, navigation]);

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.huge }]}
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
          <Text style={styles.title}>{editingId ? 'Hindura fliyeri' : 'Fliyeri nshya'}</Text>
        </View>

        <Pressable onPress={pickImage} accessibilityRole="button" style={styles.mediaPicker}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.media} resizeMode="cover" />
          ) : (
            <>
              <MaterialCommunityIcons name="image-plus" size={28} color={colors.blue300} />
              <Text style={styles.mediaLabel}>Hitamo ifoto</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.label}>Izamamaza ubucuruzi</Text>
        <TextField
          value={search}
          onChangeText={setSearch}
          placeholder="Shakisha ubucuruzi..."
          icon="magnify"
        />

        {visibleBusinesses.length ? (
          <View style={styles.businessList}>
            {visibleBusinesses.map((business) => {
              const active = businessId === business.id;
              return (
                <Pressable
                  key={business.id}
                  onPress={() => setBusinessId(business.id)}
                  accessibilityRole="button"
                  style={[styles.businessRow, active && styles.businessRowActive]}
                >
                  <MaterialCommunityIcons
                    name={active ? 'radiobox-marked' : 'radiobox-blank'}
                    size={18}
                    color={active ? colors.blue500 : colors.blue300}
                  />
                  <Text style={styles.businessTitle} numberOfLines={1}>
                    {business.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <EmptyState tone="dark" icon="store-outline" title="No sellers found" message="Try a different search." />
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryButton
          label={editingId ? 'Bika impinduka' : 'Bika fliyeri'}
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
  businessList: { marginBottom: spacing.md },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  businessRowActive: { backgroundColor: 'rgba(55,138,221,0.18)', borderColor: colors.blue500 },
  businessTitle: { flex: 1, ...typography.body, fontSize: 13, color: colors.textOnNavy, marginLeft: spacing.sm },
  errorText: { ...typography.caption, color: colors.breaking, marginBottom: spacing.md },
  submit: { marginBottom: spacing.xl, marginTop: spacing.sm },
});
