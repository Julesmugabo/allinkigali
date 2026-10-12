/**
 * SignUpScreen.js — Create an account.
 *
 * Step 1 asks how you want to start: just an account, or an account plus
 * registering a business (which sends you straight into business
 * registration afterwards). Step 2 is the form.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../../components/common/GradientBackground';
import SettingsHeader from '../../components/account/SettingsHeader';
import RoleChoice from '../../components/account/RoleChoice';
import AuthForm from '../../components/account/AuthForm';
import GoogleButton from '../../components/account/GoogleButton';

import { useUser } from '../../context/UserContext';
import { promptGoogleSignIn } from '../../services/googleAuth';
import { showAlert } from '../../utils/showAlert';
import { colors, typography, spacing, gutter } from '../../theme';

const INTRO = {
  customer: 'Create your account. It takes a minute.',
  seller: 'Create your account first, then you will register your business.',
};

export default function SignUpScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { signUp, signInWithGoogle, isLoading, error, clearError } = useUser();
  const [choice, setChoice] = useState(null); // 'customer' | 'seller'
  const returnTo = route?.params?.returnTo || null;

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSignUp = useCallback(
    async (values) => {
      try {
        await signUp(values);
        if (choice === 'seller') {
          navigation.replace('SalesPartner');
        } else if (returnTo) {
          navigation.popToTop();
        } else {
          navigation.popToTop();
        }
      } catch {
        // The message is already shown under the form via `error`.
      }
    },
    [signUp, choice, navigation]
  );

  const handleGoogle = useCallback(async () => {
    try {
      const credential = await promptGoogleSignIn();
      if (!credential) return;
      await signInWithGoogle(credential);
      if (choice === 'seller') {
        navigation.replace('SalesPartner');
      } else {
        navigation.popToTop();
      }
    } catch (e) {
      showAlert('Google sign-up failed', e.message || 'Please try again.');
    }
  }, [signInWithGoogle, choice, navigation]);

  return (
    <GradientBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: spacing.huge }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SettingsHeader
            title="Create an account"
            onBack={() => (choice ? setChoice(null) : navigation.goBack())}
          />

          {!choice ? (
            <>
              <Text style={styles.intro}>How do you want to start?</Text>
              <RoleChoice onChoose={setChoice} />
            </>
          ) : (
            <>
              <Text style={styles.intro}>{INTRO[choice]}</Text>
              <AuthForm onSubmit={handleSignUp} isLoading={isLoading} serverError={error} />

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>or</Text>
                <View style={styles.dividerLine} />
              </View>
              <GoogleButton label="Sign up with Google" onPress={handleGoogle} />
            </>
          )}

          <Pressable
            onPress={() => navigation.replace('Login')}
            style={styles.link}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Already have an account? Log in"
          >
            <Text style={styles.linkText}>Already have an account? Log in</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: gutter },
  intro: { ...typography.body, color: colors.textOnNavyFaint, marginBottom: spacing.lg, lineHeight: 20 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(133,183,235,0.3)' },
  dividerLabel: { ...typography.caption, color: colors.textOnNavyFaint, marginHorizontal: spacing.md },
  link: { alignSelf: 'center', marginTop: spacing.xl },
  linkText: { ...typography.caption, color: colors.blue300, fontWeight: '600' },
});
