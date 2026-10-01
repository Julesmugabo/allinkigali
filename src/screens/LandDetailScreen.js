/**
 * LandDetailScreen.js — One Ibibanza plot, full details.
 */
import React from 'react';
import { View, Text, ScrollView, Pressable, Linking, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import PrimaryButton from '../components/common/PrimaryButton';

import { LAND_LISTINGS, LAND_TYPES } from '../data/landListings';
import { PROVINCES, findDistrictLabel } from '../data/rwandaLocations';
import { formatPrice } from '../utils/format';
import { colors, typography, spacing, radius, gutter } from '../theme';

export default function LandDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const listing = LAND_LISTINGS.find((l) => l.id === route.params?.id);

  if (!listing) {
    return (
      <GradientBackground>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>This plot could not be found.</Text>
        </View>
      </GradientBackground>
    );
  }

  const typeMeta = LAND_TYPES[listing.type];
  const provinceLabel = PROVINCES.find((p) => p.key === listing.province)?.label || listing.province;
  const districtLabel = findDistrictLabel(listing.province, listing.district);

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.huge }]}
        showsVerticalScrollIndicator={false}
      >
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
        </View>

        <View style={styles.imageWell}>
          <MaterialCommunityIcons name={typeMeta.icon} size={64} color={colors.blue300} />
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>{typeMeta.label}</Text>
          </View>
          <View style={[styles.badge, listing.titled ? styles.badgeGood : styles.badgeWarn]}>
            <MaterialCommunityIcons
              name={listing.titled ? 'file-check-outline' : 'file-clock-outline'}
              size={12}
              color={listing.titled ? colors.success : colors.warning}
            />
            <Text style={[styles.badgeLabel, { marginLeft: 4, color: listing.titled ? colors.success : colors.warning }]}>
              {listing.titled ? 'Titled land' : 'Title in progress'}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.location}>
          {listing.sector}, {districtLabel}, {provinceLabel}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{listing.sizeSqm.toLocaleString()} m²</Text>
            <Text style={styles.statLabel}>Size</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatPrice(listing.price)}</Text>
            <Text style={styles.statLabel}>Price</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>About this plot</Text>
        <Text style={styles.description}>{listing.description}</Text>

        <PrimaryButton
          label={`Call ${listing.phone}`}
          icon="phone"
          onPress={() => Linking.openURL(`tel:${listing.phone}`)}
          style={styles.callButton}
        />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { ...typography.body, color: colors.textOnNavy },
  topBar: { marginBottom: spacing.md },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWell: {
    height: 180,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(55,138,221,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  badgeRow: { flexDirection: 'row', marginBottom: spacing.md },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(133,183,235,0.18)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginRight: spacing.sm,
  },
  badgeGood: { backgroundColor: 'rgba(46,158,91,0.18)' },
  badgeWarn: { backgroundColor: 'rgba(186,117,23,0.18)' },
  badgeLabel: { fontSize: 11, fontWeight: '600', color: colors.blue300 },
  title: { ...typography.screenTitle, fontSize: 20, lineHeight: 26, color: colors.white, marginBottom: spacing.xs },
  location: { ...typography.body, color: colors.textOnNavyFaint, marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginRight: spacing.sm,
  },
  statValue: { ...typography.bodyStrong, fontSize: 15, color: colors.white },
  statLabel: { ...typography.caption, color: colors.textOnNavyFaint, marginTop: 2 },
  sectionLabel: { ...typography.bodyStrong, fontSize: 14, color: colors.white, marginBottom: spacing.sm },
  description: { ...typography.body, fontSize: 13.5, lineHeight: 21, color: colors.textOnNavy, marginBottom: spacing.xl },
  callButton: { marginBottom: spacing.xl },
});
