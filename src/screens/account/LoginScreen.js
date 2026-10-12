/**
 * LoginScreen.js — Log in with email and password (or, later, Google).
 * Reached from the "Log in" row at the top of Settings.
 */
import React, { useCallback, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../../components/common/GradientBackground';
import SettingsHeader from '../../components/account/SettingsHeader';
import SignInForm from '../../components/account/SignInForm';
import GoogleButton from '../../components/account/GoogleButton';

import { useUser } from '../../context/UserContext';
import { promptGoogleSignIn } from '../../services/googleAuth';
import { showAlert } from '../../utils/showAlert';
import { colors, typography, spacing, gutter } from '../../theme';

export default function LoginScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { signIn, signInWithGoogle, isLoading, error, clearError } = useUser();

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

  const handleGoogle = useCallback(async () => {
    try {
      const credential = await promptGoogleSignIn();
      if (!credential) return;
      await signInWithGoogle(credential);
      navigation.popToTop();
    } catch (e) {
      showAlert('Google sign-in failed', e.message || 'Please try again.');
    }
  }, [signInWithGoogle, navigation]);

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
