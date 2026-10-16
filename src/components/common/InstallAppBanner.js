/**
 * InstallAppBanner.js — Shyiraho porogaramu (a dismissible "install this
 * as an app" nudge, web only).
 *
 * There's no published store listing yet, so this is the actual
 * distribution path for now: the site itself is installable (see
 * public/manifest.json). Renders nothing on native (Platform.OS check) and
 * nothing once already installed or dismissed.
 *
 * Android phones and computers with Chrome or Edge get a real "Install"
 * button, wired to the browser's own `beforeinstallprompt` event (a
 * browser that can't install, like Firefox on a computer, never fires it,
 * so nothing shows). Apple exposes no such thing, so iPhones, iPads and
 * Safari on a Mac get a "How?" button opening step-by-step help
 * (install/AppleInstallSteps.js) matched to where they read
 * (install/installDevice.js) — never a button that pretends to do it for
 * you. Phones see a strip at the top; wide screens a card in the bottom
 * corner, since their fixed top bar would cover a strip.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, View, Text, Pressable, Image, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useIsWideWeb from '../../web/hooks/useIsWideWeb';
import { colors, typography, spacing, radius, shadows } from '../../theme';
import { deviceName, hasInstallPrompt, installKind, isInstalled } from './install/installDevice';
import AppleInstallSteps from './install/AppleInstallSteps';

const DISMISSED_KEY = 'allinkigali-install-banner-dismissed';

export default function InstallAppBanner() {
  const insets = useSafeAreaInsets();
  const wide = useIsWideWeb();
  const [kind, setKind] = useState(null); // see install/installDevice.js; null = hidden
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || isInstalled()) return;
    try {
      if (window.localStorage.getItem(DISMISSED_KEY) === '1') return;
    } catch {
      // localStorage can throw in some private-browsing modes — treat as
      // "not dismissed" rather than crashing the banner logic over it.
    }

    const found = installKind();
    if (!hasInstallPrompt(found)) {
      setKind(found);
      return;
    }

    // Chrome/Edge only ever fire this if the browser itself has decided the
    // site is genuinely installable (valid manifest, icons, HTTPS) — so
    // there's nothing to check ourselves beyond listening.
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setKind(found);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = useCallback(() => {
    setKind(null);
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

  if (Platform.OS !== 'web' || !kind) return null;
  const prompt = hasInstallPrompt(kind);
  const device = deviceName(kind);
  const subtitle = prompt
    ? 'Opens fast, just like an app'
    : kind === 'mac-safari' ? 'Add it to your Dock: opens like an app' : 'Add it to your Home Screen: opens like an app';

  return (
    <View style={wide ? styles.card : [styles.strip, { paddingTop: insets.top + spacing.sm }]}>
      <View style={[styles.row, wide && styles.rowWide]}>
        <View style={styles.logoWell}>
          <Image source={require('../../../assets/pwa-192.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
        </View>

        <View style={styles.body}>
          <Text style={[styles.title, wide && styles.titleWide]}>Install allinkigali on your {device}</Text>
          <Text style={[styles.subtitle, wide && styles.subtitleWide]}>{subtitle}</Text>
        </View>

        <Pressable
          onPress={prompt ? handleInstall : () => setShowSteps(true)}
          accessibilityRole="button"
          style={styles.installButton}
        >
          <Text style={styles.installLabel}>{prompt ? 'Install' : 'How?'}</Text>
        </Pressable>

        <Pressable
          onPress={dismiss}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={styles.closeButton}
        >
          <MaterialCommunityIcons name="close" size={16} color={colors.textOnNavyFaint} />
        </Pressable>
      </View>
      {!prompt ? <AppleInstallSteps visible={showSteps} kind={kind} device={device} onClose={() => setShowSteps(false)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    backgroundColor: colors.navy800,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderOnNavy,
    ...shadows.card,
  },
  card: {
    // @ts-ignore — web-only CSS value: stays in the corner while the page scrolls
    position: 'fixed',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 400,
    // @ts-ignore
    zIndex: 150,
    backgroundColor: colors.navy800,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderOnNavy,
    boxShadow: '0 10px 30px rgba(4,44,83,0.35)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  rowWide: { paddingVertical: spacing.md },
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
  titleWide: { fontSize: 14 },
  subtitle: { ...typography.caption, fontSize: 10.5, color: colors.textOnNavyFaint, marginTop: 1 },
  subtitleWide: { fontSize: 12 },
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
