/**
 * LoginScreen.js — Log in with email and password (or, later, Google).
 * Reached from the "Log in" row at the top of Settings.
 */
import React, { useCallback, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import SettingsHeader from '../components/account/SettingsHeader';
import SignInForm from '../components/account/SignInForm';
import GoogleButton from '../components/account/GoogleButton';

import { useUser } from '../context/UserContext';
import { showAlert } from '../utils/showAlert';
import { colors, typography, spacing, gutter } from '../theme';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { signIn, isLoading, error, clearError } = useUser();

  // Don't show an error left over from a previous attempt on another screen.
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSignIn = useCallback(
    async (values) => {
      try {
        await signIn(values);
        navigation.popToTop();
      } catch {
        // The message is already shown under the form via `error`.
      }
    },
    [signIn, navigation]
  );

  const handleGoogle = useCallback(() => {
    showAlert('Coming soon', 'Google sign-in is not available yet. Please log in with your email and password.');
  }, []);

  return (
    <GradientBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: spacing.huge }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SettingsHeader title="Log in" onBack={() => navigation.goBack()} />

          <SignInForm onSubmit={handleSignIn} isLoading={isLoading} serverError={error} />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <GoogleButton onPress={handleGoogle} />

          <Pressable
            onPress={() => navigation.replace('SignUp')}
            style={styles.link}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="New here? Create an account"
          >
            <Text style={styles.linkText}>New here? Create an account</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: gutter },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(133,183,235,0.3)' },
  dividerLabel: { ...typography.caption, color: colors.textOnNavyFaint, marginHorizontal: spacing.md },
  link: { alignSelf: 'center', marginTop: spacing.xl },
  linkText: { ...typography.caption, color: colors.blue300, fontWeight: '600' },
});
