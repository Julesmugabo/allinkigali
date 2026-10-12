/**
 * AboutUsScreen.js — About Us page.
 */
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../../components/common/GradientBackground';
import { colors, spacing, gutter } from '../../theme';

function B({ children }) {
  return <Text style={styles.bold}>{children}</Text>;
}

export default function AboutUsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={8}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>About Us</Text>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>Discover more. Experience more. Feel more connected.</Text>

          <Text style={styles.body}>
            At <B>allinkigali</B>, we believe that discovering something new can change the way we see the world. Whether it's understanding what's happening beyond Rwanda's borders or finding a new restaurant, a cozy coffee shop, or a beautiful place to explore in Kigali, we want to make discovery easier for everyone.
          </Text>

          <Text style={styles.body}>
            Our goal is simple: <B>to help people stay informed, discover great places, and make the most of life in Kigali.</B>
          </Text>

          <Text style={styles.body}>
            We bring together international news and local experiences in one place. Through our news section, we help you stay connected to important stories from around the world, across different sectors and interests. Through our places section, we help you discover the restaurants, coffee shops, and hidden gems that make Kigali special.
          </Text>

          <Text style={styles.body}>
            But allinkigali is about more than information and recommendations. It's about helping people find new experiences, supporting local businesses by making them easier to discover, and connecting people with the opportunities and places around them.
          </Text>

          <Text style={styles.body}>
            We believe that useful information should be accessible, that great local businesses deserve to be discovered, and that exploring your own city should be exciting and easy.
          </Text>

          <Text style={styles.body}>
            <B>We are here to serve people first.</B> While we hope to grow into a sustainable platform, our priority is to create something genuinely useful—something that saves you time, inspires you to explore, and adds value to your everyday life.
          </Text>

          <Text style={styles.body}>
            Whether you live in Kigali, are visiting for the first time, or simply want to stay connected to the wider world, we're happy you're here.
          </Text>

          <Text style={styles.tagline}>
            <B>allinkigali, your window to the world, and your guide to discovering Kigali.</B>
          </Text>
        </ScrollView>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: gutter, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(133,183,235,0.22)',
  },
  back: { padding: 4, marginRight: spacing.sm },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.white },
  content: { paddingHorizontal: gutter, paddingTop: spacing.lg },
  heading: {
    fontSize: 18, fontWeight: '700', color: colors.white,
    lineHeight: 26, marginBottom: spacing.lg,
  },
  body: {
    fontSize: 14.5, lineHeight: 23, color: colors.textOnNavy,
    marginBottom: spacing.md,
  },
  bold: { fontWeight: '700', color: colors.white },
  tagline: {
    fontSize: 15, lineHeight: 23, color: colors.textOnNavy,
    marginTop: spacing.md, marginBottom: spacing.lg,
    textAlign: 'center',
  },
});
