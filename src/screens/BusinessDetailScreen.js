/**
 * BusinessDetailScreen.js — Amakuru arambuye ku bucuruzi/serivisi.
 *
 * Reached by tapping "Reba byinshi" on a BusinessCard. Shows everything the
 * card couldn't fit, then hands off to BusinessBookScreen for booking.
 */
import React, { useCallback } from 'react';
import { View, Text, Image, ScrollView, Pressable, Linking, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import PrimaryButton from '../components/common/PrimaryButton';
import { useBusinesses } from '../context/BusinessContext';
import { formatPrice } from '../utils/format';
import { colors, typography, spacing, radius, gutter } from '../theme';

export default function BusinessDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { getBusinessById } = useBusinesses();
  const business = getBusinessById(route.params?.businessId);

  const handleBook = useCallback(() => {
    navigation.navigate('BusinessBook', { businessId: business.id });
  }, [navigation, business]);

  const handleCall = useCallback(() => {
    if (business?.phone) Linking.openURL(`tel:${business.phone}`);
  }, [business]);

  if (!business) {
    return (
      <GradientBackground>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Iyi serivisi ntibonetse.</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.huge }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageWell}>
          {business.image ? (
            <Image source={business.image} style={styles.image} resizeMode="cover" />
          ) : (
            <MaterialCommunityIcons name={business.icon || 'store-outline'} size={56} color={colors.blue300} />
          )}

          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Subira inyuma"
            style={[styles.backButton, { top: insets.top + spacing.sm }]}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.white} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{business.name}</Text>
            {business.verified ? (
              <MaterialCommunityIcons name="check-decagram" size={18} color={colors.success} />
            ) : null}
          </View>

          <View style={styles.metaRow}>
            {business.rating ? (
              <View style={styles.metaChip}>
                <MaterialCommunityIcons name="star" size={14} color="#F5B942" />
                <Text style={styles.ratingText}>{business.rating}</Text>
                <Text style={styles.reviewText}>({business.reviewCount} ibitekerezo)</Text>
              </View>
            ) : (
              <Text style={styles.newLabel}>Ibicuruzwa bishya — nta bitekerezo urahari</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.blue300} />
            <Text style={styles.infoText}>{business.location}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.blue300} />
            <Text style={styles.infoText}>{business.hours}</Text>
          </View>
          {business.phone ? (
            <Pressable onPress={handleCall} style={styles.infoRow} accessibilityRole="button">
              <MaterialCommunityIcons name="phone-outline" size={16} color={colors.blue300} />
              <Text style={[styles.infoText, styles.phoneText]}>{business.phone} — Hamagara</Text>
            </Pressable>
          ) : null}

          {business.description ? <Text style={styles.description}>{business.description}</Text> : null}

          <Text style={styles.sectionLabel}>Serivisi zitangwa</Text>
          <View style={styles.chips}>
            {(business.services || []).map((service) => (
              <View key={service} style={styles.chip}>
                <Text style={styles.chipLabel}>{service}</Text>
              </View>
            ))}
          </View>

          {business.highlights?.length ? (
            <>
              <Text style={styles.sectionLabel}>Impamvu abantu bakwifuza</Text>
              <View style={styles.highlightBox}>
                {business.highlights.map((point) => (
                  <View key={point} style={styles.highlightRow}>
                    <MaterialCommunityIcons name="check" size={14} color={colors.success} />
                    <Text style={styles.highlightText}>{point}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {business.items?.length ? (
            <>
              <Text style={styles.sectionLabel}>Ibiciro</Text>
              <View style={styles.itemsCard}>
                {business.items.map((item, index) => (
                  <View key={item.id}>
                    <View style={styles.itemRow}>
                      <Text style={[styles.itemLabel, !item.available && styles.itemLabelUnavailable]}>
                        {item.label}
                      </Text>
                      {item.available ? (
                        <Text style={styles.itemPrice}>{formatPrice(item.price, business.currency)}</Text>
                      ) : (
                        <Text style={styles.itemUnavailable}>Ntibihari</Text>
                      )}
                    </View>
                    {index < business.items.length - 1 ? <View style={styles.itemDivider} /> : null}
                  </View>
                ))}
              </View>
            </>
          ) : business.priceFrom ? (
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>Guhera kuri</Text>
              <Text style={styles.priceValue}>
                {formatPrice(business.priceFrom, business.currency)}
                {business.priceUnit ? ` / ${business.priceUnit}` : ''}
              </Text>
            </View>
          ) : null}

          {/* Booking hands off to a screen with its own hardcoded route back
              into the Shop tab, and isn't a meaningful admin action anyway —
              so an admin previewing a listing sees the info, not the button. */}
          {route.params?.viaAdmin ? (
            <View style={styles.adminNotice}>
              <MaterialCommunityIcons name="shield-account-outline" size={15} color={colors.blue300} />
              <Text style={styles.adminNoticeText}>Admin preview — booking is disabled here.</Text>
            </View>
          ) : (
            <PrimaryButton
              label="Tumiza"
              icon="calendar-check-outline"
              onPress={handleBook}
              style={styles.bookButton}
            />
          )}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { ...typography.body, color: colors.textOnNavy },
  imageWell: {
    height: 220,
    backgroundColor: 'rgba(2,28,54,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  backButton: {
    position: 'absolute',
    left: gutter,
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(2,28,54,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: gutter, paddingTop: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  name: {
    ...typography.screenTitle,
    fontSize: 22,
    color: colors.white,
    marginRight: spacing.xs,
    flexShrink: 1,
  },
  metaRow: { marginTop: spacing.sm, marginBottom: spacing.lg },
  metaChip: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { ...typography.body, fontWeight: '700', color: colors.white, marginLeft: 5 },
  reviewText: { ...typography.body, color: colors.textOnNavyFaint, marginLeft: 4 },
  newLabel: { ...typography.body, color: colors.blue300 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  infoText: { ...typography.body, color: colors.textOnNavy, marginLeft: spacing.sm },
  phoneText: { color: colors.blue300, fontWeight: '600' },
  itemsCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  itemLabel: { ...typography.body, fontSize: 13.5, color: colors.textOnNavy, flexShrink: 1 },
  itemLabelUnavailable: { color: colors.textOnNavyFaint },
  itemPrice: { ...typography.body, fontSize: 13.5, fontWeight: '700', color: colors.white },
  itemUnavailable: { ...typography.caption, color: colors.warning },
  itemDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(133,183,235,0.2)',
  },
  description: {
    ...typography.body,
    color: colors.textOnNavyFaint,
    lineHeight: 20,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.blue300,
    letterSpacing: 0.3,
    marginBottom: spacing.md,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.25)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipLabel: { fontSize: 12.5, color: colors.textOnNavy },
  highlightBox: {
    backgroundColor: 'rgba(46,158,91,0.14)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  highlightRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  highlightText: { ...typography.body, fontSize: 13, color: colors.white, marginLeft: spacing.sm },
  priceCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  priceLabel: { ...typography.caption, color: colors.textOnNavyFaint, marginBottom: 4 },
  priceValue: { ...typography.price, fontSize: 20, color: colors.white },
  bookButton: { marginBottom: spacing.xl },
  adminNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(55,138,221,0.16)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  adminNoticeText: { ...typography.caption, color: colors.blue300, marginLeft: spacing.sm },
});
