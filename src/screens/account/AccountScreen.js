/**
 * AccountScreen.js — The Me tab: one Settings page for everyone.
 *
 * Signed out: the page opens with Log in / Create an account (those open
 * their own screens), then My orders, Appearance and Help.
 * Signed in: a profile card, then the groups in SettingsList (Admin for admin
 * roles, My activity, My business, Account, Preferences, Help) and Log out.
 */
import React, { useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../../components/common/GradientBackground';
import ProfileHeader from '../../components/account/ProfileHeader';
import AppTopBar from '../../components/common/AppTopBar';
import SettingsList from '../../components/account/SettingsList';

import { useUser } from '../../context/UserContext';
import { useBookings } from '../../context/BookingContext';
import { useBusinesses } from '../../context/BusinessContext';
import { showAlert } from '../../utils/showAlert';
import { colors, typography, spacing, radius, gutter } from '../../theme';

export default function AccountScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, isSignedIn, isBootstrapping, signOut, needsVerification } = useUser();

  const { bookings } = useBookings();
  const { getBusinessesByOwner } = useBusinesses();

  const confirmLogOut = useCallback(() => {
    showAlert('Log out', 'Do you want to log out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: signOut },
    ]);
  }, [signOut]);

  const myBusiness = user ? getBusinessesByOwner(user.id)[0] || null : null;

  // Requests I sent (the server also returns requests sent to my business).
  const myRequests = user ? bookings.filter((b) => b.customerId === user.id) : [];
  const waitingRequests = myRequests.filter((b) => b.status === 'new').length;
  const handledRequests = myRequests.filter((b) => b.status === 'handled').length;

  // Rehydrating a stored session (GET /auth/me) — avoid flashing the signed-out
  // page for a split second before that resolves.
  if (isBootstrapping) {
    return (
      <GradientBackground>
        <View style={styles.flex} />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: gutter }}>
        <AppTopBar variant="full" />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.top, { paddingTop: spacing.lg }]}>
          <Text style={styles.screenTitle}>{isSignedIn ? 'Me' : 'Welcome'}</Text>
          {isSignedIn ? (
            <ProfileHeader user={user} waitingCount={waitingRequests} handledCount={handledRequests} />
          ) : null}
          {needsVerification ? (
            <Pressable onPress={() => navigation.navigate('VerifyEmail')} style={styles.verify} accessibilityRole="button">
              <MaterialCommunityIcons name="email-alert-outline" size={22} color={colors.white} />
              <View style={{ flex: 1 }}>
                <Text style={styles.verifyTitle}>Confirm your email</Text>
                <Text style={styles.verifyText}>Enter the 6-digit code we sent to {user.email}. Needed to book and order.</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.white} />
            </Pressable>
          ) : null}
        </View>

        {/* White sheet: everything below lives on light ground so long menus
            stay easy to read. */}
        <View style={styles.sheet}>
          <SettingsList
            user={isSignedIn ? user : null}
            navigation={navigation}
            myBusiness={myBusiness}
            waitingRequests={waitingRequests}
            onLogOut={confirmLogOut}
          />

          <Text style={styles.version}>allinkigali · version 1.0.0</Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xl },
  top: { paddingHorizontal: gutter, paddingBottom: spacing.xxl },
  screenTitle: {
    ...typography.screenTitle,
    color: colors.white,
    marginBottom: spacing.lg,
  },
  verify: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: 'rgba(230,185,46,0.28)', borderWidth: 1, borderColor: 'rgba(230,185,46,0.7)' },
  verifyTitle: { ...typography.body, fontWeight: '700', color: colors.white },
  verifyText: { ...typography.caption, color: colors.textOnNavy, marginTop: 2 },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl + 6,
    borderTopRightRadius: radius.xl + 6,
    paddingHorizontal: gutter,
    paddingTop: spacing.xl,
  },
  version: {
    ...typography.meta,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});
