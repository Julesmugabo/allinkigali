/**
 * FeedSkeleton.js — Ibyo tureba mu gihe amakuru agitegurwa (news loading state).
 *
 * Grey placeholder shapes in the same layout as the real feed (a hero block
 * then a few list rows), gently pulsing, so the screen shows something
 * honest while the first fetch is in flight instead of a "no news" message.
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, Platform, StyleSheet } from 'react-native';

import { colors, spacing, radius } from '../../theme';

function Row() {
  return (
    <View style={styles.row}>
      <View style={styles.thumb} />
      <View style={styles.rowBody}>
        <View style={[styles.line, { width: '35%' }]} />
        <View style={[styles.line, { width: '95%' }]} />
        <View style={[styles.line, { width: '70%' }]} />
      </View>
    </View>
  );
}

export default function FeedSkeleton() {
  const pulse = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulse, { toValue: 0.55, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View style={{ opacity: pulse }} accessibilityLabel="Amakuru agiye kuboneka">
      <View style={styles.hero}>
        <View style={styles.heroImage} />
        <View style={styles.heroBody}>
          <View style={[styles.lineOnNavy, { width: '90%' }]} />
          <View style={[styles.lineOnNavy, { width: '60%' }]} />
        </View>
      </View>
      <View style={styles.section} />
      <Row />
      <Row />
      <Row />
      <Row />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.navy800, borderRadius: radius.lg, overflow: 'hidden' },
  heroImage: { height: 168, backgroundColor: colors.navy700 },
  heroBody: { padding: spacing.md },
  lineOnNavy: { height: 12, borderRadius: 6, backgroundColor: 'rgba(133,183,235,0.25)', marginBottom: spacing.sm },
  section: { width: 110, height: 10, borderRadius: 5, backgroundColor: colors.border, marginTop: spacing.xl, marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md - 2,
    marginBottom: spacing.sm,
  },
  thumb: { width: 58, height: 58, borderRadius: radius.sm, backgroundColor: colors.border },
  rowBody: { flex: 1, marginLeft: spacing.md - 2, justifyContent: 'center' },
  line: { height: 10, borderRadius: 5, backgroundColor: colors.border, marginBottom: spacing.sm },
});
