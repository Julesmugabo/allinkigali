/**
 * PropertyDetailScreen.js — One house, for rent or for sale. Works for
 * either listingType — only the price suffix changes.
 */
import React from 'react';
import { View, Text, ScrollView, Pressable, Linking, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import PrimaryButton from '../components/common/PrimaryButton';

import { useProperties } from '../context/PropertyContext';
import { PROVINCES, findDistrictLabel } from '../data/rwandaLocations';
import { formatPrice } from '../utils/format';
import { colors, typography, spacing, radius, gutter } from '../theme';

export default function PropertyDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { getPropertyById } = useProperties();
  const listing = getPropertyById(route.params?.id);

  if (!listing) {
    return (
      <GradientBackground>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>This house could not be found.</Text>
        </View>
      </GradientBackground>
    );
  }

  const provinceLabel = PROVINCES.find((p) => p.key === listing.province)?.label || listing.province;
  const districtLabel = findDistrictLabel(listing.province, listing.district);
  const priceSuffix = listing.listingType === 'rent' ? '/month' : '';

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
          <MaterialCommunityIcons name="home-outline" size={64} color={colors.blue300} />
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{listing.listingType === 'rent' ? 'For rent' : 'For sale'}</Text>
        </View>

        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.location}>
          {listing.sector}, {districtLabel}, {provinceLabel}
        </Text>

        <Text style={styles.price}>
          {formatPrice(listing.price)}
          {priceSuffix}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="bed-outline" size={18} color={colors.blue300} />
            <Text style={styles.statValue}>{listing.bedrooms}</Text>
            <Text style={styles.statLabel}>Bedrooms</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="shower" size={18} color={colors.blue300} />
            <Text style={styles.statValue}>{listing.bathrooms}</Text>
            <Text style={styles.statLabel}>Bathrooms</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="ruler-square" size={18} color={colors.blue300} />
            <Text style={styles.statValue}>{listing.sizeSqm}</Text>
            <Text style={styles.statLabel}>m²</Text>
          </View>
        </View>

        {listing.features?.length ? (
          <>
            <Text style={styles.sectionLabel}>Features</Text>
            <View style={styles.featuresRow}>
              {listing.features.map((f) => (
                <View key={f} style={styles.featureChip}>
                  <Text style={styles.featureChipLabel}>{f}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.sectionLabel}>Description</Text>
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
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(133,183,235,0.18)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginBottom: spacing.md,
  },
  badgeLabel: { fontSize: 11, fontWeight: '600', color: colors.blue300 },
  title: { ...typography.screenTitle, fontSize: 20, lineHeight: 26, color: colors.white, marginBottom: spacing.xs },
  location: { ...typography.body, color: colors.textOnNavyFaint, marginBottom: spacing.sm },
  price: { ...typography.screenTitle, fontSize: 22, color: colors.blue300, marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginRight: spacing.sm,
  },
  statValue: { ...typography.bodyStrong, fontSize: 15, color: colors.white, marginTop: spacing.xs },
  statLabel: { ...typography.caption, color: colors.textOnNavyFaint, marginTop: 2 },
  sectionLabel: { ...typography.bodyStrong, fontSize: 14, color: colors.white, marginBottom: spacing.sm },
  featuresRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg },
  featureChip: {
    backgroundColor: 'rgba(133,183,235,0.14)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  featureChipLabel: { fontSize: 11.5, color: colors.blue300 },
  description: { ...typography.body, fontSize: 13.5, lineHeight: 21, color: colors.textOnNavy, marginBottom: spacing.xl },
  callButton: { marginBottom: spacing.xl },
});
