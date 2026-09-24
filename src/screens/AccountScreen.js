/**
 * AccountScreen.js — The Me tab.
 *
 * Two states in one screen:
 *   signed out -> sign-up (role choice + name/email/password) or sign-in, plus
 *     Help and Terms links. Same single form for everyone, customer or admin.
 *   signed in  -> profile card and the settings groups (see SettingsList):
 *     Admin (only if the account has an admin role), My activity, My business,
 *     Account, Help, Sign out.
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { showAlert } from '../utils/showAlert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import BrandLogo from '../components/news/BrandLogo';
import AuthForm from '../components/account/AuthForm';
import SignInForm from '../components/account/SignInForm';
import RoleChoice from '../components/account/RoleChoice';
import ProfileHeader from '../components/account/ProfileHeader';
import SettingsList from '../components/account/SettingsList';

import { useUser } from '../context/UserContext';
import { useBookings } from '../context/BookingContext';
import { useBusinesses } from '../context/BusinessContext';
import { colors, typography, spacing, radius, gutter } from '../theme';

const ROLE_COPY = {
  customer: { title: 'Fungura konti y\'Umukiriya', subtitle: 'Konti ituma ukurikirana ibyo watumije kandi ugahita ubona amakuru wakunze.' },
  seller: { title: 'Iyandikishe nk\'Umufatanyabikorwa', subtitle: 'Fungura konti ubanze, hanyuma wandikishe ubucuruzi bwawe.' },
};

export default function AccountScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, isSignedIn, isLoading, isBootstrapping, error, clearError, signUp, signIn, signOut } = useUser();
  const { bookings } = useBookings();
  const { getBusinessesByOwner } = useBusinesses();

  const [pendingRole, setPendingRole] = useState(null);
  const [authMode, setAuthMode] = useState('signup'); // 'signup' | 'signin'

  // A new seller goes straight into business registration after signing up.
  const routeAfterAuth = useCallback(
    (role) => {
      if (role === 'seller') navigation.navigate('SalesPartner');
    },
    [navigation]
  );

  const handleSignUp = useCallback(
    async (values) => {
      try {
        await signUp(values);
        routeAfterAuth(pendingRole);
      } catch (e) {
        // The message is already shown under the form via `error`.
      }
    },
    [signUp, pendingRole, routeAfterAuth]
  );

  const handleSignIn = useCallback(
    async (values) => {
      try {
        await signIn(values);
      } catch (e) {
        // The message is already shown under the form via `error`.
      }
    },
    [signIn]
  );

  const switchAuthMode = useCallback(
    (mode) => {
      setAuthMode(mode);
      setPendingRole(null);
      clearError();
    },
    [clearError]
  );

  const confirmSignOut = useCallback(() => {
    showAlert('Sign out', 'Do you want to sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }, [signOut]);

  const myBusiness = user ? getBusinessesByOwner(user.id)[0] || null : null;

  // Requests I sent (the server also returns requests sent to my business).
  const myRequests = user ? bookings.filter((b) => b.customerId === user.id) : [];
  const waitingRequests = myRequests.filter((b) => b.status === 'new').length;
  const handledRequests = myRequests.filter((b) => b.status === 'handled').length;

  // The tab bar is laid out below the screen, so only breathing room is needed.
  const bottomPadding = spacing.xl;

  // ------------------------------------------------------------- bootstrapping
  // Rehydrating a stored session (GET /auth/me) — avoid flashing the sign-up
  // screen for a split second before that resolves.
  if (isBootstrapping) {
    return <GradientBackground><View style={styles.flex} /></GradientBackground>;
  }

  // ---------------------------------------------------------------- signed out
  if (!isSignedIn) {
    const roleCopy = pendingRole ? ROLE_COPY[pendingRole] : null;

    return (
      <GradientBackground>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              styles.authContent,
              { paddingTop: insets.top + spacing.xxl, paddingBottom: bottomPadding },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.authHeader}>
              <BrandLogo size={52} showMeridians />
              <Text style={styles.authTitle}>
                {authMode === 'signin' ? 'Injira muri konti yawe' : roleCopy ? roleCopy.title : 'Uri nde?'}
              </Text>
              <Text style={styles.authSubtitle}>
                {authMode === 'signin'
                  ? 'Koresha email n\'ijambo ry\'ibanga byawe.'
                  : roleCopy
                  ? roleCopy.subtitle
                  : 'Hitamo uko ushaka gukoresha allinkigali.'}
              </Text>
            </View>

            {authMode === 'signin' ? (
              <SignInForm onSubmit={handleSignIn} isLoading={isLoading} serverError={error} />
            ) : !pendingRole ? (
              <RoleChoice onChoose={setPendingRole} />
            ) : (
              <>
                <AuthForm onSubmit={handleSignUp} isLoading={isLoading} serverError={error} />
                <Pressable onPress={() => setPendingRole(null)} style={styles.changeRoleLink} hitSlop={8}>
                  <Text style={styles.changeRoleText}>Hindura uko winjira</Text>
                </Pressable>
              </>
            )}

            <Pressable
              onPress={() => switchAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
              style={styles.changeRoleLink}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={authMode === 'signin' ? 'Nta konti mfite? Fungura imwe' : 'Nasanzwe mfite konti? Injira'}
            >
              <Text style={styles.changeRoleText}>
                {authMode === 'signin' ? 'Nta konti mfite? Fungura imwe' : 'Nasanzwe mfite konti? Injira'}
              </Text>
            </Pressable>

            <View style={styles.helpLinks}>
              <Pressable onPress={() => navigation.navigate('Info', { kind: 'help' })} hitSlop={8} accessibilityRole="button">
                <Text style={styles.helpLinkText}>Help & FAQ</Text>
              </Pressable>
              <Text style={styles.helpDot}>·</Text>
              <Pressable onPress={() => navigation.navigate('Info', { kind: 'privacy' })} hitSlop={8} accessibilityRole="button">
                <Text style={styles.helpLinkText}>Terms & privacy</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </GradientBackground>
    );
  }

  // ----------------------------------------------------------------- signed in
  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.profileArea, { paddingTop: insets.top + spacing.lg }]}>
          <Text style={styles.screenTitle}>Me</Text>
          <ProfileHeader
            user={user}
            waitingCount={waitingRequests}
            handledCount={handledRequests}
          />
        </View>

        {/* White sheet: everything below the profile lives on light ground so
            long menus stay easy to read. */}
        <View style={styles.sheet}>
          <SettingsList
            user={user}
            navigation={navigation}
            myBusiness={myBusiness}
            waitingRequests={waitingRequests}
            onSignOut={confirmSignOut}
          />

          <Text style={styles.version}>allinkigali · version 1.0.0</Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  authContent: {
    paddingHorizontal: gutter,
  },
  authHeader: { alignItems: 'center', marginBottom: spacing.xxl },
  authTitle: {
    ...typography.screenTitle,
    color: colors.white,
    marginTop: spacing.lg,
  },
  authSubtitle: {
    ...typography.body,
    color: colors.textOnNavyFaint,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 300,
    lineHeight: 20,
  },
  changeRoleLink: { alignSelf: 'center', marginTop: spacing.lg },
  changeRoleText: {
    ...typography.caption,
    color: colors.blue300,
    fontWeight: '600',
  },
  profileArea: {
    paddingHorizontal: gutter,
    paddingBottom: spacing.xxl,
  },
  screenTitle: {
    ...typography.screenTitle,
    color: colors.white,
    marginBottom: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl + 6,
    borderTopRightRadius: radius.xl + 6,
    paddingHorizontal: gutter,
    paddingTop: spacing.xl,
    minHeight: 400,
  },
  groupLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.blue600,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  helpLinks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.xxl },
  helpLinkText: { ...typography.caption, color: colors.blue300, fontWeight: '600' },
  helpDot: { ...typography.caption, color: colors.textOnNavyFaint, marginHorizontal: spacing.md },
  version: {
    ...typography.meta,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});
