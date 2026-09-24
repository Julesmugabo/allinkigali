/**
 * EditProfileScreen.js — Edit your name and phone. Email is shown but can't
 * be changed here.
 */
import React, { useCallback, useState } from 'react';
import { Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import TextField from '../components/common/TextField';
import PrimaryButton from '../components/common/PrimaryButton';
import SettingsHeader from '../components/account/SettingsHeader';

import { useUser } from '../context/UserContext';
import { isValidPhone } from '../utils/format';
import { colors, typography, spacing, gutter } from '../theme';

export default function EditProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, saveProfile, error, clearError } = useUser();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    const next = {};
    if (!firstName.trim()) next.firstName = 'Enter your first name.';
    if (!lastName.trim()) next.lastName = 'Enter your last name.';
    if (phone.trim() && !isValidPhone(phone)) next.phone = 'Phone must start with 07.';
    setErrors(next);
    if (Object.keys(next).length) return;

    clearError();
    setIsSaving(true);
    try {
      const ok = await saveProfile({ firstName, lastName, phone });
      if (ok) navigation.goBack();
    } finally {
      setIsSaving(false);
    }
  }, [firstName, lastName, phone, saveProfile, clearError, navigation]);

  return (
    <GradientBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: spacing.huge }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SettingsHeader title="Edit profile" onBack={() => navigation.goBack()} />

          <TextField
            label="First name"
            value={firstName}
            onChangeText={setFirstName}
            icon="account-outline"
            error={errors.firstName}
            autoCapitalize="words"
          />
          <TextField
            label="Last name"
            value={lastName}
            onChangeText={setLastName}
            icon="account-outline"
            error={errors.lastName}
            autoCapitalize="words"
          />
          <TextField
            label="Phone (optional)"
            value={phone}
            onChangeText={setPhone}
            placeholder="0788 000 000"
            icon="phone-outline"
            error={errors.phone}
            keyboardType="phone-pad"
          />

          <Text style={styles.emailLabel}>Email</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.emailNote}>Your email is your sign-in and cannot be changed here.</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton label="Save changes" icon="check" onPress={handleSave} loading={isSaving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: gutter },
  emailLabel: { ...typography.caption, fontWeight: '600', color: colors.blue300, marginTop: spacing.sm },
  email: { ...typography.body, color: colors.textOnNavy, marginTop: spacing.xs },
  emailNote: { ...typography.caption, color: colors.textOnNavyFaint, marginTop: spacing.xs, marginBottom: spacing.xl },
  error: { ...typography.caption, color: colors.breaking, marginBottom: spacing.md },
});
