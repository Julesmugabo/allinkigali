/**
 * AppleInstallSteps.js — the "How?" sheet for Apple devices: step by step,
 * with the same icons the device shows, to add allinkigali to the iPhone or
 * iPad Home Screen, or to a Mac's Dock. The steps follow where the person is
 * reading (Safari, another browser, inside another app, or Safari on a Mac
 * — see installDevice.js). A bottom sheet on phones, centred on wide screens.
 */
import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import useIsWideWeb from '../../../web/hooks/useIsWideWeb';
import { colors, typography, spacing, radius } from '../../../theme';

const SHARE = { icon: 'export-variant', title: 'Tap the Share button' };
const ADD = { icon: 'plus-box-outline', title: 'Tap "Add to Home Screen"', detail: "Scroll down the list if you don't see it at first." };
const DONE = { icon: 'check-circle-outline', title: 'Tap "Add"', detail: 'allinkigali appears on your Home Screen. Open it from there: full screen, just like an app.' };

function stepsFor(kind, device) {
  if (kind === 'mac-safari') {
    return [
      { icon: 'menu', title: 'Click "File" in the menu bar', detail: "At the very top of your screen, while Safari is open. (The Share button in Safari's toolbar works too.)" },
      { icon: 'dock-bottom', title: 'Click "Add to Dock"' },
      { icon: 'check-circle-outline', title: 'Click "Add"', detail: 'allinkigali appears in your Dock and opens in its own window, like an app.' },
    ];
  }
  if (kind === 'ios-in-app') {
    return [
      { icon: 'apple-safari', title: 'Open this page in Safari', detail: 'You are reading inside another app, which cannot add to the Home Screen. Tap ⋯ or the menu and choose "Open in Safari" (or "Open in browser").' },
      { ...SHARE, detail: 'In Safari: the square with an arrow pointing up.' },
      ADD,
      DONE,
    ];
  }
  if (kind === 'ios-browser') {
    return [
      { ...SHARE, detail: 'In Chrome it is in the address bar at the top; in other browsers, look in the menu.' },
      ADD,
      DONE,
    ];
  }
  const where = device === 'iPad' ? 'at the top right of Safari' : 'at the bottom of Safari. If you only see ⋯, tap it, then Share';
  return [{ ...SHARE, detail: `The square with an arrow pointing up, ${where}.` }, ADD, DONE];
}

export default function AppleInstallSteps({ visible, kind, device, onClose }) {
  const wide = useIsWideWeb();
  const mac = kind === 'mac-safari';
  const steps = stepsFor(kind, device);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, wide && styles.backdropWide]} onPress={onClose} accessibilityLabel="Close">
        <Pressable style={[styles.card, wide && styles.cardWide]} onPress={() => {}}>
          <View style={styles.head}>
            <MaterialCommunityIcons name="apple" size={20} color={colors.textPrimary} />
            <Text style={styles.title}>{mac ? 'Add allinkigali to your Dock' : `Add allinkigali to your ${device || 'iPhone'}`}</Text>
          </View>

          {steps.map((s, i) => (
            <View key={s.title} style={styles.step}>
              <View style={styles.number}><Text style={styles.numberText}>{i + 1}</Text></View>
              <View style={styles.stepBody}>
                <View style={styles.stepTitleRow}>
                  <MaterialCommunityIcons name={s.icon} size={20} color={colors.blue600} />
                  <Text style={styles.stepTitle}>{s.title}</Text>
                </View>
                {s.detail ? <Text style={styles.stepDetail}>{s.detail}</Text> : null}
              </View>
            </View>
          ))}

          {mac ? (
            <Text style={styles.note}>
              No "Add to Dock"? It needs macOS Sonoma or newer. Chrome and Edge on a Mac can install allinkigali too.
            </Text>
          ) : kind !== 'ios-in-app' ? (
            <Text style={styles.note}>
              No "Add to Home Screen" in the list? Open allinkigali.rw in the Safari app and try again.
            </Text>
          ) : null}

          <Pressable onPress={onClose} accessibilityRole="button" style={styles.button}>
            <Text style={styles.buttonText}>Got it</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(4,44,83,0.55)', justifyContent: 'flex-end', alignItems: 'center' },
  backdropWide: { justifyContent: 'center', padding: spacing.lg },
  card: {
    width: '100%', maxWidth: 480, backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl,
  },
  cardWide: { borderRadius: radius.lg, paddingBottom: spacing.lg },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  title: { ...typography.bodyStrong, fontSize: 16, color: colors.textPrimary, marginLeft: spacing.xs },
  step: { flexDirection: 'row', marginBottom: spacing.md },
  number: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.blue100,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm, marginTop: 1,
  },
  numberText: { fontSize: 12, fontWeight: '700', color: colors.blue600 },
  stepBody: { flex: 1 },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center' },
  stepTitle: { ...typography.bodyStrong, fontSize: 14, color: colors.textPrimary, marginLeft: 6 },
  stepDetail: { ...typography.caption, fontSize: 12.5, color: colors.textSecondary, marginTop: 3, lineHeight: 18 },
  note: { ...typography.caption, fontSize: 12, color: colors.textMuted, marginBottom: spacing.md },
  button: {
    backgroundColor: colors.blue500, borderRadius: radius.pill, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  buttonText: { fontSize: 15, fontWeight: '700', color: colors.white },
});
