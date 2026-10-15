/**
 * ForgotPasswordScreen.js — "Forgot password?": enter your email, get a
 * 6-digit code, then choose a new password. You're signed in afterwards and
 * go back to where you were.
 */
import React, { useCallback, useState } from 'react';
import { Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../../components/common/GradientBackground';
import SettingsHeader from '../../components/account/SettingsHeader';
import TextField from '../../components/common/TextField';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useUser } from '../../context/UserContext';
import { isValidEmail } from '../../utils/format';
import { colors, typography, spacing, gutter } from '../../theme';

export default function ForgotPasswordScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { forgotPassword, resetPassword } = useUser();
  const returnTo = route?.params?.returnTo;
  const [step, setStep] = useState('email'); // 'email' | 'code'
  const [email, setEmail] = useState(route?.params?.email || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const done = useCallback(() => {
    if (returnTo) navigation.navigate(returnTo.tab, { screen: returnTo.screen, params: returnTo.params });
    else navigation.navigate('Account');
  }, [navigation, returnTo]);

  const sendCode = async () => {
    if (!isValidEmail(email)) { setError('Enter the email of your account.'); return; }
    setBusy(true); setError('');
    try { await forgotPassword(email); setStep('code'); } catch (e) { setError(e.message); }
    setBusy(false);
  };
  const reset = async () => {
    if (code.length !== 6) { setError('Enter the 6 digits from the email.'); return; }
    if (password.length < 6) { setError('The new password needs at least 6 characters.'); return; }
    setBusy(true); setError('');
    try { await resetPassword({ email, code, newPassword: password }); done(); } catch (e) { setError(e.message); }
    setBusy(false);
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: spacing.huge }]}
          keyboardShouldPersistTaps="handled"
        >
          <SettingsHeader title="Forgot password" onBack={() => navigation.goBack()} />
          {step === 'email' ? (
            <>
              <Text style={styles.text}>Enter the email of your account. We'll send you a 6-digit code to choose a new password.</Text>
              <TextField label="Email" value={email} onChangeText={setEmail} placeholder="name@example.com" icon="email-outline"
                keyboardType="email-address" autoCapitalize="none" autoComplete="email" returnKeyType="send" onSubmitEditing={sendCode} error={error} />
              <PrimaryButton label="Send me a code" icon="email-fast-outline" onPress={sendCode} loading={busy} style={styles.button} />
            </>
          ) : (
            <>
              <Text style={styles.text}>If <Text style={styles.strong}>{email}</Text> has an account, a 6-digit code is on its way (check spam too). Enter it with your new password.</Text>
              <TextField label="Code" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} placeholder="123456"
                icon="email-check-outline" keyboardType="number-pad" autoComplete="one-time-code" />
              <TextField label="New password" value={password} onChangeText={setPassword} placeholder="At least 6 characters"
                icon="key-outline" autoCapitalize="none" autoComplete="new-password" returnKeyType="done" onSubmitEditing={reset} error={error} secureTextEntry />
              <PrimaryButton label="Save new password" icon="check" onPress={reset} loading={busy} style={styles.button} />
              <Pressable onPress={() => { setStep('email'); setError(''); }} style={styles.link} hitSlop={8}>
                <Text style={styles.linkText}>Send the code again or use another email</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: gutter, width: '100%', maxWidth: 480, alignSelf: 'center' },
  text: { ...typography.body, color: colors.textOnNavy, lineHeight: 21, marginBottom: spacing.lg },
  strong: { fontWeight: '700', color: colors.white },
  button: { marginTop: spacing.md },
  link: { alignSelf: 'center', marginTop: spacing.xl },
  linkText: { ...typography.caption, color: colors.blue300, fontWeight: '600' },
});
