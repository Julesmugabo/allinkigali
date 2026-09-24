/**
 * ChangePasswordScreen.js — Change your password (needs the current one).
 */
import React, { useCallback, useState } from 'react';
import { Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import TextField from '../components/common/TextField';
import PrimaryButton from '../components/common/PrimaryButton';
import SettingsHeader from '../components/account/SettingsHeader';

import { useUser } from '../context/UserContext';
import { colors, typography, spacing, gutter } from '../theme';

export default function ChangePasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { changePassword } = useUser();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [done, setDone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    const next = {};
    if (!currentPassword) next.currentPassword = 'Enter your current password.';
    if (newPassword.length < 6) next.newPassword = 'At least 6 characters.';
    if (confirm !== newPassword) next.confirm = 'The two passwords do not match.';
    setErrors(next);
    setServerError(null);
    setDone(false);
    if (Object.keys(next).length) return;

    setIsSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setDone(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (e) {
      setServerError(e.message || 'Could not change the password. Try again.');
    } finally {
      setIsSaving(false);
    }
  }, [currentPassword, newPassword, confirm, changePassword]);

  return (
    <GradientBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: spacing.huge }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SettingsHeader title="Change password" onBack={() => navigation.goBack()} />

          <TextField
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            icon="key-outline"
            error={errors.currentPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <TextField
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            icon="key-plus"
            error={errors.newPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <TextField
            label="Confirm new password"
            value={confirm}
            onChangeText={setConfirm}
            icon="key-plus"
            error={errors.confirm}
            secureTextEntry
            autoCapitalize="none"
          />

          {serverError ? <Text style={styles.error}>{serverError}</Text> : null}
          {done ? <Text style={styles.success}>Password changed.</Text> : null}

          <PrimaryButton label="Change password" icon="check" onPress={handleSave} loading={isSaving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: gutter },
  error: { ...typography.caption, color: colors.breaking, marginBottom: spacing.md },
  success: { ...typography.caption, color: colors.success, marginBottom: spacing.md },
});
