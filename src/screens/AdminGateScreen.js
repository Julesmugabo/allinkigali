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

// TEMPORARY, per explicit request (2026-09-23): quick-access buttons that
// sign in behind the scenes with the director account, so nobody has to
// type a password to open the admin dashboards while accounts/passwords
// are still being finalized. Still a real login (a real JWT is issued),
// just not typed by hand. Remove once real per-role passwords are ready.
const QUICK_ACCESS_EMAIL = 'mugaboinfo@gmail.com';
const QUICK_ACCESS_PASSWORD = 'allinkigali-director';

export default function AdminGateScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [quickAccessLoading, setQuickAccessLoading] = useState(null);
  const { refreshArticles } = useNews();

  const signInAndGo = useCallback(
    async (loginEmail, loginPassword, route) => {
      const { token, role } = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email: loginEmail, password: loginPassword },
      });
      await setToken(token);
      await refreshArticles();
      navigation.replace(route || ROLE_META[role].route);
    },
    [navigation, refreshArticles]
  );

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
      await signInAndGo(email.trim(), password);
      setPassword('');
    } catch (e) {
      setError(e.message || "Email cyangwa ijambo ry'ibanga sibyo.");
    } finally {
      setIsSigningIn(false);
    }
  }, [email, password, signInAndGo]);

  const handleQuickAccess = useCallback(
    async (route, key) => {
      setError(null);
      setQuickAccessLoading(key);
      try {
        await signInAndGo(QUICK_ACCESS_EMAIL, QUICK_ACCESS_PASSWORD, route);
      } catch (e) {
        setError(e.message || 'Ntibyashobotse kwinjira.');
      } finally {
        setQuickAccessLoading(null);
      }
    },
    [signInAndGo]
  );

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

            <View style={styles.quickAccessGroup}>
              <PrimaryButton
                label="Injira nk'Ubuyobozi"
                icon="shield-account-outline"
                onPress={() => handleQuickAccess('DirectorAdminDashboard', 'director')}
                loading={quickAccessLoading === 'director'}
              />
              <Pressable
                onPress={() => handleQuickAccess('SellersAdminDashboard', 'sellers')}
                style={styles.quickAccessRow}
                disabled={Boolean(quickAccessLoading)}
                accessibilityRole="button"
                accessibilityLabel="Injira muri Sales Partners Dashboard"
              >
                <MaterialCommunityIcons name="storefront-outline" size={18} color={colors.blue300} />
                <Text style={styles.quickAccessText}>
                  {quickAccessLoading === 'sellers' ? 'Kwinjira...' : 'Injira muri Sales Partners Dashboard'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleQuickAccess('NewsAdminDashboard', 'news')}
                style={styles.quickAccessRow}
                disabled={Boolean(quickAccessLoading)}
                accessibilityRole="button"
                accessibilityLabel="Injira muri News Dashboard"
              >
                <MaterialCommunityIcons name="newspaper-variant-outline" size={18} color={colors.blue300} />
                <Text style={styles.quickAccessText}>
                  {quickAccessLoading === 'news' ? 'Kwinjira...' : 'Injira muri News Dashboard'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>cyangwa ukoreshe email n'ijambo ry'ibanga</Text>
              <View style={styles.dividerLine} />
            </View>

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
  quickAccessGroup: { marginBottom: spacing.lg },
  quickAccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  quickAccessText: {
    ...typography.body,
    color: colors.blue300,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dividerText: {
    ...typography.meta,
    color: colors.textOnNavyFaint,
  },
});
