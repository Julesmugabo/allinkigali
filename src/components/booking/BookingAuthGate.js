/**
 * BookingAuthGate.js — shown inside the booking form when someone presses
 * "Confirm" without being signed in. They sign in or create an account right
 * here (Google, or email), and the booking is sent straight after — nothing
 * they filled in is lost and they never leave the form.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import GoogleButton from '../account/GoogleButton';
import OrDivider from '../account/OrDivider';
import SignInForm from '../account/SignInForm';
import AuthForm from '../account/AuthForm';
import { useUser } from '../../context/UserContext';
import { isGoogleAvailable } from '../../services/googleAuth';
import { colors, spacing, radius } from '../../theme';

export default function BookingAuthGate({ placeName, onSignedIn, onBack }) {
  const { signIn, signUp, isLoading, error, clearError } = useUser();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'

  const run = (action) => async (values) => {
    try { const user = await action(values); onSignedIn(user); } catch { /* shown under the form */ }
  };
  const switchTo = (m) => { clearError(); setMode(m); };

  return (
    <View style={styles.gate}>
      <MaterialCommunityIcons name="account-circle-outline" size={48} color={colors.blue300} />
      <Text style={styles.title}>Almost there!</Text>
      <Text style={styles.desc}>Sign in or create a free account to confirm your table at {placeName}. Your booking details stay as you filled them.</Text>

      {isGoogleAvailable() ? (
        <>
          <GoogleButton text="continue_with" onSignedIn={onSignedIn} />
          <OrDivider />
        </>
      ) : null}

      <View style={styles.tabs}>
        {[['signin', 'I have an account'], ['signup', "I'm new here"]].map(([k, label]) => (
          <Pressable key={k} onPress={() => switchTo(k)} style={[styles.tab, mode === k && styles.tabOn]}>
            <Text style={[styles.tabText, mode === k && styles.tabTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.form}>
        {mode === 'signin'
          ? <SignInForm onSubmit={run(signIn)} isLoading={isLoading} serverError={error} />
          : <AuthForm onSubmit={run(signUp)} isLoading={isLoading} serverError={error} />}
      </View>

      <Pressable onPress={onBack} style={styles.back}>
        <MaterialCommunityIcons name="arrow-left" size={14} color={colors.textOnNavyFaint} />
        <Text style={styles.backText}>Back to booking form</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  gate: { paddingVertical: spacing.lg, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: colors.white, marginTop: spacing.sm, marginBottom: spacing.sm },
  desc: { fontSize: 13.5, color: colors.textOnNavy, textAlign: 'center', lineHeight: 21, marginBottom: spacing.xl, paddingHorizontal: spacing.sm },
  tabs: { flexDirection: 'row', alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.md, padding: 4, marginBottom: spacing.lg },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
  tabOn: { backgroundColor: 'rgba(255,255,255,0.14)' },
  tabText: { fontSize: 13.5, fontWeight: '600', color: colors.textOnNavyFaint },
  tabTextOn: { color: colors.white },
  form: { alignSelf: 'stretch' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.lg },
  backText: { fontSize: 13, color: colors.textOnNavyFaint },
});
