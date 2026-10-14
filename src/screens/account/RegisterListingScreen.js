import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiFetch } from '../../services/apiClient';
import { useUser } from '../../context/UserContext';
import { colors, typography, spacing, radius, gutter } from '../../theme';

const TYPES = [
  { value: 'restaurant', label: 'Restaurant', icon: 'silverware-fork-knife' },
  { value: 'coffeeshop', label: 'Coffee Shop / Café', icon: 'coffee-outline' },
  { value: 'wedding_venue', label: 'Wedding Venue', icon: 'flower-outline' },
  { value: 'delivery', label: 'Order Delivery', icon: 'moped' },
];

export default function RegisterListingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [type, setType] = useState('restaurant');
  const [form, setForm] = useState({ businessName: '', location: '', district: '', phone: '', email: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.businessName.trim() || !form.location.trim() || !form.phone.trim() || !form.email.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!user) {
      setError('You need an account to submit an application. Please create a free account first.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await apiFetch('/pending-listings', {
        method: 'POST',
        body: { type, ...form },
      });
      setDone(true);
    } catch (e) {
      setError(e.message || 'Could not submit. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.doneWrap}>
          <MaterialCommunityIcons name="check-circle-outline" size={72} color="#16a34a" />
          <Text style={styles.doneTitle}>Application submitted!</Text>
          <Text style={styles.doneSub}>
            Thank you! Our team will review your application and contact you within 1–2 business days to verify your details and grant you access to your dashboard.
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>Back to Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Register your spot</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Fill in a few details and we'll contact you to set up your dashboard. No payment required.
        </Text>

        {/* Type picker */}
        <Text style={styles.label}>Business type *</Text>
        <View style={styles.typeRow}>
          {TYPES.map(t => (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeChip, type === t.value && styles.typeChipActive]}
              onPress={() => setType(t.value)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name={t.icon} size={20} color={type === t.value ? colors.white : colors.text} />
              <Text style={[styles.typeChipText, type === t.value && styles.typeChipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Business name *</Text>
        <TextInput
          style={styles.input}
          value={form.businessName}
          onChangeText={v => set('businessName', v)}
          placeholder="e.g. Gato Café"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Location / address *</Text>
        <TextInput
          style={styles.input}
          value={form.location}
          onChangeText={v => set('location', v)}
          placeholder="e.g. KG 1 Avenue, Kacyiru"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>District</Text>
        <TextInput
          style={styles.input}
          value={form.district}
          onChangeText={v => set('district', v)}
          placeholder="e.g. Gasabo"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Phone number *</Text>
        <TextInput
          style={styles.input}
          value={form.phone}
          onChangeText={v => set('phone', v)}
          placeholder="e.g. 0792 116 352"
          keyboardType="phone-pad"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Email address *</Text>
        <TextInput
          style={styles.input}
          value={form.email}
          onChangeText={v => set('email', v)}
          placeholder="contact@yourbusiness.com"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Additional notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={form.notes}
          onChangeText={v => set('notes', v)}
          placeholder="Anything you'd like us to know..."
          multiline
          numberOfLines={3}
          placeholderTextColor={colors.textMuted}
        />

        {!!error && (
          <View>
            <Text style={styles.error}>{error}</Text>
            {!user && (
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.signUpHint}>
                <Text style={styles.signUpHintText}>Create a free account →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={saving} activeOpacity={0.85}>
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>Submit application</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: insets.bottom + spacing.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gutter,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  back: { padding: 4, marginRight: spacing.sm },
  title: { ...typography.title, color: colors.text },
  scroll: { padding: gutter },
  subtitle: { ...typography.body, color: colors.textMuted, marginBottom: spacing.xl },
  label: { ...typography.caption, color: colors.text, fontWeight: '600', marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top', paddingTop: spacing.sm },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  typeChip: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  typeChipActive: { backgroundColor: colors.blue600, borderColor: colors.blue600 },
  typeChipText: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
  typeChipTextActive: { color: colors.white },
  error: { ...typography.caption, color: '#dc2626', marginTop: spacing.md },
  signUpHint: { marginTop: spacing.xs },
  signUpHintText: { ...typography.caption, color: colors.blue600, fontWeight: '600' },
  submitBtn: {
    backgroundColor: colors.blue600,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  submitBtnText: { ...typography.button, color: colors.white },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: gutter * 2, gap: spacing.lg },
  doneTitle: { ...typography.screenTitle, color: colors.text, textAlign: 'center' },
  doneSub: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  doneBtn: {
    backgroundColor: colors.blue600,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.md,
  },
  doneBtnText: { ...typography.button, color: colors.white },
});
