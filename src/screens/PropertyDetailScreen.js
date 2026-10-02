/**
 * PropertyDetailScreen.js — Zillow-style property detail.
 * Full-width photo well takes ~45% of the viewport. Price, key-stats strip,
 * and a prominent Call CTA sit right below. Then: description, home facts
 * table, and a similar-homes horizontal scroll at the bottom.
 */
import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, Linking, Image, StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';

import { useProperties } from '../context/PropertyContext';
import { PROVINCES, findDistrictLabel } from '../data/rwandaLocations';
import { formatPrice } from '../utils/format';
import { colors, typography, spacing, radius, gutter } from '../theme';

const FEATURE_ICONS = {
  Parking: 'car-outline',
  'Water tank': 'water-outline',
  'Solar power': 'solar-power',
  'Borehole water': 'pump',
  'Fenced compound': 'fence',
  Furnished: 'sofa-outline',
  Garden: 'flower-outline',
  'Generator backup': 'lightning-bolt-outline',
  CCTV: 'cctv',
  'Gated community': 'gate',
};

export default function PropertyDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { getPropertyById, properties } = useProperties();
  const listing = getPropertyById(route.params?.id);

  const similar = useMemo(() => {
    if (!listing) return [];
    return properties
      .filter((p) => p.id !== listing.id && p.listingType === listing.listingType)
      .slice(0, 5);
  }, [listing, properties]);

  if (!listing) {
    return (
      <GradientBackground>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>This listing could not be found.</Text>
        </View>
      </GradientBackground>
    );
  }

  const provinceLabel = PROVINCES.find((p) => p.key === listing.province)?.label || listing.province;
  const districtLabel = findDistrictLabel(listing.province, listing.district);
  const isRent = listing.listingType === 'rent';
  const priceSuffix = isRent ? '/mo' : '';

  return (
    <GradientBackground>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.huge }}
      >
        {/* ── Photo area ── */}
        <View style={styles.photoWell}>
          {listing.photos?.[0]?.url
            ? <Image source={{ uri: listing.photos[0].url }} style={styles.photoWellImage} resizeMode="cover" />
            : <MaterialCommunityIcons name={isRent ? 'home-search-outline' : 'home-city-outline'} size={80} color={colors.blue300} />}

          {/* Badge overlay */}
          <View style={styles.listingBadge}>
            <Text style={styles.listingBadgeLabel}>{isRent ? 'For rent' : 'For sale'}</Text>
          </View>

          {/* Back button overlay */}
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={[styles.overlayBtn, { top: insets.top + spacing.sm, left: gutter }]}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.white} />
          </Pressable>

          {/* Share button overlay */}
          <Pressable
            onPress={() => Linking.openURL(`tel:${listing.phone}`)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Share"
            style={[styles.overlayBtn, { top: insets.top + spacing.sm, right: gutter }]}
          >
            <MaterialCommunityIcons name="share-outline" size={20} color={colors.white} />
          </Pressable>
        </View>

        {/* ── Price & address block ── */}
        <View style={styles.mainBlock}>
          <Text style={styles.price}>
            {formatPrice(listing.price)}
            {priceSuffix ? <Text style={styles.priceSuffix}> {priceSuffix}</Text> : null}
          </Text>

          {/* Key facts strip: beds · baths · size */}
          <View style={styles.factsStrip}>
            <Text style={styles.factItem}>
              <Text style={styles.factValue}>{listing.bedrooms}</Text>
              <Text style={styles.factUnit}> {listing.bedrooms === 1 ? 'bed' : 'beds'}</Text>
            </Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.factItem}>
              <Text style={styles.factValue}>{listing.bathrooms}</Text>
              <Text style={styles.factUnit}> {listing.bathrooms === 1 ? 'bath' : 'baths'}</Text>
            </Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.factItem}>
              <Text style={styles.factValue}>{listing.sizeSqm}</Text>
              <Text style={styles.factUnit}> m²</Text>
            </Text>
          </View>

          <Text style={styles.address}>
            {listing.sector}, {districtLabel}, {provinceLabel}
          </Text>

          <Text style={styles.title}>{listing.title}</Text>

          {/* Primary CTA */}
          <Pressable
            onPress={() => Linking.openURL(`tel:${listing.phone}`)}
            accessibilityRole="button"
            accessibilityLabel={`Call ${listing.phone}`}
            style={({ pressed }) => [styles.callBtn, pressed && styles.callBtnPressed]}
          >
            <MaterialCommunityIcons name="phone-outline" size={18} color={colors.white} />
            <Text style={styles.callBtnLabel}>Call {listing.phone}</Text>
          </Pressable>

          {/* WhatsApp secondary CTA */}
          <Pressable
            onPress={() => Linking.openURL(`https://wa.me/250${listing.phone.slice(1)}`)}
            accessibilityRole="button"
            accessibilityLabel="Contact on WhatsApp"
            style={({ pressed }) => [styles.whatsappBtn, pressed && styles.whatsappBtnPressed]}
          >
            <MaterialCommunityIcons name="whatsapp" size={18} color="#25D366" />
            <Text style={styles.whatsappBtnLabel}>Contact on WhatsApp</Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* ── Overview / Description ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.description}>{listing.description}</Text>
        </View>

        <View style={styles.divider} />

        {/* ── Home facts ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Home facts</Text>

          <View style={styles.factsTable}>
            <FactRow icon="bed-outline" label="Bedrooms" value={String(listing.bedrooms)} />
            <FactRow icon="shower" label="Bathrooms" value={String(listing.bathrooms)} />
            <FactRow icon="ruler-square" label="Floor area" value={`${listing.sizeSqm} m²`} />
            <FactRow icon="home-outline" label="Type" value={isRent ? 'Rental' : 'For sale'} />
            <FactRow icon="map-marker-outline" label="Location" value={`${listing.sector}, ${districtLabel}`} />
          </View>
        </View>

        {listing.features?.length ? (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Features & amenities</Text>
              <View style={styles.featuresGrid}>
                {listing.features.map((f) => (
                  <View key={f} style={styles.featureItem}>
                    <View style={styles.featureIconWell}>
                      <MaterialCommunityIcons
                        name={FEATURE_ICONS[f] || 'check-circle-outline'}
                        size={16}
                        color={colors.blue300}
                      />
                    </View>
                    <Text style={styles.featureLabel}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : null}

        {/* ── Photo gallery ── */}
        {listing.photos?.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Photos</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryRow}
            >
              {listing.photos.map((photo, i) => (
                <Pressable
                  key={i}
                  onPress={() => Linking.openURL(photo.url)}
                  accessibilityRole="button"
                  accessibilityLabel={photo.label}
                  style={styles.galleryCard}
                >
                  <View style={styles.galleryImageWell}>
                    {photo.isVideo ? (
                      <View style={styles.galleryVideoWell}>
                        <MaterialCommunityIcons name="play-circle-outline" size={38} color={colors.white} />
                      </View>
                    ) : (
                      <Image
                        source={{ uri: photo.url }}
                        style={styles.galleryImage}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                  <Text style={styles.galleryLabel} numberOfLines={1}>{photo.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {/* ── Similar homes ── */}
        {similar.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Similar {isRent ? 'rentals' : 'homes for sale'}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarRow}
            >
              {similar.map((p) => {
                const pProvLabel = PROVINCES.find((pr) => pr.key === p.province)?.label || p.province;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => navigation.push('PropertyDetail', { id: p.id })}
                    accessibilityRole="button"
                    accessibilityLabel={p.title}
                    style={({ pressed }) => [styles.similarCard, pressed && styles.similarCardPressed]}
                  >
                    <View style={styles.similarImageWell}>
                      <MaterialCommunityIcons name="home-outline" size={28} color={colors.blue300} />
                    </View>
                    <Text style={styles.similarPrice}>
                      {formatPrice(p.price)}{isRent ? '/mo' : ''}
                    </Text>
                    <Text style={styles.similarFacts}>
                      {p.bedrooms} bd · {p.bathrooms} ba · {p.sizeSqm} m²
                    </Text>
                    <Text style={styles.similarAddr} numberOfLines={2}>
                      {p.sector}, {pProvLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

function FactRow({ icon, label, value }) {
  return (
    <View style={styles.factRow}>
      <View style={styles.factRowIcon}>
        <MaterialCommunityIcons name={icon} size={15} color={colors.blue300} />
      </View>
      <Text style={styles.factRowLabel}>{label}</Text>
      <Text style={styles.factRowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { ...typography.body, color: colors.textOnNavy },

  // Photo area
  photoWell: {
    height: 260,
    backgroundColor: 'rgba(55,138,221,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoWellImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  listingBadge: {
    position: 'absolute',
    bottom: spacing.md,
    left: gutter,
    backgroundColor: colors.blue500,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  listingBadgeLabel: { fontSize: 11.5, fontWeight: '700', color: colors.white },
  overlayBtn: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Main content
  mainBlock: { paddingHorizontal: gutter, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  price: { fontSize: 28, fontWeight: '800', color: colors.white, letterSpacing: -0.5 },
  priceSuffix: { fontSize: 15, fontWeight: '400', color: colors.textOnNavyFaint },
  factsStrip: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.xs },
  factItem: {},
  factValue: { fontSize: 15, fontWeight: '700', color: colors.white },
  factUnit: { fontSize: 14, color: colors.textOnNavyFaint },
  dot: { fontSize: 15, color: colors.textOnNavyFaint, marginHorizontal: spacing.sm },
  address: { ...typography.body, color: colors.textOnNavyFaint, marginBottom: spacing.xs },
  title: { ...typography.bodyStrong, fontSize: 15, color: colors.white, marginBottom: spacing.lg },

  // CTAs
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blue500,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  callBtnPressed: { opacity: 0.8 },
  callBtnLabel: { ...typography.bodyStrong, color: colors.white, marginLeft: spacing.sm },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#25D366',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  whatsappBtnPressed: { backgroundColor: 'rgba(37,211,102,0.08)' },
  whatsappBtnLabel: { ...typography.bodyStrong, fontSize: 14, color: colors.white, marginLeft: spacing.sm },

  // Divider
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(133,183,235,0.18)', marginVertical: spacing.xs },

  // Sections
  section: { paddingHorizontal: gutter, paddingVertical: spacing.lg },
  sectionTitle: { ...typography.bodyStrong, fontSize: 16, color: colors.white, marginBottom: spacing.md },
  description: { ...typography.body, fontSize: 13.5, lineHeight: 21, color: colors.textOnNavy },

  // Facts table
  factsTable: { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.22)', borderRadius: radius.md, overflow: 'hidden' },
  factRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(133,183,235,0.15)' },
  factRowIcon: { width: 28, alignItems: 'center' },
  factRowLabel: { flex: 1, fontSize: 13, color: colors.textOnNavyFaint, marginLeft: spacing.sm },
  factRowValue: { fontSize: 13, fontWeight: '600', color: colors.white },

  // Features
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  featureItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
  },
  featureIconWell: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(55,138,221,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  featureLabel: { fontSize: 12.5, color: colors.textOnNavy, flex: 1 },

  // Gallery
  galleryRow: { paddingHorizontal: gutter, paddingBottom: spacing.lg },
  galleryCard: { width: 160, marginRight: spacing.sm },
  galleryImageWell: { height: 110, borderRadius: radius.md, overflow: 'hidden', backgroundColor: 'rgba(55,138,221,0.14)', marginBottom: spacing.xs },
  galleryImage: { width: '100%', height: '100%' },
  galleryVideoWell: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  galleryLabel: { fontSize: 11.5, color: colors.textOnNavy, textAlign: 'center' },

  // Similar homes
  similarRow: { paddingHorizontal: gutter, paddingBottom: spacing.lg },
  similarCard: {
    width: 170,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  similarCardPressed: { backgroundColor: 'rgba(255,255,255,0.14)' },
  similarImageWell: {
    height: 90,
    backgroundColor: 'rgba(55,138,221,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  similarPrice: { fontSize: 14, fontWeight: '700', color: colors.white, paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
  similarFacts: { fontSize: 11.5, color: colors.textOnNavyFaint, paddingHorizontal: spacing.sm, marginTop: 2 },
  similarAddr: { fontSize: 11, color: colors.textOnNavyFaint, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm, marginTop: 2, lineHeight: 15 },
});
