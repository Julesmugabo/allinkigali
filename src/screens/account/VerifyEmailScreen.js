/**
 * VerifyEmailScreen.js — confirm your email with the 6-digit code we sent.
 * Shown right after an email sign-up, and from the Me tab's reminder; then
 * back to where you were (returnTo) or the Me tab.
 */
import React, { useCallback } from 'react';
import { Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../../components/common/GradientBackground';
import SettingsHeader from '../../components/account/SettingsHeader';
import VerifyEmailBox from '../../components/account/VerifyEmailBox';
import { colors, typography, spacing, gutter } from '../../theme';

export default function VerifyEmailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const returnTo = route?.params?.returnTo;
  const done = useCallback(() => {
    if (returnTo) navigation.navigate(returnTo.tab, { screen: returnTo.screen, params: returnTo.params });
    else navigation.navigate('Account');
  }, [navigation, returnTo]);

  return (
    <GradientBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: spacing.huge }]}
          keyboardShouldPersistTaps="handled"
        >
          <SettingsHeader title="Confirm your email" onBack={done} />
          <VerifyEmailBox onVerified={done} />
          <Text style={styles.later}>You can keep browsing; booking a table and ordering need a confirmed email.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: gutter, width: '100%', maxWidth: 480, alignSelf: 'center' },
  later: { ...typography.caption, color: colors.textOnNavyFaint, textAlign: 'center', marginTop: spacing.xl, lineHeight: 18 },
});
