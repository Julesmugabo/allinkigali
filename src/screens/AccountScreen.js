/**
 * AccountScreen.js — Ecran ya "Jyewe" (Me tab).
 *
 * Two states in one screen:
 *   signed out -> sign-up (role choice + name/email/password) or sign-in —
 *     same single form for everyone, customer or admin; there's no separate
 *     hidden admin gate any more.
 *   signed in  -> profile summary, order shortcuts, settings, sign out —
 *     plus a "Ubuyobozi" row that only appears when the signed-in account's
 *     `role` (news/sellers/director) is set, leading straight into that
 *     dashboard.
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import BrandLogo from '../components/news/BrandLogo';
import AuthForm from '../components/account/AuthForm';
import SignInForm from '../components/account/SignInForm';
import RoleChoice from '../components/account/RoleChoice';
import ProfileHeader from '../components/account/ProfileHeader';
import MenuRow from '../components/account/MenuRow';

import { useUser } from '../context/UserContext';
import { useOrders } from '../context/OrdersContext';
import { useBusinesses } from '../context/BusinessContext';
import { ROLE_META } from '../admin/adminAuth';
import { colors, typography, spacing, radius, gutter } from '../theme';

const ROLE_COPY = {
  customer: { title: 'Fungura konti y\'Umukiriya', subtitle: 'Konti ituma ukurikirana ibyo watumije kandi ugahita ubona amakuru wakunze.' },
  seller: { title: 'Iyandikishe nk\'Umufatanyabikorwa', subtitle: 'Fungura konti ubanze, hanyuma wandikishe ubucuruzi bwawe.' },
};

export default function AccountScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, isSignedIn, isLoading, isBootstrapping, error, clearError, signUp, signIn, signOut, updateProfile } = useUser();
  const { activeOrders, pastOrders } = useOrders();
  const { getBusinessesByOwner } = useBusinesses();

  const [pendingRole, setPendingRole] = useState(null);
  const [authMode, setAuthMode] = useState('signup'); // 'signup' | 'signin'

  const routeAfterAuth = useCallback(
    (newUser, role) => {
      if (role === 'seller') {
        updateProfile({ role: 'seller' });
        navigation.navigate('SalesPartner');
      }
    },
    [updateProfile, navigation]
  );

  const handleSignUp = useCallback(
    async (values) => {
      try {
        const newUser = await signUp(values);
        routeAfterAuth(newUser, pendingRole);
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
    Alert.alert('Sohoka', 'Uremeza ko usohoka muri konti yawe?', [
      { text: 'Oya', style: 'cancel' },
      { text: 'Yego, sohoka', style: 'destructive', onPress: signOut },
    ]);
  }, [signOut]);

  const myBusinesses = user ? getBusinessesByOwner(user.id) : [];

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
            activeCount={activeOrders.length}
            completedCount={pastOrders.length}
          />
        </View>

        {/* White sheet: everything below the profile lives on light ground so
            long menus stay easy to read. */}
        <View style={styles.sheet}>
          <Text style={styles.groupLabel}>Ibyo natumije</Text>
          <View style={styles.group}>
            <MenuRow
              icon="clipboard-text-clock-outline"
              label="Ibyo natumije byose"
              badgeCount={activeOrders.length || null}
              onPress={() => navigation.navigate('Orders')}
            />
            <MenuRow
              icon="moped"
              label="Biri mu nzira"
              value={String(activeOrders.length)}
              onPress={() => navigation.navigate('Orders', { filter: 'active' })}
              isLast
            />
          </View>

          <Text style={styles.groupLabel}>Ubucuruzi</Text>
          <View style={styles.group}>
            {myBusinesses.length ? (
              myBusinesses[0].verified ? (
                <MenuRow
                  icon="view-dashboard-outline"
                  label="Dashboard y'ubucuruzi"
                  value={myBusinesses[0].name}
                  onPress={() => navigation.navigate('SellerDashboard', { businessId: myBusinesses[0].id })}
                  isLast
                />
              ) : (
                <MenuRow
                  icon="clock-outline"
                  label="Ubucuruzi buracyasuzumwa"
                  value={myBusinesses[0].name}
                  onPress={() =>
                    Alert.alert(
                      'Biracyasuzumwa',
                      'Ubuyobozi burimo kureba ubucuruzi bwawe. Uzabona dashboard yawe iyo bwemejwe.'
                    )
                  }
                  isLast
                />
              )
            ) : (
              <MenuRow
                icon="storefront-outline"
                label="Ba umufatanyabikorwa"
                value="Andikisha ubucuruzi"
                onPress={() => navigation.navigate('SalesPartner')}
                isLast
              />
            )}
          </View>

          {user.role ? (
            <>
              <Text style={styles.groupLabel}>Ubuyobozi</Text>
              <View style={styles.group}>
                <MenuRow
                  icon={ROLE_META[user.role].icon}
                  label={ROLE_META[user.role].label}
                  onPress={() => navigation.navigate('Admin', { screen: ROLE_META[user.role].route })}
                  isLast
                />
              </View>
            </>
          ) : null}

          <Text style={styles.groupLabel}>Konti</Text>
          <View style={styles.group}>
            <MenuRow
              icon="account-edit-outline"
              label="Hindura amakuru yanjye"
              onPress={() => Alert.alert('Biraza vuba', 'Guhindura amakuru bizaboneka vuba.')}
            />
            <MenuRow
              icon="map-marker-outline"
              label="Aderesi zanjye"
              onPress={() => Alert.alert('Biraza vuba', 'Kubika aderesi bizaboneka vuba.')}
            />
            <MenuRow
              icon="bell-outline"
              label="Amatangazo"
              onPress={() => Alert.alert('Biraza vuba', 'Igenamiterere ry\'amatangazo rizaboneka vuba.')}
              isLast
            />
          </View>

          <Text style={styles.groupLabel}>Ubufasha</Text>
          <View style={styles.group}>
            <MenuRow
              icon="help-circle-outline"
              label="Ibibazo bikunze kubazwa"
              onPress={() => Alert.alert('Biraza vuba', 'Ubufasha buzaboneka vuba.')}
            />
            <MenuRow
              icon="shield-check-outline"
              label="Amabwiriza n'ibanga ry'amakuru"
              onPress={() => Alert.alert('Biraza vuba', 'Amabwiriza azaboneka vuba.')}
              isLast
            />
          </View>

          <View style={styles.group}>
            <MenuRow icon="logout" label="Sohoka" destructive onPress={confirmSignOut} isLast />
          </View>

          <Text style={styles.version}>allinkigali · verisiyo 1.0.0</Text>
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
  version: {
    ...typography.meta,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});
