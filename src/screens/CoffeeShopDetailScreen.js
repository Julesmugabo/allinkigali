/**
 * CoffeeShopDetailScreen.js — Full detail view for a single coffee shop.
 */
import React from 'react';
import { View, Text, ScrollView, Image, Pressable, Linking, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import { COFFEE_SHOPS, INTENTS, INTENT_ATTRIBUTES, FACILITY_LABELS, SEATING_LABELS_CS } from '../data/coffeeShopData';
import { colors, typography, spacing, radius, gutter } from '../theme';

const PRICE_LABELS = { 1: '$', 2: '$$', 3: '$$$' };

export default function CoffeeShopDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const shop = COFFEE_SHOPS.find((s) => s.id === route.params?.id);

  if (!shop) {
    return (
      <GradientBackground>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Coffee shop not found.</Text>
        </View>
      </GradientBackground>
    );
  }

  const photo = shop.photos?.[0]?.url;

  const matchedIntents = INTENTS.filter((i) =>
    (INTENT_ATTRIBUTES[i.key] || []).some((a) => shop.attributes.includes(a))
  );

  return (
    <GradientBackground>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.huge }}>
        {/* Photo */}
        <View style={styles.photoWell}>
          {photo
            ? <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
            : <MaterialCommunityIcons name="coffee-outline" size={80} color={colors.blue300} />}
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeLabel}>{PRICE_LABELS[shop.price] || '$'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: shop.openStatus === 'Open now' ? 'rgba(46,158,91,0.85)' : 'rgba(180,60,40,0.85)' }]}>
            <Text style={styles.statusLabel}>{shop.openStatus || 'Open now'}</Text>
          </View>
          <Pressable onPress={() => navigation.goBack()} style={[styles.overlayBtn, { top: insets.top + spacing.sm, left: gutter }]}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.white} />
          </Pressable>
        </View>

        {/* Main info */}
        <View style={styles.main}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{shop.name}</Text>
            <View style={styles.ratingPill}>
              <MaterialCommunityIcons name="star" size={13} color="#F5C518" />
              <Text style={styles.ratingLabel}>{shop.rating.toFixed(1)}</Text>
            </View>
          </View>
          <Text style={styles.coffeeTypes}>☕ {shop.coffeeTypes.slice(0, 4).join(' · ')}</Text>
          <Text style={styles.location}>
            <MaterialCommunityIcons name="map-marker-outline" size={13} color={colors.blue300} />
            {' '}{shop.location}
          </Text>

          {/* Intent chips */}
          {matchedIntents.length > 0 && (
            <View style={styles.intentRow}>
              {matchedIntents.map((i) => (
                <View key={i.key} style={styles.intentChip}>
                  <Text style={styles.intentLabel}>{i.emoji} {i.label}</Text>
                </View>
              ))}
            </View>
          )}

          <Pressable onPress={() => Linking.openURL(`tel:${shop.phone}`)} style={styles.callBtn}>
            <MaterialCommunityIcons name="phone-outline" size={18} color={colors.white} />
            <Text style={styles.callBtnLabel}>Call {shop.phone}</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(`https://wa.me/${shop.phone.replace(/\D/g, '')}`)} style={styles.waBtn}>
            <MaterialCommunityIcons name="whatsapp" size={18} color="#25D366" />
            <Text style={styles.waBtnLabel}>Contact on WhatsApp</Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{shop.description}</Text>
        </View>

        <View style={styles.divider} />

        {/* Coffee details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coffee</Text>
          <View style={styles.tagGroup}>
            <Text style={styles.tagGroupLabel}>Types</Text>
            <View style={styles.tagRow}>
              {shop.coffeeTypes.map((c) => <View key={c} style={styles.tag}><Text style={styles.tagLabel}>{c}</Text></View>)}
            </View>
          </View>
          {shop.brewingMethods?.length > 0 && (
            <View style={styles.tagGroup}>
              <Text style={styles.tagGroupLabel}>Brewing methods</Text>
              <View style={styles.tagRow}>
                {shop.brewingMethods.map((m) => <View key={m} style={styles.tag}><Text style={styles.tagLabel}>{m}</Text></View>)}
              </View>
            </View>
          )}
          {shop.origins?.length > 0 && (
            <View style={styles.tagGroup}>
              <Text style={styles.tagGroupLabel}>Origins</Text>
              <View style={styles.tagRow}>
                {shop.origins.map((o) => <View key={o} style={styles.tag}><Text style={styles.tagLabel}>{o}</Text></View>)}
              </View>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Details table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsTable}>
            {shop.atmosphere?.length > 0 && <DetailRow icon="weather-partly-cloudy" label="Atmosphere" value={shop.atmosphere.join(', ')} />}
            {shop.facilities?.length > 0 && <DetailRow icon="wifi" label="Facilities" value={shop.facilities.map((f) => FACILITY_LABELS[f] || f).join(', ')} />}
            {shop.seating?.length > 0 && <DetailRow icon="chair-rolling" label="Seating" value={shop.seating.map((s) => SEATING_LABELS_CS[s] || s).join(', ')} />}
            {shop.services?.length > 0 && <DetailRow icon="silverware-fork-knife" label="Services" value={shop.services.join(', ')} />}
            {shop.food?.length > 0 && <DetailRow icon="food-outline" label="Food" value={shop.food.join(', ')} />}
          </View>
        </View>

        {/* Photos */}
        {shop.photos?.length > 1 && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Photos</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
              {shop.photos.map((p, i) => (
                <View key={i} style={styles.galleryItem}>
                  <Image source={{ uri: p.url }} style={styles.galleryImage} resizeMode="cover" />
                  <Text style={styles.galleryLabel} numberOfLines={1}>{p.label}</Text>
                </View>
              ))}
            </ScrollView>
          </>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <MaterialCommunityIcons name={icon} size={15} color={colors.blue300} style={{ width: 22 }} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: colors.textOnNavy },
  photoWell: { height: 260, backgroundColor: 'rgba(55,138,221,0.14)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  priceBadge: { position: 'absolute', bottom: spacing.md, right: gutter, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  priceBadgeLabel: { fontSize: 13, fontWeight: '700', color: '#F5C518' },
  statusBadge: { position: 'absolute', bottom: spacing.md, left: gutter, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  statusLabel: { fontSize: 11, fontWeight: '700', color: colors.white },
  overlayBtn: { position: 'absolute', width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  main: { paddingHorizontal: gutter, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  name: { flex: 1, fontSize: 24, fontWeight: '800', color: colors.white, letterSpacing: -0.5 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,197,24,0.15)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4, gap: 4, marginLeft: spacing.sm },
  ratingLabel: { fontSize: 13, fontWeight: '700', color: '#F5C518' },
  coffeeTypes: { fontSize: 13, color: colors.blue300, marginBottom: spacing.xs },
  location: { fontSize: 13, color: colors.textOnNavyFaint, marginBottom: spacing.sm },
  intentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  intentChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(55,138,221,0.18)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  intentLabel: { fontSize: 11.5, color: colors.blue300, fontWeight: '600' },
  callBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue500, borderRadius: radius.md, paddingVertical: spacing.md, marginBottom: spacing.sm, gap: spacing.sm },
  callBtnLabel: { ...typography.bodyStrong, color: colors.white },
  waBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#25D366', borderRadius: radius.md, paddingVertical: spacing.md, gap: spacing.sm },
  waBtnLabel: { ...typography.bodyStrong, fontSize: 14, color: colors.white },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(133,183,235,0.18)', marginVertical: spacing.xs },
  section: { paddingHorizontal: gutter, paddingVertical: spacing.lg },
  sectionTitle: { ...typography.bodyStrong, fontSize: 16, color: colors.white, marginBottom: spacing.md },
  description: { fontSize: 13.5, lineHeight: 21, color: colors.textOnNavy },
  tagGroup: { marginBottom: spacing.md },
  tagGroupLabel: { fontSize: 12, color: colors.textOnNavyFaint, marginBottom: spacing.xs },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: { backgroundColor: 'rgba(55,138,221,0.18)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  tagLabel: { fontSize: 12, color: colors.blue300, fontWeight: '600' },
  detailsTable: { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.22)', borderRadius: radius.md, overflow: 'hidden' },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(133,183,235,0.15)' },
  detailLabel: { flex: 1, fontSize: 13, color: colors.textOnNavyFaint, marginLeft: spacing.xs },
  detailValue: { flex: 2, fontSize: 13, fontWeight: '600', color: colors.white, textAlign: 'right' },
  gallery: { paddingHorizontal: gutter, paddingBottom: spacing.lg },
  galleryItem: { width: 160, marginRight: spacing.sm },
  galleryImage: { width: 160, height: 110, borderRadius: radius.md, marginBottom: spacing.xs },
  galleryLabel: { fontSize: 11.5, color: colors.textOnNavy, textAlign: 'center' },
});
