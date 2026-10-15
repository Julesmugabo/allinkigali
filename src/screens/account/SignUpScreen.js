/**
 * SignUpScreen.js — Create an account: Google first (one tap, where
 * available), or name, email and password. One account does everything;
 * listing a business is done later from the Me tab ("Register your spot").
 */
import React, { useCallback, useEffect } from 'react';
import { Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../../components/common/GradientBackground';
import SettingsHeader from '../../components/account/SettingsHeader';
import AuthForm from '../../components/account/AuthForm';
import GoogleButton from '../../components/account/GoogleButton';
import OrDivider from '../../components/account/OrDivider';

import { useUser } from '../../context/UserContext';
import { isGoogleAvailable } from '../../services/googleAuth';
import { colors, typography, spacing, gutter } from '../../theme';

export default function SignUpScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { signUp, isLoading, error, clearError } = useUser();

  useEffect(() => { clearError(); }, [clearError]);

  // Back to where they were: the page that sent them here (returnTo), else
  // the previous screen, else the Me tab.
  const returnTo = route?.params?.returnTo;
  const done = useCallback(() => {
    if (returnTo) navigation.navigate(returnTo.tab, { screen: returnTo.screen, params: returnTo.params });
    else if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Account');
  }, [navigation, returnTo]);

  const handleSignUp = useCallback(async (values) => {
    try { await signUp(values); done(); } catch { /* shown under the form via `error` */ }
  }, [signUp, done]);

  return (
    <GradientBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: spacing.huge }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SettingsHeader title="Create an account" onBack={() => navigation.goBack()} />
          <Text style={styles.intro}>Free, and it takes a minute. Book tables, order food and keep track of your requests.</Text>

          {isGoogleAvailable() ? (
            <>
              <GoogleButton text="signup_with" onSignedIn={done} />
              <OrDivider />
            </>
          ) : null}

          <AuthForm onSubmit={handleSignUp} isLoading={isLoading} serverError={error} />

          <Pressable
            onPress={() => navigation.replace('Login', { returnTo })}
            style={styles.link}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Already have an account? Log in"
          >
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkStrong}>Log in</Text></Text>
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
  link: { alignSelf: 'center', marginTop: spacing.xl },
  linkText: { ...typography.caption, color: colors.textOnNavyFaint },
  linkStrong: { color: colors.blue300, fontWeight: '700' },
});
