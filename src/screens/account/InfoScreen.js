/**
 * InfoScreen.js — Simple read-only text page. Used for Help & FAQ and
 * Terms & privacy (route param `kind`: 'help' | 'privacy').
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../../components/common/GradientBackground';
import SettingsHeader from '../../components/account/SettingsHeader';

import { HELP, PRIVACY } from '../../data/infoContent';
import { colors, typography, spacing, radius, gutter } from '../../theme';

export default function InfoScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const content = route.params?.kind === 'privacy' ? PRIVACY : HELP;

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: spacing.huge }]}
        showsVerticalScrollIndicator={false}
      >
        <SettingsHeader title={content.title} onBack={() => navigation.goBack()} />

        {content.sections.map((section) => (
          <View key={section.heading} style={styles.card}>
            <Text style={styles.heading}>{section.heading}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  heading: { ...typography.bodyStrong, fontSize: 14, color: colors.white, marginBottom: spacing.xs },
  body: { ...typography.body, fontSize: 13.5, lineHeight: 20, color: colors.textOnNavy },
});
