/**
 * TopNavBar.js — wide-web replacement for BottomTabBar.
 *
 * Reads the exact same {state, descriptors, navigation} the bottom tab bar
 * gets, so the section list (icon, label, order) can never drift between the
 * two — there is only ever one definition of the app's sections, in
 * RootNavigator's <Tab.Screen> options.
 *
 * Pinned to the top of the viewport (web-only CSS position: fixed) so the
 * scene below it can scroll underneath; RootNavigator adds matching
 * paddingTop to the scene container so content doesn't start under the bar.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import WebContainer from '../layout/WebContainer';
import useUnreadNotifications from '../../hooks/useUnreadNotifications';
import { useUser } from '../../context/UserContext';
import ProfileChip from '../../components/account/ProfileChip';
import { colors, typography, spacing, radius } from '../../theme';

export const TOP_NAV_HEIGHT = 60;

export default function TopNavBar({ state, descriptors, navigation }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useUser();
  const unreadCount = useUnreadNotifications();

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const goToAccountScreen = useCallback(
    (screen) => {
      closeMenu();
      navigation.navigate('AccountTab', { screen });
    },
    [navigation, closeMenu]
  );

  const handleSignOut = useCallback(async () => {
    closeMenu();
    await signOut();
  }, [signOut, closeMenu]);

  return (
    <View style={styles.bar}>
      <WebContainer style={styles.row}>
        <Pressable
          onPress={() => navigation.navigate('NewsTab')}
          accessibilityRole="link"
          style={styles.brand}
        >
          <Image
            source={require('../../../assets/logo-wordmark.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Pressable>

        <View style={styles.sections}>
          {state.routes.map((route, index) => {
            if (route.name === 'AccountTab') return null; // the profile chip on the right does this
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const label = options.tabLabel || route.name;
            const iconName = isFocused ? options.tabIconActive || options.tabIcon : options.tabIcon;

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                accessibilityRole="link"
                accessibilityState={{ selected: isFocused }}
                style={({ hovered }) => [styles.sectionItem, isFocused && styles.sectionItemActive, hovered && !isFocused && styles.sectionItemHover]}
              >
                <MaterialCommunityIcons
                  name={iconName}
                  size={20}
                  color={colors.white}
                />
                <Text style={[styles.sectionLabel, isFocused && styles.sectionLabelActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => goToAccountScreen('Notifications')}
            accessibilityRole="button"
            accessibilityLabel="Amatangazo"
            style={styles.bellWell}
          >
            <MaterialCommunityIcons name="bell-outline" size={20} color={colors.blue300} />
            {unreadCount > 0 ? <View style={styles.bellDot} /> : null}
          </Pressable>

          {user ? (
            <View>
              <ProfileChip user={user} onPress={() => setMenuOpen((v) => !v)} />

              {menuOpen ? (
                <>
                  <Pressable style={styles.menuBackdrop} onPress={closeMenu} />
                  <View style={styles.menu}>
                    <Text style={styles.menuName} numberOfLines={1}>
                      {user.firstName} {user.lastName}
                    </Text>
                    <Pressable onPress={() => goToAccountScreen('Account')} style={styles.menuItem}>
                      <Text style={styles.menuItemText}>My profile</Text>
                    </Pressable>
                    <Pressable onPress={handleSignOut} style={styles.menuItem}>
                      <Text style={[styles.menuItemText, styles.menuItemDanger]}>Log out</Text>
                    </Pressable>
                  </View>
                </>
              ) : null}
            </View>
          ) : (
            <ProfileChip user={null} onPress={() => goToAccountScreen('Login')} />
          )}
        </View>
      </WebContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    // @ts-ignore — web-only CSS value, ignored by the native style parser
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    // @ts-ignore
    zIndex: 100,
    height: TOP_NAV_HEIGHT,
    backgroundColor: colors.navy800,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderOnNavy,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TOP_NAV_HEIGHT,
  },
  // Logo and actions take equal room either side, so the sections sit in the exact middle.
  brand: { flex: 1, alignItems: 'flex-start' },
  logo: { width: 80, height: 28 },
  sections: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: '100%', gap: spacing.sm },
  // Big, clear buttons: the two halves of allinkigali.
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  sectionItemActive: { backgroundColor: colors.blue500 },
  sectionItemHover: { backgroundColor: 'rgba(255,255,255,0.10)' },
  sectionLabel: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
  },
  sectionLabelActive: {
    color: colors.white,
    fontWeight: '700',
  },
  sectionUnderline: {
    position: 'absolute',
    bottom: 0,
    left: spacing.lg,
    right: spacing.lg,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.blue500,
  },
  actions: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.lg },
  bellWell: { padding: spacing.xs },
  bellDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.breaking,
    borderWidth: 1.5,
    borderColor: colors.navy800,
  },
  avatarButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.blue500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  signInButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.blue500,
  },
  signInText: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  menuBackdrop: {
    // @ts-ignore
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // @ts-ignore
    zIndex: 100,
  },
  menu: {
    position: 'absolute',
    top: 40,
    right: 0,
    minWidth: 180,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    // @ts-ignore — web-only CSS, ignored by the native style parser
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
    // @ts-ignore
    zIndex: 101,
  },
  menuName: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  menuItemText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textPrimary,
  },
  menuItemDanger: {
    color: colors.danger,
  },
});
