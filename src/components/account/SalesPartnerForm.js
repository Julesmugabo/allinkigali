/**
 * SalesPartnerForm.js — Ifishi yo kwiyandikisha nk'umufatanyabikorwa.
 *
 * Every field here is exactly what BusinessCard/BusinessDetailScreen show,
 * so a submitted business slots straight into search results with nothing
 * extra to map. Validation lives here, same convention as AuthForm; saving
 * the business lives in BusinessContext.
 */
import React, { useCallback, useRef, useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { showAlert } from '../../utils/showAlert';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';

import TextField from '../common/TextField';
import PrimaryButton from '../common/PrimaryButton';
import { BUSINESS_CATEGORIES } from '../../data/mockBusinesses';
import { isValidPhone } from '../../utils/format';
import { colors, typography, spacing, radius } from '../../theme';

// The platform welcomes any kind of business — these are just quick-pick
// suggestions for the common cases. "other" always stays last and reveals a
// free-text field, so a seller is never blocked from registering something
// that isn't in this list.
const OTHER_CATEGORY = { key: 'other', label: 'Ubundi', icon: 'shape-outline' };
const CATEGORY_OPTIONS = [...BUSINESS_CATEGORIES, OTHER_CATEGORY];

function isKnownCategory(key) {
  return BUSINESS_CATEGORIES.some((c) => c.key === key);
}

export default function SalesPartnerForm({ onSubmit, isSubmitting = false, initialValues = null, submitLabel = 'Ohereza kwiyandikisha' }) {
  const initialIsCustomCategory = Boolean(initialValues?.category) && !isKnownCategory(initialValues.category);

  const [name, setName] = useState(initialValues?.name || '');
  const [category, setCategory] = useState(
    initialIsCustomCategory ? 'other' : initialValues?.category || BUSINESS_CATEGORIES[0].key
  );
  const [customCategory, setCustomCategory] = useState(initialIsCustomCategory ? initialValues.category : '');
  const [phone, setPhone] = useState(initialValues?.phone || '');
  const [servicesText, setServicesText] = useState((initialValues?.services || []).join(', '));
  const [priceFrom, setPriceFrom] = useState(initialValues?.priceFrom ? String(initialValues.priceFrom) : '');
  const [priceUnit, setPriceUnit] = useState(initialValues?.priceUnit || '');
  const [location, setLocation] = useState(initialValues?.location || '');
  const [hours, setHours] = useState(initialValues?.hours || '');
  const [highlightsText, setHighlightsText] = useState((initialValues?.highlights || []).join('\n'));
  const [description, setDescription] = useState(initialValues?.description || '');
  const [photoUri, setPhotoUri] = useState(initialValues?.image?.uri || null);
  const [errors, setErrors] = useState({});

  const locationRef = useRef(null);
  const hoursRef = useRef(null);
  const priceFromRef = useRef(null);
  const priceUnitRef = useRef(null);

  const pickPhoto = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('Ntibyakunze', 'Dukeneye uruhushya rwo kubona amafoto yawe.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets?.length) {
      setPhotoUri(result.assets[0].uri);
    }
  }, []);

  const isOther = category === 'other';

  const validate = useCallback(() => {
    const next = {};
    if (!name.trim()) next.name = 'Andika izina ry\'ubucuruzi.';
    if (!phone.trim()) next.phone = 'Andika nomero ya telefone.';
    else if (!isValidPhone(phone)) next.phone = 'Nomero igomba gutangira na 07.';
    if (isOther && !customCategory.trim()) next.customCategory = 'Andika ubwoko bw\'ubucuruzi bwawe.';
    if (!servicesText.trim()) next.servicesText = 'Andika nibura serivisi imwe.';
    if (!priceFrom.trim() || Number.isNaN(Number(priceFrom))) next.priceFrom = 'Andika igiciro (imibare gusa).';
    if (!priceUnit.trim()) next.priceUnit = "Urugero: ukwezi, umwana, urugendo.";
    if (!location.trim()) next.location = 'Andika aho uherereye.';
    if (!hours.trim()) next.hours = 'Andika amasaha mukorera.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [name, phone, isOther, customCategory, servicesText, priceFrom, priceUnit, location, hours]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;

    const services = servicesText.split(',').map((s) => s.trim()).filter(Boolean);
    const highlights = highlightsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
    const finalCategory = isOther ? customCategory.trim() : category;

    onSubmit({
      name: name.trim(),
      category: finalCategory,
      phone: phone.trim(),
      services,
      priceFrom: Number(priceFrom),
      priceUnit: priceUnit.trim(),
      location: location.trim(),
      hours: hours.trim(),
      highlights,
      description: description.trim(),
      image: photoUri ? { uri: photoUri } : null,
      icon: isOther ? OTHER_CATEGORY.icon : BUSINESS_CATEGORIES.find((c) => c.key === category)?.icon || 'store-outline',
      keywords: [name, finalCategory, ...services].map((s) => s.toLowerCase()),
    });
  }, [
    validate,
    onSubmit,
    name,
    category,
    isOther,
    customCategory,
    phone,
    servicesText,
    priceFrom,
    priceUnit,
    location,
    hours,
    highlightsText,
    description,
    photoUri,
  ]);

  return (
    <View style={styles.container}>
      <Pressable onPress={pickPhoto} accessibilityRole="button" accessibilityLabel="Shyiraho ifoto" style={styles.photoPicker}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
        ) : (
          <>
            <MaterialCommunityIcons name="camera-plus-outline" size={26} color={colors.blue300} />
            <Text style={styles.photoLabel}>Shyiraho ifoto y'ubucuruzi</Text>
          </>
        )}
      </Pressable>

      <TextField
        label="Izina ry'ubucuruzi"
        value={name}
        onChangeText={setName}
        placeholder="Urugero: Fitnesspoint"
        icon="storefront-outline"
        error={errors.name}
      />

      <TextField
        label="Telefone (abakiriya bazakuhamagara)"
        value={phone}
        onChangeText={setPhone}
        placeholder="0788 000 000"
        icon="phone-outline"
        keyboardType="phone-pad"
        error={errors.phone}
        onSubmitEditing={() => locationRef.current?.focus()}
      />

      <Text style={styles.label}>Ubwoko bw'ubucuruzi</Text>
      <View style={styles.categoryRow}>
        {CATEGORY_OPTIONS.map((option) => {
          const active = category === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => setCategory(option.key)}
              accessibilityRole="button"
              style={[styles.categoryChip, active && styles.categoryChipActive]}
            >
              <MaterialCommunityIcons
                name={option.icon}
                size={15}
                color={active ? colors.white : colors.blue300}
              />
              <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isOther ? (
        <TextField
          label="Andika ubwoko bw'ubucuruzi bwawe"
          value={customCategory}
          onChangeText={setCustomCategory}
          placeholder="Urugero: Isuku y'imodoka, Ubwubatsi, Ubwiteganyirize..."
          icon="shape-outline"
          error={errors.customCategory}
        />
      ) : null}

      <TextField
        label="Serivisi utanga (tandukanya na comma)"
        value={servicesText}
        onChangeText={setServicesText}
        placeholder="Urugero: Gym, Personal Training, Group Classes"
        icon="format-list-bulleted"
        error={errors.servicesText}
      />

      <TextField
        ref={locationRef}
        label="Aho uherereye"
        value={location}
        onChangeText={setLocation}
        placeholder="Urugero: Kacyiru, Kigali"
        icon="map-marker-outline"
        error={errors.location}
        onSubmitEditing={() => hoursRef.current?.focus()}
      />

      <TextField
        ref={hoursRef}
        label="Amasaha mukorera"
        value={hours}
        onChangeText={setHours}
        placeholder="Urugero: 08:00 - 22:00"
        icon="clock-outline"
        error={errors.hours}
        onSubmitEditing={() => priceFromRef.current?.focus()}
      />

      <View style={styles.priceRow}>
        <TextField
          ref={priceFromRef}
          style={styles.priceField}
          label="Igiciro guhera kuri"
          value={priceFrom}
          onChangeText={setPriceFrom}
          placeholder="15000"
          icon="cash"
          keyboardType="numeric"
          error={errors.priceFrom}
          onSubmitEditing={() => priceUnitRef.current?.focus()}
        />
        <TextField
          ref={priceUnitRef}
          style={styles.priceField}
          label="Kuri buri"
          value={priceUnit}
          onChangeText={setPriceUnit}
          placeholder="ukwezi"
          error={errors.priceUnit}
        />
      </View>

      <TextField
        label="Impamvu abantu bakwifuza (si ngombwa, buri murongo ni imwe)"
        value={highlightsText}
        onChangeText={setHighlightsText}
        placeholder={'Urugero:\nAhantu hasukuye\nAbatoza b\'inshuti'}
        multiline
      />

      <TextField
        label="Ibisobanuro birambuye (si ngombwa)"
        value={description}
        onChangeText={setDescription}
        placeholder="Sobanura ubucuruzi bwawe muri make..."
        multiline
      />

      <PrimaryButton
        label={submitLabel}
        onPress={handleSubmit}
        loading={isSubmitting}
        icon="check"
        style={styles.submit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
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
  photoLabel: {
    ...typography.caption,
    color: colors.blue300,
    marginTop: spacing.xs,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.blue300,
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
  },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.3)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 36,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryChipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  categoryLabel: { fontSize: 12.5, color: colors.textOnNavy, marginLeft: spacing.xs },
  categoryLabelActive: { color: colors.white, fontWeight: '600' },
  priceRow: { flexDirection: 'row' },
  priceField: { flex: 1, marginRight: spacing.md },
  submit: { marginTop: spacing.sm },
});
