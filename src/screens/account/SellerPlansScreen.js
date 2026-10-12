/**
 * SellerPlansScreen.js — Igenamigambi ry'ubucuruzi (seller plans/billing).
 *
 * PAID PLANS ARE NOT BUILT. Every seller is on the free plan today — this
 * screen exists so there's a real, honest place to point to once pricing is
 * decided, rather than pretending a billing system exists.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../../components/common/GradientBackground';
import { colors, typography, spacing, radius, gutter } from '../../theme';

export default function SellerPlansScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <GradientBackground>
      <View style={[styles.content, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textOnNavy} />
          </Pressable>
          <Text style={styles.title}>Plans</Text>
        </View>

        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <MaterialCommunityIcons name="gift-outline" size={22} color={colors.success} />
            <Text style={styles.planName}>Free plan</Text>
          </View>
          <Text style={styles.planDescription}>
            Right now, registering your business and showing up in search is free, for as long as you want to use it.
          </Text>
        </View>

        <View style={styles.notice}>
          <MaterialCommunityIcons name="information-outline" size={17} color={colors.blue300} />
          <Text style={styles.noticeText}>
            Paid plans (for example, to place your business higher in search results) are still being prepared. You will be told before any pricing changes.
          </Text>
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: gutter },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.white, letterSpacing: -0.3 },
  planCard: {
    backgroundColor: 'rgba(46,158,91,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(46,158,91,0.35)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  planName: { ...typography.bodyStrong, fontSize: 16, color: colors.white, marginLeft: spacing.sm },
  planDescription: { ...typography.body, color: colors.textOnNavyFaint, lineHeight: 20 },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(55,138,221,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(55,138,221,0.35)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noticeText: {
    flex: 1,
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
    color: colors.blue300,
    marginLeft: spacing.sm,
  },
});
