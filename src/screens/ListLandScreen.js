/**
 * ListLandScreen.js — "List your land plot for sale".
 * Collects plot details and submits to the API via LandContext.
 * After saving, navigates to ListingPlansScreen so the owner sees their fee tier.
 */
import React, { useCallback, useState } from 'react';
import {
  View, Text, Image, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import TextField from '../components/common/TextField';
import PrimaryButton from '../components/common/PrimaryButton';
import SettingsHeader from '../components/account/SettingsHeader';

import { useLand } from '../context/LandContext';
import { PROVINCES, getDistricts, getSectors } from '../data/rwandaLocations';
import { LAND_TYPES } from '../data/landListings';
import { isValidPhone } from '../utils/format';
import { getToken } from '../services/apiClient';
import { pickAndUpload } from '../utils/uploadPhoto';
import { colors, typography, spacing, radius, gutter } from '../theme';

const MAX_PHOTOS = 5;

const LAND_TYPE_OPTIONS = Object.entries(LAND_TYPES).map(([key, v]) => ({ key, label: v.label }));

export default function ListLandScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { addLand } = useLand();

  const [title, setTitle] = useState('');
  const [province, setProvince] = useState(null);
  const [district, setDistrict] = useState(null);
  const [sector, setSector] = useState(null);
  const [price, setPrice] = useState('');
  const [sizeSqm, setSizeSqm] = useState('');
  const [landType, setLandType] = useState('residential');
  const [titled, setTitled] = useState(false);
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const districts = province ? getDistricts(province) : [];
  const sectors = district ? getSectors(province, district) : [];

  const handlePickPhoto = useCallback(async (idx) => {
    try {
      setUploadingIdx(idx);
      const token = await getToken();
      const url = await pickAndUpload(token);
      if (!url) return;
      setPhotos((prev) => {
        const next = [...prev];
        if (idx < next.length) {
          next[idx] = { ...next[idx], url };
        } else {
          next.push({ url, label: '' });
        }
        return next;
      });
    } catch (e) {
      setErrors((prev) => ({ ...prev, photos: e.message || 'Photo upload failed.' }));
    } finally {
      setUploadingIdx(null);
    }
  }, []);

  const handlePhotoLabel = useCallback((idx, label) => {
    setPhotos((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], label };
      return next;
    });
  }, []);

  const handleRemovePhoto = useCallback((idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleSubmit = useCallback(async () => {
    const next = {};
    if (!title.trim()) next.title = 'Give your plot a title.';
    if (!province) next.province = 'Pick a province.';
    if (!district) next.district = 'Pick a district.';
    if (!sector) next.sector = 'Pick a sector.';
    if (!price.trim() || Number.isNaN(Number(price))) next.price = 'Enter the price (numbers only).';
    if (!sizeSqm.trim() || Number.isNaN(Number(sizeSqm))) next.sizeSqm = 'Enter the size in m².';
    if (!phone.trim()) next.phone = 'Enter a phone number.';
    else if (!isValidPhone(phone)) next.phone = 'Phone must start with 07.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setIsSaving(true);
    try {
      await addLand({
        title: title.trim(),
        description: description.trim() || null,
        type: landType,
        sizeSqm: Number(sizeSqm),
        price: Number(price),
        province,
        district,
        sector,
        titled,
        phone: phone.trim(),
        photos: photos.filter((p) => p.url),
      });
      navigation.replace('ListingPlans', {
        listingType: 'land',
        price: Number(price),
        title: title.trim(),
      });
    } catch {
      setErrors({ _global: 'Could not save your listing. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  }, [title, province, district, sector, price, sizeSqm, landType, titled, phone, description, addLand, navigation]);

  return (
    <GradientBackground>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.huge }]}
        >
          <SettingsHeader title="List your land" onBack={() => navigation.goBack()} />

          <Text style={styles.intro}>
            Fill in the details below. After submitting you'll see the monthly listing fee for your plot.
          </Text>

          <TextField label="Title" placeholder="e.g. Residential plot in Kicukiro" value={title} onChangeText={setTitle} error={errors.title} />
          <TextField label="Size (m²)" placeholder="e.g. 600" value={sizeSqm} onChangeText={setSizeSqm} keyboardType="numeric" error={errors.sizeSqm} />
          <TextField label="Price (RWF)" placeholder="e.g. 8000000" value={price} onChangeText={setPrice} keyboardType="numeric" error={errors.price} />

          {/* Land type */}
          <Text style={styles.fieldLabel}>Land type</Text>
          <View style={styles.chipRow}>
            {LAND_TYPE_OPTIONS.map((t) => {
              const active = landType === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setLandType(t.key)}
                  accessibilityRole="button"
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Titled toggle */}
          <Text style={styles.fieldLabel}>Title deed</Text>
          <View style={styles.chipRow}>
            {[{ key: true, label: 'Titled' }, { key: false, label: 'Title in progress' }].map((opt) => {
              const active = titled === opt.key;
              return (
                <Pressable
                  key={String(opt.key)}
                  onPress={() => setTitled(opt.key)}
                  accessibilityRole="button"
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Province */}
          <Text style={styles.fieldLabel}>Province</Text>
          <View style={styles.chipRow}>
            {PROVINCES.map((p) => {
              const active = province === p.key;
              return (
                <Pressable
                  key={p.key}
                  onPress={() => { setProvince(p.key); setDistrict(null); setSector(null); }}
                  accessibilityRole="button"
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{p.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {errors.province ? <Text style={styles.error}>{errors.province}</Text> : null}

          {/* District */}
          {districts.length > 0 && (
            <>
              <Text style={styles.fieldLabel}>District</Text>
              <View style={styles.chipRow}>
                {districts.map((d) => {
                  const active = district === d.key;
                  return (
                    <Pressable
                      key={d.key}
                      onPress={() => { setDistrict(d.key); setSector(null); }}
                      accessibilityRole="button"
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{d.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {errors.district ? <Text style={styles.error}>{errors.district}</Text> : null}
            </>
          )}

          {/* Sector */}
          {sectors.length > 0 && (
            <>
              <Text style={styles.fieldLabel}>Sector</Text>
              <View style={styles.chipRow}>
                {sectors.map((s) => {
                  const active = sector === s.key;
                  return (
                    <Pressable
                      key={s.key}
                      onPress={() => setSector(s.key)}
                      accessibilityRole="button"
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{s.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {errors.sector ? <Text style={styles.error}>{errors.sector}</Text> : null}
            </>
          )}

          <TextField label="Phone number" placeholder="07XXXXXXXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={errors.phone} />
          <TextField label="Description (optional)" placeholder="Describe the plot…" value={description} onChangeText={setDescription} multiline />

          {/* Photos */}
          <Text style={styles.fieldLabel}>Photos (optional, up to {MAX_PHOTOS})</Text>
          <Text style={styles.photoHint}>Add photos of the plot — aerial view, boundary markers, access road, etc.</Text>
          {photos.map((photo, idx) => (
            <View key={idx} style={styles.photoRow}>
              <Pressable onPress={() => handlePickPhoto(idx)} style={styles.photoThumb} accessibilityRole="button" accessibilityLabel="Change photo">
                {uploadingIdx === idx
                  ? <ActivityIndicator size="small" color={colors.blue300} />
                  : photo.url
                    ? <Image source={{ uri: photo.url }} style={styles.photoThumbImg} resizeMode="cover" />
                    : <MaterialCommunityIcons name="image-outline" size={28} color={colors.blue300} />}
              </Pressable>
              <View style={styles.photoMeta}>
                <TextField
                  value={photo.label}
                  onChangeText={(t) => handlePhotoLabel(idx, t)}
                  placeholder="e.g. Plot view, Road access"
                />
              </View>
              <Pressable onPress={() => handleRemovePhoto(idx)} style={styles.photoRemove} accessibilityRole="button" accessibilityLabel="Remove photo">
                <MaterialCommunityIcons name="close-circle" size={20} color={colors.breaking} />
              </Pressable>
            </View>
          ))}
          {photos.length < MAX_PHOTOS && (
            <Pressable
              onPress={() => handlePickPhoto(photos.length)}
              style={styles.addPhotoBtn}
              accessibilityRole="button"
              disabled={uploadingIdx != null}
            >
              {uploadingIdx === photos.length
                ? <ActivityIndicator size="small" color={colors.white} />
                : <MaterialCommunityIcons name="camera-plus-outline" size={18} color={colors.white} />}
              <Text style={styles.addPhotoBtnLabel}>
                {photos.length === 0 ? 'Add photos' : 'Add another photo'}
              </Text>
            </Pressable>
          )}
          {errors.photos ? <Text style={styles.error}>{errors.photos}</Text> : null}

          {errors._global ? <Text style={styles.error}>{errors._global}</Text> : null}

          <PrimaryButton
            label={isSaving ? 'Saving…' : 'Submit listing'}
            icon="arrow-right"
            onPress={handleSubmit}
            disabled={isSaving}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: gutter },
  intro: { ...typography.body, fontSize: 13, color: colors.textOnNavyFaint, marginBottom: spacing.lg },
  fieldLabel: { ...typography.caption, fontWeight: '600', color: colors.blue300, marginBottom: spacing.xs, marginTop: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.xs },
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
  error: { fontSize: 12, color: colors.breaking, marginTop: 2, marginBottom: spacing.xs },
  submitBtn: { marginTop: spacing.xl },

  photoHint: { fontSize: 12, color: colors.textOnNavyFaint, marginBottom: spacing.sm },
  photoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  photoThumb: {
    width: 58, height: 58,
    borderRadius: radius.md,
    backgroundColor: 'rgba(55,138,221,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  photoThumbImg: { width: '100%', height: '100%' },
  photoMeta: { flex: 1 },
  photoRemove: { padding: spacing.xs, marginLeft: spacing.xs },
  addPhotoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.4)',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(55,138,221,0.14)',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  addPhotoBtnLabel: { fontSize: 13.5, fontWeight: '600', color: colors.white },
});
