/**
 * ProfileChip.js — top-right corner of the app and the website: a signed-in
 * person sees their picture (or initials) and first name; someone signed out
 * sees "Sign in". Tapping either goes where `onPress` says.
 */
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../theme';

const initials = (u) => `${(u.firstName || '').charAt(0)}${(u.lastName || '').charAt(0)}`.toUpperCase() || '?';

export default function ProfileChip({ user, onPress, style }) {
  if (!user) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Sign in" style={[styles.signIn, style]}>
        <Text style={styles.signInText}>Sign in</Text>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`My profile, ${user.firstName || ''}`} style={[styles.chip, style]}>
      <View style={styles.avatar}>
        {user.avatarUrl
          ? <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
          : <Text style={styles.initials}>{initials(user)}</Text>}
      </View>
      <Text style={styles.name} numberOfLines={1}>{user.firstName || 'Me'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 170,
    paddingLeft: 3, paddingRight: spacing.md, paddingVertical: 3,
    borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.10)',
  },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.blue500, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 28, height: 28 },
  initials: { fontSize: 12, fontWeight: '700', color: colors.white },
  name: { fontSize: 13.5, fontWeight: '600', color: colors.white, flexShrink: 1 },
  signIn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.blue500 },
  signInText: { fontSize: 13, fontWeight: '600', color: colors.white },
});
