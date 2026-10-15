/**
 * AppTopBar.js — allinkigali's top bar in the app, so the logo never
 * disappears when you leave the news page.
 *   variant="full"    main tabs (News, Restaurants & Cafés, Me): logo · bell · profile
 *   variant="slim"    inner screens: back arrow · smaller logo in the middle
 *   variant="overlay" slim, see-through, over a big photo (restaurant pages)
 * The logo always leads home (the news page). Wide web keeps its own top
 * navigation, so the bar draws nothing there.
 */
import React from 'react';
import { View, Pressable, Image, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import ProfileChip from '../account/ProfileChip';
import { useUser } from '../../context/UserContext';
import useUnreadNotifications from '../../hooks/useUnreadNotifications';
import useIsWideWeb from '../../web/hooks/useIsWideWeb';
import { colors, spacing, radius } from '../../theme';

const LOGO = require('../../../assets/logo-wordmark.png');

export default function AppTopBar({ variant = 'slim', onBack, style }) {
  const navigation = useNavigation();
  const { user } = useUser();
  const unread = useUnreadNotifications();
  const wide = useIsWideWeb();
  if (wide) return null;

  const goHome = () => navigation.navigate('NewsTab', { screen: 'News' });
  const back = onBack || (() => (navigation.canGoBack() ? navigation.goBack() : goHome()));

  if (variant === 'full') {
    return (
      <View style={[styles.full, style]}>
        <Pressable onPress={goHome} accessibilityRole="link" accessibilityLabel="Home" hitSlop={6}>
          <Image source={LOGO} style={styles.logoFull} resizeMode="contain" />
        </Pressable>
        <View style={styles.right}>
          <Pressable
            onPress={() => navigation.navigate('AccountTab', { screen: 'Notifications' })}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <MaterialCommunityIcons name="bell-outline" size={23} color={colors.blue300} />
            {unread > 0 ? <View style={styles.dot} /> : null}
          </Pressable>
          <ProfileChip
            user={user}
            onPress={() => navigation.navigate('AccountTab', { screen: user ? 'Account' : 'Login' })}
            style={{ marginLeft: spacing.md }}
          />
        </View>
      </View>
    );
  }

  const overlay = variant === 'overlay';
  return (
    <View style={[styles.slim, overlay && styles.slimOverlay, style]}>
      <Pressable onPress={back} hitSlop={10} accessibilityRole="button" accessibilityLabel="Go back" style={[styles.back, overlay && styles.backOverlay]}>
        <MaterialCommunityIcons name="arrow-left" size={20} color={colors.white} />
      </Pressable>
      <Pressable onPress={goHome} accessibilityRole="link" accessibilityLabel="Home" hitSlop={6} style={[styles.centre, overlay && styles.centreOverlay]}>
        <Image source={LOGO} style={styles.logoSlim} resizeMode="contain" />
      </Pressable>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs },
  logoFull: { width: 124, height: 31 },
  right: { flexDirection: 'row', alignItems: 'center' },
  dot: { position: 'absolute', top: 0, right: 0, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.breaking, borderWidth: 1, borderColor: colors.navy800 },

  slim: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  slimOverlay: { position: 'absolute', left: 0, right: 0, zIndex: 20, paddingHorizontal: spacing.md },
  back: { width: 38, height: 38, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  spacer: { width: 38, height: 38 }, // keeps the logo centred
  backOverlay: { backgroundColor: 'rgba(2,28,54,0.55)' },
  centre: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  centreOverlay: { backgroundColor: 'rgba(2,28,54,0.55)' },
  logoSlim: { width: 92, height: 23 },
});
