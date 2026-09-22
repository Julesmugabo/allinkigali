/**
 * InstallAppBanner.js — Shyiraho porogaramu (a dismissible "install this
 * as an app" nudge, web only).
 *
 * There's no published store listing yet, so this is the actual
 * distribution path for now: the site itself is installable (see
 * public/manifest.json). Renders nothing on native (Platform.OS check) and
 * nothing once already installed, already dismissed, or on desktop — this
 * is a mobile-web nudge specifically, not a general "download our app" ad.
 *
 * Android/Chrome gets a real "Install" button, wired to the browser's own
 * `beforeinstallprompt` event. iOS Safari has no equivalent API at all —
 * Apple doesn't expose one — so iOS gets instructions instead
 * ("Share -> Add to Home Screen"), never a button that pretends to do it
 * for you.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BrandLogo from '../news/BrandLogo';
import { colors, typography, spacing, radius, shadows } from '../../theme';

const DISMISSED_KEY = 'allinkigali-install-banner-dismissed';

function isMobileUserAgent() {
  return /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent || '');
}

function isIOS() {
  return /iPhone|iPad|iPod/i.test(window.navigator.userAgent || '');
}

function isAlreadyInstalled() {
  // Chrome/Android: the page is running in standalone display mode.
  // iOS Safari: its own non-standard flag for the exact same thing.
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export default function InstallAppBanner() {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState(null); // 'android' | 'ios'
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (isAlreadyInstalled() || !isMobileUserAgent()) return;

    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(DISMISSED_KEY) === '1';
    } catch {
      // localStorage can throw in some private-browsing modes — treat as
      // "not dismissed" rather than crashing the banner logic over it.
    }
    if (dismissed) return;

    if (isIOS()) {
      setPlatform('ios');
      setVisible(true);
      return;
    }

    // Android/Chrome only ever fires this if the browser itself has
    // decided the site is genuinely installable (valid manifest, icons,
    // HTTPS) — so there's nothing to check ourselves beyond listening.
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform('android');
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // not worth surfacing — worst case it asks again next visit
    }
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }, [deferredPrompt, dismiss]);

  if (Platform.OS !== 'web' || !visible) return null;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        <View style={styles.logoWell}>
          <BrandLogo size={26} />
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>Shyiraho allinkigali kuri telefone yawe</Text>
          <Text style={styles.subtitle}>
            {platform === 'ios'
              ? "Kanda 󰒖 Share hanyuma uhitemo \"Add to Home Screen\""
              : 'Nta interineti ikenewe buri gihe — ifungura vuba nk\'app'}
          </Text>
        </View>

        {platform === 'android' ? (
          <Pressable onPress={handleInstall} accessibilityRole="button" style={styles.installButton}>
            <Text style={styles.installLabel}>Install</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={dismiss}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Funga"
          style={styles.closeButton}
        >
          <MaterialCommunityIcons name="close" size={16} color={colors.textOnNavyFaint} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.navy800,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderOnNavy,
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  logoWell: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.overlayOnNavy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  body: { flex: 1, marginRight: spacing.sm },
  title: { ...typography.bodyStrong, fontSize: 12.5, color: colors.white },
  subtitle: { ...typography.caption, fontSize: 10.5, color: colors.textOnNavyFaint, marginTop: 1 },
  installButton: {
    backgroundColor: colors.blue500,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  installLabel: { fontSize: 12, fontWeight: '700', color: colors.white },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
