/**
 * ProfileHeader.js — Umutwe werekana konti y'umukoresha.
 * Avatar (initials), name, email, and a compact summary of the user's service requests.
 */
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { initials, fullName } from '../../utils/format';
import { colors, typography, spacing, radius } from '../../theme';

function Stat({ value, label, icon }) {
  return (
    <View style={styles.stat}>
      <MaterialCommunityIcons name={icon} size={16} color={colors.blue300} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileHeader({ user, waitingCount = 0, handledCount = 0 }) {
  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.identity}>
        <View style={styles.avatar}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{initials(user.firstName, user.lastName)}</Text>
          )}
        </View>

        <View style={styles.identityText}>
          <Text style={styles.name} numberOfLines={1}>
            {fullName(user)}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {user.email}
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat value={waitingCount} label="Requests waiting" icon="clock-outline" />
        <View style={styles.statDivider} />
        <Stat value={handledCount} label="Requests handled" icon="check-circle-outline" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  identity: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.blue500,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  identityText: { flex: 1, marginLeft: spacing.lg },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.3,
  },
  email: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textOnNavyFaint,
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(133,183,235,0.2)',
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: 10.5,
    color: colors.textOnNavyFaint,
    marginTop: 1,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 34,
    backgroundColor: 'rgba(133,183,235,0.22)',
  },
});
