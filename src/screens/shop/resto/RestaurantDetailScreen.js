/**
 * RestaurantDetailScreen.js — Full detail view for a single restaurant.
 * Photos section: tappable thumbnails open a full-screen lightbox with
 * swipe/arrow navigation between all photos.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Image, Pressable, Linking, StyleSheet,
  Modal, FlatList, Dimensions, ActivityIndicator,
} from 'react-native';
import BookingForm from '../../../components/booking/BookingForm';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../../../components/common/GradientBackground';
import {
  RESTAURANTS, CUISINES, PRICE_LABELS,
  OCCASION_LABELS, ATMOSPHERE_LABELS, DIETARY_LABELS,
  SEATING_LABELS, FEATURE_LABELS,
} from '../../../data/restaurantData';
import { apiFetch } from '../../../services/apiClient';
import { colors, typography, spacing, radius, gutter } from '../../../theme';
import { restaurantColors as rc } from '../../../theme/colors';
import AppTopBar from '../../../components/common/AppTopBar';

const { width: SW, height: SH } = Dimensions.get('window');

// ── Full-screen photo lightbox ────────────────────────────────────────────────

function PhotoLightbox({ photos, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const listRef = useRef(null);
  const insets = useSafeAreaInsets();

  const go = (next) => {
    const i = Math.max(0, Math.min(photos.length - 1, next));
    setIndex(i);
    listRef.current?.scrollToIndex({ index: i, animated: true });
  };

  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={lb.container}>
        <FlatList
          ref={listRef}
          data={photos}
          horizontal
          pagingEnabled
          initialScrollIndex={startIndex}
          getItemLayout={(_, i) => ({ length: SW, offset: SW * i, index: i })}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / SW);
            setIndex(i);
          }}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <View style={lb.slide}>
              <Image source={{ uri: item.url }} style={lb.image} resizeMode="contain" />
              {item.label ? (
                <View style={[lb.labelWrap, { bottom: insets.bottom + spacing.xl }]}>
                  <Text style={lb.labelText}>{item.label}</Text>
                </View>
              ) : null}
            </View>
          )}
        />

        <View style={[lb.counter, { top: insets.top + spacing.xl + 48 }]}>
          <Text style={lb.counterText}>{index + 1} / {photos.length}</Text>
        </View>

        {index > 0 && (
          <Pressable style={[lb.arrow, lb.arrowLeft]} onPress={() => go(index - 1)}>
            <MaterialCommunityIcons name="chevron-left" size={32} color={colors.white} />
          </Pressable>
        )}
        {index < photos.length - 1 && (
          <Pressable style={[lb.arrow, lb.arrowRight]} onPress={() => go(index + 1)}>
            <MaterialCommunityIcons name="chevron-right" size={32} color={colors.white} />
          </Pressable>
        )}

        {photos.length > 1 && photos.length <= 12 && (
          <View style={[lb.dots, { bottom: insets.bottom + spacing.lg }]}>
            {photos.map((_, i) => (
              <Pressable key={i} onPress={() => go(i)}>
                <View style={[lb.dot, i === index && lb.dotActive]} />
              </Pressable>
            ))}
          </View>
        )}

        <Pressable onPress={onClose} style={[lb.closeBtn, { top: insets.top + spacing.sm }]}>
          <MaterialCommunityIcons name="close" size={22} color={colors.white} />
        </Pressable>
      </View>
    </Modal>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function RestaurantDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const [restaurant, setRestaurant] = useState(
    () => RESTAURANTS.find((r) => r.id === route.params?.id) || null
  );
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  // Selected menu items to pre-fill the booking form
  const [selectedItems, setSelectedItems] = useState({});
  const picked = Object.values(selectedItems);
  const pickedCount = picked.reduce((n, v) => n + v.qty, 0);
  const pickedTotal = picked.reduce((n, v) => n + Number(v.price || 0) * v.qty, 0);

  useEffect(() => {
    const id = route.params?.id;
    if (!id) return;
    apiFetch(`/restaurants/${id}`)
      .then((data) => { if (data?.id) setRestaurant(data); })
      .catch(() => {});
    apiFetch(`/restaurant-menu/${id}`)
      .then((data) => { if (Array.isArray(data)) setMenuItems(data); })
      .catch(() => {});
  }, [route.params?.id]);

  if (!restaurant) {
    return (
      <GradientBackground>
        <View style={styles.notFound}>
          <ActivityIndicator color={colors.blue300} />
        </View>
      </GradientBackground>
    );
  }

  const photos = restaurant.photos || [];
  const coverPhoto = photos[0]?.url;
  const cuisineNames = (restaurant.cuisines || [])
    .map((c) => CUISINES.find((x) => x.key === c)?.label || c)
    .join(' · ');

  return (
    <GradientBackground colorsOverride={rc.gradient}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.huge + (pickedCount ? 64 : 0) }}>

        {/* Hero photo — tappable to open lightbox */}
        <Pressable style={styles.photoWell} onPress={() => photos.length ? setLightboxIndex(0) : null}>
          {coverPhoto
            ? <Image source={{ uri: coverPhoto }} style={styles.photo} resizeMode="cover" />
            : <MaterialCommunityIcons name="silverware-fork-knife" size={80} color={colors.blue300} />}
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeLabel}>{PRICE_LABELS[restaurant.price]}</Text>
          </View>
          {photos.length > 1 && (
            <View style={styles.photosCountBadge}>
              <MaterialCommunityIcons name="image-multiple-outline" size={13} color={colors.white} />
              <Text style={styles.photosCountLabel}>{photos.length} photos</Text>
            </View>
          )}
          <AppTopBar variant="overlay" style={{ top: insets.top + spacing.sm }} />
        </Pressable>

        {/* Main info */}
        <View style={styles.main}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{restaurant.name}</Text>
            <View style={styles.ratingPill}>
              <MaterialCommunityIcons name="star" size={13} color="#F5C518" />
              <Text style={styles.ratingLabel}>{Number(restaurant.rating).toFixed(1)}</Text>
            </View>
          </View>
          <Text style={styles.cuisine}>{cuisineNames}</Text>
          <Text style={styles.location}>
            <MaterialCommunityIcons name="map-marker-outline" size={13} color={colors.blue300} />
            {' '}{restaurant.location}
          </Text>

          <Pressable onPress={() => setBookingOpen(true)} style={styles.bookBtn}>
            <MaterialCommunityIcons name="calendar-check-outline" size={18} color={colors.white} />
            <Text style={styles.bookBtnLabel}>Reserve a Table</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(`tel:${restaurant.phone}`)} style={styles.callBtn}>
            <MaterialCommunityIcons name="phone-outline" size={18} color={colors.white} />
            <Text style={styles.callBtnLabel}>Call {restaurant.phone}</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(`https://wa.me/${restaurant.phone?.replace(/\D/g, '')}`)} style={styles.waBtn}>
            <MaterialCommunityIcons name="whatsapp" size={18} color="#25D366" />
            <Text style={styles.waBtnLabel}>Contact on WhatsApp</Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* Menu first, right under the booking buttons: picked dishes go with the booking */}
        {menuItems.length > 0 && (() => {
          const grouped = {};
          menuItems.filter(i => i.available !== false).forEach((item) => {
            if (!grouped[item.category]) grouped[item.category] = [];
            grouped[item.category].push(item);
          });
          const selectedCount = Object.values(selectedItems).reduce((s, v) => s + v.qty, 0);
          return (
            <>
              <View style={[styles.section, { paddingBottom: spacing.xs }]}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>Menu</Text>
                  {selectedCount > 0 && (
                    <Pressable onPress={() => setBookingOpen(true)} style={styles.menuBookBtn}>
                      <Text style={styles.menuBookBtnLabel}>Book with {selectedCount} item{selectedCount > 1 ? 's' : ''}</Text>
                    </Pressable>
                  )}
                </View>
              </View>
              {Object.entries(grouped).map(([cat, items]) => (
                <View key={cat} style={{ marginBottom: spacing.md }}>
                  <Text style={[styles.menuCatTitle, { paddingHorizontal: gutter }]}>{cat}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, paddingRight: gutter * 2 }}>
                    {items.map(item => {
                      const qty = selectedItems[item.id]?.qty || 0;
                      return (
                        <Pressable
                          key={item.id}
                          style={[styles.menuCard, qty > 0 && styles.menuCardSelected]}
                          onPress={() => setSelectedItems(prev => {
                            const cur = prev[item.id]?.qty || 0;
                            if (cur === 0) return { ...prev, [item.id]: { name: item.name, price: item.price, qty: 1 } };
                            const next = { ...prev };
                            delete next[item.id];
                            return next;
                          })}
                        >
                          <View style={styles.menuCardImg}>
                            {item.photo_url
                              ? <Image source={{ uri: item.photo_url }} style={styles.menuCardImage} resizeMode="cover" />
                              : <MaterialCommunityIcons name="food-outline" size={28} color={colors.blue300} />}
                          </View>
                          {qty > 0 && (
                            <View style={styles.menuCardBadge}>
                              <MaterialCommunityIcons name="check" size={11} color={colors.white} />
                            </View>
                          )}
                          <View style={styles.menuCardBody}>
                            <Text style={styles.menuCardName} numberOfLines={2}>{item.name}</Text>
                            <Text style={styles.menuCardPrice}>{Number(item.price).toLocaleString()} RWF</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              ))}
              <View style={styles.divider} />
            </>
          );
        })()}

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{restaurant.description}</Text>
        </View>

        <View style={styles.divider} />

        {/* Photos grid */}
        {photos.length > 0 && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Photos</Text>
                {photos.length > 1 && (
                  <Pressable onPress={() => setLightboxIndex(0)} style={styles.seeAllBtn}>
                    <Text style={styles.seeAllLabel}>See all {photos.length}</Text>
                    <MaterialCommunityIcons name="arrow-right" size={14} color={colors.blue300} />
                  </Pressable>
                )}
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
              {photos.map((p, i) => (
                <Pressable key={i} onPress={() => setLightboxIndex(i)} style={({ pressed }) => [styles.galleryItem, pressed && { opacity: 0.8 }]}>
                  <Image source={{ uri: p.url }} style={styles.galleryImage} resizeMode="cover" />
                  {p.label ? <Text style={styles.galleryLabel} numberOfLines={1}>{p.label}</Text> : null}
                  <View style={styles.galleryOverlay}>
                    <MaterialCommunityIcons name="magnify-plus-outline" size={20} color={colors.white} />
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.divider} />
          </>
        )}


        {/* Menu highlights (foods tags) */}
        {(restaurant.foods || []).length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Signature dishes</Text>
              <View style={styles.tagRow}>
                {(restaurant.foods || []).map((f) => (
                  <View key={f} style={styles.tag}><Text style={styles.tagLabel}>{f}</Text></View>
                ))}
              </View>
            </View>
            <View style={styles.divider} />
          </>
        )}

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsTable}>
            {restaurant.atmosphere?.length > 0 && (
              <DetailRow icon="weather-partly-cloudy" label="Atmosphere" value={restaurant.atmosphere.map((a) => ATMOSPHERE_LABELS[a] || a).join(', ')} />
            )}
            {restaurant.seating?.length > 0 && (
              <DetailRow icon="chair-rolling" label="Seating" value={restaurant.seating.map((s) => SEATING_LABELS[s] || s).join(', ')} />
            )}
            {restaurant.dietary?.length > 0 && (
              <DetailRow icon="leaf-circle-outline" label="Dietary" value={restaurant.dietary.map((d) => DIETARY_LABELS[d] || d).join(', ')} />
            )}
            {restaurant.features?.length > 0 && (
              <DetailRow icon="star-outline" label="Features" value={restaurant.features.map((f) => FEATURE_LABELS[f] || f).join(', ')} />
            )}
            {restaurant.occasion?.length > 0 && (
              <DetailRow icon="calendar-heart-outline" label="Good for" value={restaurant.occasion.map((o) => OCCASION_LABELS[o] || o).join(', ')} />
            )}
          </View>
        </View>
      </ScrollView>
      {pickedCount > 0 && !bookingOpen ? (
        <Pressable onPress={() => setBookingOpen(true)} style={[styles.dishBar, { bottom: insets.bottom + spacing.md }]} accessibilityRole="button">
          <Text style={styles.dishBarText}>🍽 {pickedCount} dish{pickedCount > 1 ? 'es' : ''} for your table · ≈ {pickedTotal.toLocaleString()} RWF</Text>
          <Text style={styles.dishBarCta}>Book a table →</Text>
        </Pressable>
      ) : null}

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
      <BookingForm
        visible={bookingOpen}
        onClose={() => setBookingOpen(false)}
        placeId={restaurant.id}
        placeName={restaurant.name}
        type="restaurant"
        navigation={navigation}
        selectedItems={selectedItems}
      />
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
  dishBar: { position: 'absolute', left: gutter, right: gutter, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, backgroundColor: '#1A7A4A', borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  dishBarText: { flex: 1, color: colors.white, fontSize: 13, fontWeight: '600' },
  dishBarCta: { color: colors.white, fontSize: 14, fontWeight: '800' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoWell: { width: '100%', aspectRatio: 16 / 9, backgroundColor: 'rgba(55,138,221,0.14)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  priceBadge: { position: 'absolute', bottom: spacing.md, right: gutter, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  priceBadgeLabel: { fontSize: 13, fontWeight: '700', color: '#F5C518' },
  photosCountBadge: { position: 'absolute', top: spacing.md, right: gutter, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  photosCountLabel: { fontSize: 11, fontWeight: '600', color: colors.white },
  overlayBtn: { position: 'absolute', width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  main: { paddingHorizontal: gutter, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  name: { flex: 1, fontSize: 24, fontWeight: '800', color: colors.white, letterSpacing: -0.5 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,197,24,0.15)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4, gap: 4, marginLeft: spacing.sm },
  ratingLabel: { fontSize: 13, fontWeight: '700', color: '#F5C518' },
  cuisine: { fontSize: 14, color: colors.blue300, marginBottom: spacing.xs },
  location: { fontSize: 13, color: colors.textOnNavyFaint, marginBottom: spacing.lg },
  bookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A7A4A', borderRadius: radius.md, paddingVertical: spacing.md, marginBottom: spacing.sm, gap: spacing.sm },
  bookBtnLabel: { ...typography.bodyStrong, color: colors.white },
  callBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue500, borderRadius: radius.md, paddingVertical: spacing.md, marginBottom: spacing.sm, gap: spacing.sm },
  callBtnLabel: { ...typography.bodyStrong, color: colors.white },
  waBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#25D366', borderRadius: radius.md, paddingVertical: spacing.md, gap: spacing.sm },
  waBtnLabel: { ...typography.bodyStrong, fontSize: 14, color: colors.white },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(133,183,235,0.18)', marginVertical: spacing.xs },
  section: { paddingHorizontal: gutter, paddingVertical: spacing.lg },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...typography.bodyStrong, fontSize: 16, color: colors.white, marginBottom: spacing.md },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.md },
  seeAllLabel: { fontSize: 13, color: colors.blue300, fontWeight: '600' },
  description: { fontSize: 13.5, lineHeight: 21, color: colors.textOnNavy },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: { backgroundColor: 'rgba(55,138,221,0.18)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  tagLabel: { fontSize: 12, color: colors.blue300, fontWeight: '600' },
  detailsTable: { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.22)', borderRadius: radius.md, overflow: 'hidden' },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(133,183,235,0.15)' },
  detailLabel: { flex: 1, fontSize: 13, color: colors.textOnNavyFaint, marginLeft: spacing.xs },
  detailValue: { flex: 2, fontSize: 13, fontWeight: '600', color: colors.white, textAlign: 'right' },
  gallery: { paddingHorizontal: gutter, paddingBottom: spacing.lg, gap: spacing.sm },
  galleryItem: { width: 160, position: 'relative' },
  galleryImage: { width: 160, height: 120, borderRadius: radius.md, marginBottom: spacing.xs },
  galleryLabel: { fontSize: 11.5, color: colors.textOnNavy, textAlign: 'center' },
  galleryOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, borderRadius: radius.md, backgroundColor: 'rgba(0,0,0,0)', alignItems: 'center', justifyContent: 'center' },
  menuCatTitle: { fontSize: 12, fontWeight: '800', color: colors.blue300, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm },
  menuCard: {
    width: 120, marginRight: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    overflow: 'hidden',
  },
  menuCardSelected: { borderColor: colors.blue500, borderWidth: 2 },
  menuCardImg: { width: '100%', height: 88, backgroundColor: 'rgba(55,138,221,0.12)', alignItems: 'center', justifyContent: 'center' },
  menuCardImage: { width: '100%', height: 88 },
  menuCardBadge: { position: 'absolute', top: spacing.xs, right: spacing.xs, backgroundColor: colors.blue500, borderRadius: 10, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  menuCardBody: { padding: spacing.xs + 2 },
  menuCardName: { fontSize: 12, fontWeight: '600', color: colors.white, marginBottom: 3 },
  menuCardPrice: { fontSize: 12, fontWeight: '700', color: '#60C080' },
  menuBookBtn: { backgroundColor: colors.blue500, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5 },
  menuBookBtnLabel: { fontSize: 12, fontWeight: '700', color: colors.white },
});

const lb = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  slide: { width: SW, height: SH, alignItems: 'center', justifyContent: 'center' },
  image: { width: SW, height: SH },
  labelWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: gutter },
  labelText: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5 },
  counter: { position: 'absolute', alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5 },
  counterText: { fontSize: 13, color: colors.white, fontWeight: '600' },
  arrow: { position: 'absolute', top: '50%', marginTop: -24, width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  arrowLeft: { left: spacing.md },
  arrowRight: { right: spacing.md },
  dots: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { backgroundColor: colors.white, width: 18 },
  closeBtn: { position: 'absolute', right: spacing.md, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
});
