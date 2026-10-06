/**
 * RestaurantDetailScreen.js — Full detail view for a single restaurant.
 */
import React from 'react';
import { View, Text, ScrollView, Image, Pressable, Linking, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import {
  RESTAURANTS, CUISINES, PRICE_LABELS,
  OCCASION_LABELS, ATMOSPHERE_LABELS, DIETARY_LABELS,
  SEATING_LABELS, FEATURE_LABELS,
} from '../data/restaurantData';
import { colors, typography, spacing, radius, gutter } from '../theme';

export default function RestaurantDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const restaurant = RESTAURANTS.find((r) => r.id === route.params?.id);

  if (!restaurant) {
    return (
      <GradientBackground>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Restaurant not found.</Text>
        </View>
      </GradientBackground>
    );
  }

  const photo = restaurant.photos?.[0]?.url;
  const cuisineNames = restaurant.cuisines
    .map((c) => CUISINES.find((x) => x.key === c)?.label || c)
    .join(' · ');

  return (
    <GradientBackground>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.huge }}>
        {/* Photo */}
        <View style={styles.photoWell}>
          {photo
            ? <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
            : <MaterialCommunityIcons name="silverware-fork-knife" size={80} color={colors.blue300} />}
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeLabel}>{PRICE_LABELS[restaurant.price]}</Text>
          </View>
          <Pressable onPress={() => navigation.goBack()} style={[styles.overlayBtn, { top: insets.top + spacing.sm, left: gutter }]}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.white} />
          </Pressable>
        </View>

        {/* Main info */}
        <View style={styles.main}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{restaurant.name}</Text>
            <View style={styles.ratingPill}>
              <MaterialCommunityIcons name="star" size={13} color="#F5C518" />
              <Text style={styles.ratingLabel}>{restaurant.rating.toFixed(1)}</Text>
            </View>
          </View>
          <Text style={styles.cuisine}>{cuisineNames}</Text>
          <Text style={styles.location}>
            <MaterialCommunityIcons name="map-marker-outline" size={13} color={colors.blue300} />
            {' '}{restaurant.location}
          </Text>

          <Pressable onPress={() => Linking.openURL(`tel:${restaurant.phone}`)} style={styles.callBtn}>
            <MaterialCommunityIcons name="phone-outline" size={18} color={colors.white} />
            <Text style={styles.callBtnLabel}>Call {restaurant.phone}</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(`https://wa.me/${restaurant.phone.replace(/\D/g, '')}`)} style={styles.waBtn}>
            <MaterialCommunityIcons name="whatsapp" size={18} color="#25D366" />
            <Text style={styles.waBtnLabel}>Contact on WhatsApp</Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{restaurant.description}</Text>
        </View>

        <View style={styles.divider} />

        {/* Menu highlights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu highlights</Text>
          <View style={styles.tagRow}>
            {restaurant.foods.map((f) => (
              <View key={f} style={styles.tag}><Text style={styles.tagLabel}>{f}</Text></View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsTable}>
            {restaurant.atmosphere.length > 0 && (
              <DetailRow icon="weather-partly-cloudy" label="Atmosphere" value={restaurant.atmosphere.map((a) => ATMOSPHERE_LABELS[a] || a).join(', ')} />
            )}
            {restaurant.seating.length > 0 && (
              <DetailRow icon="chair-rolling" label="Seating" value={restaurant.seating.map((s) => SEATING_LABELS[s] || s).join(', ')} />
            )}
            {restaurant.dietary.length > 0 && (
              <DetailRow icon="leaf-circle-outline" label="Dietary" value={restaurant.dietary.map((d) => DIETARY_LABELS[d] || d).join(', ')} />
            )}
            {restaurant.features.length > 0 && (
              <DetailRow icon="star-outline" label="Features" value={restaurant.features.map((f) => FEATURE_LABELS[f] || f).join(', ')} />
            )}
            {restaurant.occasion.length > 0 && (
              <DetailRow icon="calendar-heart-outline" label="Good for" value={restaurant.occasion.map((o) => OCCASION_LABELS[o] || o).join(', ')} />
            )}
          </View>
        </View>

        {/* Photo gallery */}
        {restaurant.photos?.length > 1 && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Photos</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
              {restaurant.photos.map((p, i) => (
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
  overlayBtn: { position: 'absolute', width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },

  main: { paddingHorizontal: gutter, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  name: { flex: 1, fontSize: 24, fontWeight: '800', color: colors.white, letterSpacing: -0.5 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,197,24,0.15)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4, gap: 4, marginLeft: spacing.sm },
  ratingLabel: { fontSize: 13, fontWeight: '700', color: '#F5C518' },
  cuisine: { fontSize: 14, color: colors.blue300, marginBottom: spacing.xs },
  location: { fontSize: 13, color: colors.textOnNavyFaint, marginBottom: spacing.lg },

  callBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue500, borderRadius: radius.md, paddingVertical: spacing.md, marginBottom: spacing.sm, gap: spacing.sm },
  callBtnLabel: { ...typography.bodyStrong, color: colors.white },
  waBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#25D366', borderRadius: radius.md, paddingVertical: spacing.md, gap: spacing.sm },
  waBtnLabel: { ...typography.bodyStrong, fontSize: 14, color: colors.white },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(133,183,235,0.18)', marginVertical: spacing.xs },
  section: { paddingHorizontal: gutter, paddingVertical: spacing.lg },
  sectionTitle: { ...typography.bodyStrong, fontSize: 16, color: colors.white, marginBottom: spacing.md },
  description: { fontSize: 13.5, lineHeight: 21, color: colors.textOnNavy },

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
