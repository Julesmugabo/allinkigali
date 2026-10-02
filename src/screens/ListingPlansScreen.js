/**
 * ListingPlansScreen.js — Listing fee tiers for property and land listings.
 *
 * Route params:
 *   listingType  'rent' | 'sale' | 'land'
 *   price        the listing price the user entered (number)
 *   title        listing title (for confirmation display)
 *
 * Pricing:
 *   Rent (per month):  <250k → 25k | <600k → 50k | <1M → 100k | ≥1M → 200k
 *   Land (per month):  <5M → 200k | <10M → 300k | <15M → 500k | <25M → 1M
 *   Sale (per month):  <50M → 2M  | <70M → 3M   | <100M → 5M  | ≥100M → custom
 */
import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import { formatPrice } from '../utils/format';
import { colors, typography, spacing, radius, gutter } from '../theme';

// ── Tier definitions ──────────────────────────────────────────────────────────

const RENT_TIERS = [
  { name: 'Starter',  maxPrice: 249_999,       fee: 25_000,  icon: 'home-outline',      color: '#4A90D9' },
  { name: 'Standard', maxPrice: 599_999,        fee: 50_000,  icon: 'home',              color: '#5BAD6F' },
  { name: 'Premium',  maxPrice: 999_999,        fee: 100_000, icon: 'home-city-outline', color: '#E6A817' },
  { name: 'Elite',    maxPrice: Infinity,       fee: 200_000, icon: 'home-city',         color: '#C04DC0' },
];

const LAND_TIERS = [
  { name: 'Bronze',   maxPrice: 4_999_999,      fee: 200_000,   icon: 'terrain',              color: '#CD7F32' },
  { name: 'Silver',   maxPrice: 9_999_999,      fee: 300_000,   icon: 'earth-outline',         color: '#A8A8A8' },
  { name: 'Gold',     maxPrice: 14_999_999,     fee: 500_000,   icon: 'star-outline',          color: '#E6A817' },
  { name: 'Platinum', maxPrice: Infinity,       fee: 1_000_000, icon: 'diamond-outline',       color: '#8A6FD4' },
];

const SALE_TIERS = [
  { name: 'Starter',  maxPrice: 49_999_999,     fee: 2_000_000, icon: 'home-outline',          color: '#4A90D9' },
  { name: 'Silver',   maxPrice: 69_999_999,     fee: 3_000_000, icon: 'home',                  color: '#A8A8A8' },
  { name: 'Gold',     maxPrice: 99_999_999,     fee: 5_000_000, icon: 'home-city-outline',     color: '#E6A817' },
  { name: 'Custom',   maxPrice: Infinity,       fee: null,      icon: 'handshake-outline',     color: '#C04DC0' },
];

function tiersFor(listingType) {
  if (listingType === 'land') return LAND_TIERS;
  if (listingType === 'sale') return SALE_TIERS;
  return RENT_TIERS;
}

function matchTier(listingType, price) {
  const tiers = tiersFor(listingType);
  return tiers.find((t) => price <= t.maxPrice) || tiers[tiers.length - 1];
}

function typeLabel(listingType) {
  if (listingType === 'land') return 'land plot';
  if (listingType === 'sale') return 'house for sale';
  return 'rental';
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ListingPlansScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { listingType = 'rent', price, title = '', locked = false } = route.params || {};

  // If no price was passed the user is just browsing — show all tiers as info.
  const isBrowse = price == null;

  const tiers = tiersFor(listingType);
  const matched = useMemo(
    () => (!isBrowse ? matchTier(listingType, price) : null),
    [isBrowse, listingType, price]
  );

  function listRoute() {
    if (listingType === 'land') return { name: 'ListLand' };
    return { name: 'ListProperty', params: { listingType } };
  }

  return (
    <GradientBackground>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.huge }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textOnNavy} />
          </Pressable>
          <Text style={styles.headerTitle}>Listing Plans</Text>
        </View>

        {/* Confirmation card — only after a real listing was submitted */}
        {!isBrowse && (
          <View style={styles.confirmCard}>
            <MaterialCommunityIcons name="check-circle" size={32} color={colors.success} style={{ marginBottom: spacing.sm }} />
            <Text style={styles.confirmTitle}>Listing submitted!</Text>
            {title ? <Text style={styles.confirmSub} numberOfLines={2}>{title}</Text> : null}
            <Text style={styles.confirmDesc}>
              Your listing stays visible until the property is {listingType === 'rent' ? 'rented' : 'sold'} — pay once, no recurring fees.
              Your recommended plan based on your {listingType === 'rent' ? 'monthly rent' : 'price'} of{' '}
              <Text style={{ color: colors.white, fontWeight: '700' }}>{formatPrice(price)}</Text> is highlighted.
            </Text>
          </View>
        )}

        {/* Browse intro */}
        {isBrowse && (
          <View style={styles.browseCard}>
            <MaterialCommunityIcons name="information-outline" size={28} color={colors.blue300} style={{ marginBottom: spacing.sm }} />
            <Text style={styles.browseTitle}>
              {listingType === 'land' ? 'Land listing fees' : listingType === 'sale' ? 'House for sale listing fees' : 'Rental listing fees'}
            </Text>
            <Text style={styles.browseDesc}>
              Pay once and your {typeLabel(listingType)} listing stays visible until it is {listingType === 'rent' ? 'rented' : 'sold'} — no recurring fees.
              The fee depends on your listing price — find your tier below.
            </Text>
          </View>
        )}

        {/* Tier selector (browse only, and only when not locked to a type) */}
        {isBrowse && !locked && (
          <View style={styles.typeRow}>
            {[
              { key: 'rent', label: 'Rental' },
              { key: 'sale', label: 'For sale' },
              { key: 'land', label: 'Land' },
            ].map((t) => {
              const active = listingType === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => navigation.setParams({ listingType: t.key })}
                  accessibilityRole="button"
                  style={[styles.typeChip, active && styles.typeChipActive]}
                >
                  <Text style={[styles.typeChipLabel, active && styles.typeChipLabelActive]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Tiers */}
        <Text style={styles.sectionTitle}>Available plans</Text>

        {tiers.map((tier) => {
          const isRecommended = !isBrowse && matched && tier.name === matched.name;
          return (
            <View key={tier.name} style={[styles.tierCard, isRecommended && styles.tierCardRecommended]}>
              {isRecommended && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedBadgeLabel}>Recommended for you</Text>
                </View>
              )}
              <View style={styles.tierTop}>
                <View style={[styles.tierIconWell, { backgroundColor: tier.color + '22' }]}>
                  <MaterialCommunityIcons name={tier.icon} size={22} color={tier.color} />
                </View>
                <View style={styles.tierInfo}>
                  <Text style={[styles.tierName, isRecommended && { color: tier.color }]}>{tier.name}</Text>
                  {tier.maxPrice < Infinity ? (
                    <Text style={styles.tierRange}>
                      {listingType === 'land' ? 'Plot' : listingType === 'sale' ? 'House' : 'Rent'} up to {formatPrice(tier.maxPrice)}
                    </Text>
                  ) : (
                    <Text style={styles.tierRange}>No upper limit</Text>
                  )}
                </View>
                <View style={styles.tierFeeCol}>
                  {tier.fee ? (
                    <>
                      <Text style={[styles.tierFee, isRecommended && { color: tier.color }]}>{formatPrice(tier.fee)}</Text>
                      <Text style={styles.tierFeePer}>one-time</Text>
                    </>
                  ) : (
                    <Text style={[styles.tierFee, { fontSize: 13, color: '#C04DC0' }]}>Contact us</Text>
                  )}
                </View>
              </View>

              {isRecommended && (
                <Pressable
                  style={[styles.selectBtn, { backgroundColor: tier.color }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${tier.name} plan`}
                  onPress={() => {
                    // No payment gateway yet — just navigate back to market
                    navigation.navigate(
                      listingType === 'land' ? 'LandMarket' : 'PropertyMarket',
                      listingType === 'land' ? undefined : { mode: listingType }
                    );
                  }}
                >
                  <MaterialCommunityIcons name="check" size={16} color={colors.white} />
                  <Text style={styles.selectBtnLabel}>
                    {tier.fee ? `Activate — ${formatPrice(tier.fee)} one-time` : 'Contact us to activate'}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}

        {/* Browse CTA — list your property */}
        {isBrowse && (
          <Pressable
            onPress={() => {
              const { name, params } = listRoute();
              navigation.navigate(name, params);
            }}
            accessibilityRole="button"
            style={styles.listCta}
          >
            <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.white} />
            <Text style={styles.listCtaLabel}>
              {listingType === 'land' ? 'List your land plot' : listingType === 'sale' ? 'List your house for sale' : 'List your house for rent'}
            </Text>
          </Pressable>
        )}

        <Text style={styles.footerNote}>
          Payment gateway coming soon. A team member will contact you to complete your one-time activation payment.
        </Text>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  headerTitle: { ...typography.bodyStrong, fontSize: 18, color: colors.white },

  confirmCard: {
    backgroundColor: 'rgba(46,158,91,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(46,158,91,0.35)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  confirmTitle: { fontSize: 18, fontWeight: '800', color: colors.white, marginBottom: spacing.xs },
  confirmSub: { fontSize: 13, color: colors.blue300, marginBottom: spacing.sm, textAlign: 'center' },
  confirmDesc: { fontSize: 13, color: colors.textOnNavyFaint, textAlign: 'center', lineHeight: 20 },

  sectionTitle: { ...typography.bodyStrong, fontSize: 15, color: colors.white, marginBottom: spacing.md },

  tierCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(133,183,235,0.2)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  tierCardRecommended: {
    borderColor: 'rgba(133,183,235,0.5)',
    backgroundColor: 'rgba(55,138,221,0.12)',
  },
  recommendedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.blue500,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginBottom: spacing.sm,
  },
  recommendedBadgeLabel: { fontSize: 10, fontWeight: '700', color: colors.white },

  tierTop: { flexDirection: 'row', alignItems: 'center' },
  tierIconWell: { width: 42, height: 42, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  tierInfo: { flex: 1 },
  tierName: { fontSize: 15, fontWeight: '700', color: colors.white },
  tierRange: { fontSize: 11.5, color: colors.textOnNavyFaint, marginTop: 2 },
  tierFeeCol: { alignItems: 'flex-end' },
  tierFee: { fontSize: 16, fontWeight: '800', color: colors.white },
  tierFeePer: { fontSize: 10, color: colors.textOnNavyFaint },

  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  selectBtnLabel: { fontSize: 14, fontWeight: '700', color: colors.white, marginLeft: spacing.sm },

  footerNote: { fontSize: 11.5, color: colors.textOnNavyFaint, textAlign: 'center', marginTop: spacing.lg, lineHeight: 18 },

  browseCard: {
    backgroundColor: 'rgba(55,138,221,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(133,183,235,0.3)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  browseTitle: { fontSize: 17, fontWeight: '800', color: colors.white, marginBottom: spacing.xs, textAlign: 'center' },
  browseDesc: { fontSize: 13, color: colors.textOnNavyFaint, textAlign: 'center', lineHeight: 20 },

  typeRow: { flexDirection: 'row', marginBottom: spacing.xl, gap: spacing.sm },
  typeChip: {
    borderWidth: 1,
    borderColor: 'rgba(133,183,235,0.3)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  typeChipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  typeChipLabel: { fontSize: 13, color: colors.textOnNavy, fontWeight: '600' },
  typeChipLabelActive: { color: colors.white },

  listCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blue500,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  listCtaLabel: { fontSize: 14, fontWeight: '700', color: colors.white },
});
