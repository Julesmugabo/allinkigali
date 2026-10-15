/**
 * LoginScreen.js — Log in: Google first (one tap, where available), then
 * email and password. Afterwards you go back to where you were.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../../components/common/GradientBackground';
import SettingsHeader from '../../components/account/SettingsHeader';
import SignInForm from '../../components/account/SignInForm';
import GoogleButton from '../../components/account/GoogleButton';
import OrDivider from '../../components/account/OrDivider';

import { useUser } from '../../context/UserContext';
import { apiFetch } from '../../services/apiClient';
import { isGoogleAvailable } from '../../services/googleAuth';
import { colors, typography, spacing, gutter } from '../../theme';

export default function LoginScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { signIn, isLoading, error, clearError } = useUser();

  // Don't show an error left over from a previous attempt on another screen.
  useEffect(() => { clearError(); }, [clearError]);

  // "Forgot password?" only once the server can email the code (Brevo connected).
  const [emailsEnabled, setEmailsEnabled] = useState(false);
  useEffect(() => { apiFetch('/auth/config').then((c) => setEmailsEnabled(!!c?.emailsEnabled)).catch(() => {}); }, []);

  // Back to where they were: the page that sent them here (returnTo), else
  // the previous screen, else the Me tab.
  const returnTo = route?.params?.returnTo;
  const done = useCallback(() => {
    if (returnTo) navigation.navigate(returnTo.tab, { screen: returnTo.screen, params: returnTo.params });
    else if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Account');
  }, [navigation, returnTo]);

  const handleSignIn = useCallback(async (values) => {
    try { await signIn(values); done(); } catch { /* shown under the form via `error` */ }
  }, [signIn, done]);

  return (
    <GradientBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: spacing.huge }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SettingsHeader title="Log in" onBack={() => navigation.goBack()} />
          <Text style={styles.intro}>Welcome back. Log in to book tables, order food and follow your requests.</Text>

          {isGoogleAvailable() ? (
            <>
              <GoogleButton text="signin_with" onSignedIn={done} />
              <OrDivider />
            </>
          ) : null}

          <SignInForm onSubmit={handleSignIn} isLoading={isLoading} serverError={error} />

          {emailsEnabled ? (
            <Pressable onPress={() => navigation.navigate('ForgotPassword', { returnTo })} style={styles.forgot} hitSlop={8} accessibilityRole="button">
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => navigation.replace('SignUp', { returnTo })}
            style={styles.link}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="New here? Create an account"
          >
            <Text style={styles.linkText}>New here? <Text style={styles.linkStrong}>Create an account</Text></Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: gutter, width: '100%', maxWidth: 480, alignSelf: 'center' },
  intro: { ...typography.body, color: colors.textOnNavyFaint, marginBottom: spacing.xl, lineHeight: 20 },
  forgot: { alignSelf: 'flex-end', marginTop: spacing.md },
  forgotText: { ...typography.caption, color: colors.blue300, fontWeight: '600' },
  link: { alignSelf: 'center', marginTop: spacing.xl },
  linkText: { ...typography.caption, color: colors.textOnNavyFaint },
  linkStrong: { color: colors.blue300, fontWeight: '700' },
});
