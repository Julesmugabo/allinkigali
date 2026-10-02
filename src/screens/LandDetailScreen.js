/**
 * LandDetailScreen.js — One Ibibanza plot, Zillow-style detail layout:
 * full-width photo area, bold price + size strip, Call & WhatsApp CTAs,
 * plot facts table, and similar plots at the bottom.
 */
import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, Linking, Image, StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';

import { useLand } from '../context/LandContext';
import { LAND_TYPES } from '../data/landListings';
import { PROVINCES, findDistrictLabel } from '../data/rwandaLocations';
import { formatPrice } from '../utils/format';
import { colors, typography, spacing, radius, gutter } from '../theme';

export default function LandDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { listings, getLandById } = useLand();
  const listing = getLandById(route.params?.id);

  const similar = useMemo(() => {
    if (!listing) return [];
    return listings
      .filter((l) => l.id !== listing.id && l.province === listing.province)
      .slice(0, 5);
  }, [listing, listings]);

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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.huge }}
      >
        {/* ── Photo area ── */}
        <View style={styles.photoWell}>
          {listing.photos?.[0]?.url
            ? <Image source={{ uri: listing.photos[0].url }} style={styles.photoWellImage} resizeMode="cover" />
            : <MaterialCommunityIcons name={typeMeta.icon} size={80} color={colors.blue300} />}

          {/* Type badge */}
          <View style={styles.listingBadge}>
            <Text style={styles.listingBadgeLabel}>{typeMeta.label}</Text>
          </View>

          {/* Titled / Title in progress badge */}
          <View style={[styles.titledBadge, listing.titled ? styles.titledBadgeGood : styles.titledBadgeWarn]}>
            <MaterialCommunityIcons
              name={listing.titled ? 'file-check-outline' : 'file-clock-outline'}
              size={11}
              color={listing.titled ? colors.success : colors.warning}
            />
            <Text style={[styles.titledBadgeLabel, { color: listing.titled ? colors.success : colors.warning }]}>
              {listing.titled ? 'Titled land' : 'Title in progress'}
            </Text>
          </View>

          {/* Back */}
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={[styles.overlayBtn, { top: insets.top + spacing.sm, left: gutter }]}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.white} />
          </Pressable>

          {/* Share */}
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
          <Text style={styles.price}>{formatPrice(listing.price)}</Text>

          {/* Key facts strip */}
          <View style={styles.factsStrip}>
            <Text style={styles.factItem}>
              <Text style={styles.factValue}>{listing.sizeSqm.toLocaleString()}</Text>
              <Text style={styles.factUnit}> m²</Text>
            </Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.factItem}>
              <Text style={styles.factUnit}>Land for sale</Text>
            </Text>
          </View>

          <Text style={styles.address}>
            {listing.sector}, {districtLabel}, {provinceLabel}
          </Text>
          <Text style={styles.title}>{listing.title}</Text>

          {/* CTAs */}
          <Pressable
            onPress={() => Linking.openURL(`tel:${listing.phone}`)}
            accessibilityRole="button"
            accessibilityLabel={`Call ${listing.phone}`}
            style={({ pressed }) => [styles.callBtn, pressed && styles.callBtnPressed]}
          >
            <MaterialCommunityIcons name="phone-outline" size={18} color={colors.white} />
            <Text style={styles.callBtnLabel}>Call {listing.phone}</Text>
          </Pressable>

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

        {/* ── About ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this plot</Text>
          <Text style={styles.description}>{listing.description}</Text>
        </View>

        <View style={styles.divider} />

        {/* ── Plot facts ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plot facts</Text>
          <View style={styles.factsTable}>
            <FactRow icon="ruler-square-compass" label="Size" value={`${listing.sizeSqm.toLocaleString()} m²`} />
            <FactRow icon={typeMeta.icon} label="Type" value={typeMeta.label} />
            <FactRow
              icon={listing.titled ? 'file-check-outline' : 'file-clock-outline'}
              label="Title deed"
              value={listing.titled ? 'Titled' : 'Title in progress'}
            />
            <FactRow icon="map-marker-outline" label="Location" value={`${listing.sector}, ${districtLabel}`} />
            <FactRow icon="earth" label="Province" value={provinceLabel} />
          </View>
        </View>

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

        {/* ── Similar plots ── */}
        {similar.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>More plots in {provinceLabel}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarRow}
            >
              {similar.map((p) => {
                const pm = LAND_TYPES[p.type];
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => navigation.push('LandDetail', { id: p.id })}
                    accessibilityRole="button"
                    accessibilityLabel={p.title}
                    style={({ pressed }) => [styles.similarCard, pressed && styles.similarCardPressed]}
                  >
                    <View style={styles.similarImageWell}>
                      <MaterialCommunityIcons name={pm.icon} size={28} color={colors.blue300} />
                    </View>
                    <Text style={styles.similarPrice}>{formatPrice(p.price)}</Text>
                    <Text style={styles.similarFacts}>{p.sizeSqm.toLocaleString()} m² · {pm.label}</Text>
                    <Text style={styles.similarAddr} numberOfLines={2}>{p.sector}, {provinceLabel}</Text>
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
  titledBadge: {
    position: 'absolute',
    bottom: spacing.md,
    right: gutter,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    gap: 4,
  },
  titledBadgeGood: { backgroundColor: 'rgba(46,158,91,0.25)' },
  titledBadgeWarn: { backgroundColor: 'rgba(186,117,23,0.25)' },
  titledBadgeLabel: { fontSize: 10.5, fontWeight: '700' },
  overlayBtn: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  mainBlock: { paddingHorizontal: gutter, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  price: { fontSize: 28, fontWeight: '800', color: colors.white, letterSpacing: -0.5, marginBottom: spacing.sm },
  factsStrip: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  factItem: {},
  factValue: { fontSize: 15, fontWeight: '700', color: colors.white },
  factUnit: { fontSize: 14, color: colors.textOnNavyFaint },
  dot: { fontSize: 15, color: colors.textOnNavyFaint, marginHorizontal: spacing.sm },
  address: { ...typography.body, color: colors.textOnNavyFaint, marginBottom: spacing.xs },
  title: { ...typography.bodyStrong, fontSize: 15, color: colors.white, marginBottom: spacing.lg },

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

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(133,183,235,0.18)', marginVertical: spacing.xs },

  section: { paddingHorizontal: gutter, paddingVertical: spacing.lg },
  sectionTitle: { ...typography.bodyStrong, fontSize: 16, color: colors.white, marginBottom: spacing.md },
  description: { ...typography.body, fontSize: 13.5, lineHeight: 21, color: colors.textOnNavy },

  factsTable: { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.22)', borderRadius: radius.md, overflow: 'hidden' },
  factRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(133,183,235,0.15)' },
  factRowIcon: { width: 28, alignItems: 'center' },
  factRowLabel: { flex: 1, fontSize: 13, color: colors.textOnNavyFaint, marginLeft: spacing.sm },
  factRowValue: { fontSize: 13, fontWeight: '600', color: colors.white },

  galleryRow: { paddingHorizontal: gutter, paddingBottom: spacing.lg },
  galleryCard: { width: 160, marginRight: spacing.sm },
  galleryImageWell: { height: 110, borderRadius: radius.md, overflow: 'hidden', backgroundColor: 'rgba(55,138,221,0.14)', marginBottom: spacing.xs },
  galleryImage: { width: '100%', height: '100%' },
  galleryVideoWell: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  galleryLabel: { fontSize: 11.5, color: colors.textOnNavy, textAlign: 'center' },

  similarRow: { paddingHorizontal: gutter, paddingBottom: spacing.lg },
  similarCard: {
    width: 160,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md,
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  similarCardPressed: { backgroundColor: 'rgba(255,255,255,0.14)' },
  similarImageWell: { height: 90, backgroundColor: 'rgba(55,138,221,0.14)', alignItems: 'center', justifyContent: 'center' },
  similarPrice: { fontSize: 14, fontWeight: '700', color: colors.white, paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
  similarFacts: { fontSize: 11.5, color: colors.textOnNavyFaint, paddingHorizontal: spacing.sm, marginTop: 2 },
  similarAddr: { fontSize: 11, color: colors.textOnNavyFaint, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm, marginTop: 2, lineHeight: 15 },
});
