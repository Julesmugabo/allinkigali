/**
 * AdminGateScreen.js — Kwinjira mu buyobozi (admin sign-in).
 *
 * Real sign-in against our own Express + Postgres backend now (see
 * server/src/routes/auth.js) — POST /auth/login returns a JWT plus the
 * account's role in one call, which decides which dashboard opens.
 * Deliberately kept separate from the customer sign-up form so admin access
 * is never something a customer can stumble into.
 */
import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import TextField from '../components/common/TextField';
import PrimaryButton from '../components/common/PrimaryButton';

import { apiFetch, setToken } from '../services/apiClient';
import { useNews } from '../context/NewsContext';
import { ROLE_META } from '../admin/adminAuth';
import { colors, typography, spacing, radius, gutter } from '../theme';

export default function AdminGateScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { refreshArticles } = useNews();

  const handleEnter = useCallback(async () => {
    if (!email.trim() || !password) {
      setError("Andika email n'ijambo ry'ibanga.");
      return;
    }
    setError(null);
    setIsSigningIn(true);

    // try/finally so a network hiccup never leaves the button stuck in its
    // loading state forever — a real bug hit and fixed during the earlier
    // Supabase version, kept here on purpose.
    try {
      const { token, role } = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email: email.trim(), password },
      });
      await setToken(token);
      await refreshArticles(); // this login just widened what news/director admins can see
      setPassword('');
      navigation.replace(ROLE_META[role].route);
    } catch (e) {
      setError(e.message || "Email cyangwa ijambo ry'ibanga sibyo.");
    } finally {
      setIsSigningIn(false);
    }
  }, [email, password, navigation, refreshArticles]);

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.content, { paddingTop: insets.top + spacing.md }]}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Subira inyuma"
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textOnNavy} />
          </Pressable>

          <View style={styles.center}>
            <View style={styles.lockWell}>
              <MaterialCommunityIcons name="shield-lock-outline" size={30} color={colors.blue300} />
            </View>

            <Text style={styles.title}>Ubuyobozi</Text>
            <Text style={styles.subtitle}>Injira ukoresheje konti yawe y'ubuyobozi.</Text>

            <TextField
              label="Email"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (error) setError(null);
              }}
              placeholder="you@example.com"
              icon="email-outline"
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              style={styles.field}
            />

            <TextField
              label="Ijambo ry'ibanga"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (error) setError(null);
              }}
              placeholder="••••••••"
              icon="key-outline"
              autoCapitalize="none"
              error={error}
              returnKeyType="go"
              onSubmitEditing={handleEnter}
              style={styles.field}
            />

            <PrimaryButton label="Injira" icon="login" onPress={handleEnter} loading={isSigningIn} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: gutter },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, justifyContent: 'center', paddingBottom: spacing.huge },
  lockWell: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.screenTitle,
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textOnNavyFaint,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  field: { marginBottom: spacing.lg },
});
