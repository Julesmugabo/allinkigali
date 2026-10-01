/**
 * ListPropertyScreen.js — "List your house for rent".
 *
 * Front-end-only for now: adds straight to PropertyContext's in-memory list
 * so it shows up in Inzu zamacye immediately, for the rest of this session.
 * No server call yet — that comes once the browsing experience is approved.
 */
import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import TextField from '../components/common/TextField';
import PrimaryButton from '../components/common/PrimaryButton';
import EmptyState from '../components/common/EmptyState';
import SettingsHeader from '../components/account/SettingsHeader';

import { useProperties } from '../context/PropertyContext';
import { PROVINCES, getDistricts, getSectors } from '../data/rwandaLocations';
import { PROPERTY_FEATURES } from '../data/propertyListings';
import { isValidPhone } from '../utils/format';
import { colors, typography, spacing, radius, gutter } from '../theme';

export default function ListPropertyScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { addProperty } = useProperties();

  const [title, setTitle] = useState('');
  const [province, setProvince] = useState(null);
  const [district, setDistrict] = useState(null);
  const [sector, setSector] = useState(null);
  const [price, setPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [sizeSqm, setSizeSqm] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [done, setDone] = useState(false);

  const toggleFeature = useCallback((f) => {
    setFeatures((current) => (current.includes(f) ? current.filter((x) => x !== f) : [...current, f]));
  }, []);

  const handleSubmit = useCallback(() => {
    const next = {};
    if (!title.trim()) next.title = 'Give your listing a title.';
    if (!province) next.province = 'Pick a province.';
    if (!district) next.district = 'Pick a district.';
    if (!sector) next.sector = 'Pick a sector.';
    if (!price.trim() || Number.isNaN(Number(price))) next.price = 'Enter a monthly price (numbers only).';
    if (!bedrooms.trim() || Number.isNaN(Number(bedrooms))) next.bedrooms = 'Enter a number.';
    if (!bathrooms.trim() || Number.isNaN(Number(bathrooms))) next.bathrooms = 'Enter a number.';
    if (!sizeSqm.trim() || Number.isNaN(Number(sizeSqm))) next.sizeSqm = 'Enter the size in m².';
    if (!phone.trim()) next.phone = 'Enter a phone number.';
    else if (!isValidPhone(phone)) next.phone = 'Phone must start with 07.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setIsSaving(true);
    setTimeout(() => {
      addProperty({
        listingType: 'rent',
        title: title.trim(),
        province,
        district,
        sector,
        price: Number(price),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        sizeSqm: Number(sizeSqm),
        phone: phone.trim(),
        description: description.trim(),
        features,
      });
      setIsSaving(false);
      setDone(true);
    }, 400);
  }, [title, province, district, sector, price, bedrooms, bathrooms, sizeSqm, phone, description, features, addProperty]);

  if (done) {
    return (
      <GradientBackground>
        <View style={[styles.doneWrap, { paddingTop: insets.top + spacing.xxl }]}>
          <EmptyState
            tone="dark"
            icon="check-circle-outline"
            title="Your house is listed!"
            message={`${title} now shows up in Inzu zamacye.`}
            actionLabel="Back to Inzu zamacye"
            onActionPress={() => navigation.goBack()}
          />
        </View>
      </GradientBackground>
    );
  }

  const districts = province ? getDistricts(province) : [];
  const sectors = province && district ? getSectors(province, district) : [];

  return (
    <GradientBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: spacing.huge }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SettingsHeader title="List your house for rent" onBack={() => navigation.goBack()} />

          <TextField
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. 2-bedroom house in Kacyiru"
            icon="home-outline"
            error={errors.title}
          />

          <Text style={styles.label}>Province</Text>
          <View style={styles.chipRow}>
            {PROVINCES.map((p) => (
              <Pressable accessibilityRole="button"
                key={p.key}
                onPress={() => { setProvince(p.key); setDistrict(null); setSector(null); }}
                style={[styles.chip, province === p.key && styles.chipActive]}
              >
                <Text style={[styles.chipLabel, province === p.key && styles.chipLabelActive]}>{p.label}</Text>
              </Pressable>
            ))}
          </View>
          {errors.province ? <Text style={styles.errorText}>{errors.province}</Text> : null}

          {province ? (
            <>
              <Text style={styles.label}>District</Text>
              <View style={styles.chipRow}>
                {districts.map((d) => (
                  <Pressable accessibilityRole="button"
                    key={d.key}
                    onPress={() => { setDistrict(d.key); setSector(null); }}
                    style={[styles.chip, district === d.key && styles.chipActive]}
                  >
                    <Text style={[styles.chipLabel, district === d.key && styles.chipLabelActive]}>{d.label}</Text>
                  </Pressable>
                ))}
              </View>
              {errors.district ? <Text style={styles.errorText}>{errors.district}</Text> : null}
            </>
          ) : null}

          {province && district ? (
            <>
              <Text style={styles.label}>Sector</Text>
              <View style={styles.chipRow}>
                {sectors.map((s) => (
                  <Pressable accessibilityRole="button" key={s} onPress={() => setSector(s)} style={[styles.chip, sector === s && styles.chipActive]}>
                    <Text style={[styles.chipLabel, sector === s && styles.chipLabelActive]}>{s}</Text>
                  </Pressable>
                ))}
              </View>
              {errors.sector ? <Text style={styles.errorText}>{errors.sector}</Text> : null}
            </>
          ) : null}

          <TextField
            label="Monthly price (RWF)"
            value={price}
            onChangeText={setPrice}
            placeholder="e.g. 350000"
            icon="cash"
            keyboardType="numeric"
            error={errors.price}
          />

          <View style={styles.row3}>
            <View style={styles.row3Item}>
              <TextField label="Bedrooms" value={bedrooms} onChangeText={setBedrooms} keyboardType="numeric" error={errors.bedrooms} />
            </View>
            <View style={styles.row3Item}>
              <TextField label="Bathrooms" value={bathrooms} onChangeText={setBathrooms} keyboardType="numeric" error={errors.bathrooms} />
            </View>
            <View style={styles.row3Item}>
              <TextField label="Size (m²)" value={sizeSqm} onChangeText={setSizeSqm} keyboardType="numeric" error={errors.sizeSqm} />
            </View>
          </View>

          <TextField
            label="Phone (customers will call you)"
            value={phone}
            onChangeText={setPhone}
            placeholder="0788 000 000"
            icon="phone-outline"
            keyboardType="phone-pad"
            error={errors.phone}
          />

          <Text style={styles.label}>Features (optional)</Text>
          <View style={styles.chipRow}>
            {PROPERTY_FEATURES.map((f) => (
              <Pressable accessibilityRole="button" key={f} onPress={() => toggleFeature(f)} style={[styles.chip, features.includes(f) && styles.chipActive]}>
                <Text style={[styles.chipLabel, features.includes(f) && styles.chipLabelActive]}>{f}</Text>
              </Pressable>
            ))}
          </View>

          <TextField
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Briefly describe the house..."
            multiline
          />

          <PrimaryButton label="List my house" icon="check" onPress={handleSubmit} loading={isSaving} style={styles.submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: gutter },
  doneWrap: { flex: 1, paddingHorizontal: gutter },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.blue300,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
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
  row3: { flexDirection: 'row' },
  row3Item: { flex: 1, marginRight: spacing.sm },
  submit: { marginTop: spacing.md, marginBottom: spacing.xl },
});
