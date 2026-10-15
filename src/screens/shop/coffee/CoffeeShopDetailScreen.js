/**
 * CoffeeShopDetailScreen.js — Full detail view for a single coffee shop.
 * Photos section: tappable thumbnails open a full-screen lightbox with
 * swipe/arrow navigation between all photos.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Image, Pressable, Linking, StyleSheet,
  Modal, FlatList, Dimensions, ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../../../components/common/GradientBackground';
import { COFFEE_SHOPS, INTENTS, INTENT_ATTRIBUTES, FACILITY_LABELS, SEATING_LABELS_CS } from '../../../data/coffeeShopData';
import { apiFetch } from '../../../services/apiClient';
import BookingForm from '../../../components/booking/BookingForm';
import { typography, spacing, radius, gutter } from '../../../theme';
import { coffeeColors as cc } from '../../../theme/colors';
import AppTopBar from '../../../components/common/AppTopBar';

const PRICE_LABELS = { 1: '$', 2: '$$', 3: '$$$' };
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
        {/* Photo pager */}
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
              <Image
                source={{ uri: item.url }}
                style={lb.image}
                resizeMode="contain"
              />
              {item.label ? (
                <View style={[lb.labelWrap, { bottom: insets.bottom + spacing.xl }]}>
                  <Text style={lb.labelText}>{item.label}</Text>
                </View>
              ) : null}
            </View>
          )}
        />

        {/* Counter */}
        <View style={[lb.counter, { top: insets.top + spacing.xl + 48 }]}>
          <Text style={lb.counterText}>{index + 1} / {photos.length}</Text>
        </View>

        {/* Prev / Next arrows */}
        {index > 0 && (
          <Pressable style={[lb.arrow, lb.arrowLeft]} onPress={() => go(index - 1)}>
            <MaterialCommunityIcons name="chevron-left" size={32} color={cc.text} />
          </Pressable>
        )}
        {index < photos.length - 1 && (
          <Pressable style={[lb.arrow, lb.arrowRight]} onPress={() => go(index + 1)}>
            <MaterialCommunityIcons name="chevron-right" size={32} color={cc.text} />
          </Pressable>
        )}

        {/* Dot indicators */}
        {photos.length > 1 && photos.length <= 12 && (
          <View style={[lb.dots, { bottom: insets.bottom + spacing.lg }]}>
            {photos.map((_, i) => (
              <Pressable key={i} onPress={() => go(i)}>
                <View style={[lb.dot, i === index && lb.dotActive]} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Close button */}
        <Pressable onPress={onClose} style={[lb.closeBtn, { top: insets.top + spacing.sm }]}>
          <MaterialCommunityIcons name="close" size={22} color={cc.text} />
        </Pressable>
      </View>
    </Modal>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function CoffeeShopDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const [shop, setShop] = useState(() => COFFEE_SHOPS.find((s) => s.id === route.params?.id) || null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const picked = Object.values(selectedItems);
  const pickedCount = picked.reduce((n, v) => n + v.qty, 0);
  const pickedTotal = picked.reduce((n, v) => n + Number(v.price || 0) * v.qty, 0);

  useEffect(() => {
    const id = route.params?.id;
    if (!id) return;
    apiFetch(`/coffee-shops/${id}`)
      .then((data) => { if (data?.id) setShop(data); })
      .catch(() => {/* keep local fallback */});
    apiFetch(`/restaurant-menu/coffee-shop/${id}`)
      .then((data) => { if (Array.isArray(data)) setMenuItems(data); })
      .catch(() => {});
  }, [route.params?.id]);

  if (!shop) {
    return (
      <GradientBackground colorsOverride={cc.gradient}>
        <View style={styles.notFound}>
          <ActivityIndicator color={cc.accentText} />
        </View>
      </GradientBackground>
    );
  }

  const photos = shop.photos || [];
  const coverPhoto = photos[0]?.url;

  const matchedIntents = INTENTS.filter((i) =>
    (INTENT_ATTRIBUTES[i.key] || []).some((a) => shop.attributes?.includes(a))
  );

  return (
    <GradientBackground colorsOverride={cc.gradient}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.huge + (pickedCount ? 64 : 0) }}>

        {/* Hero photo — tappable to open lightbox */}
        <Pressable style={styles.photoWell} onPress={() => photos.length ? setLightboxIndex(0) : null}>
          {coverPhoto
            ? <Image source={{ uri: coverPhoto }} style={styles.photo} resizeMode="cover" />
            : <MaterialCommunityIcons name="coffee-outline" size={80} color={cc.accentText} />}
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeLabel}>{PRICE_LABELS[shop.price] || '$'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: shop.openStatus === 'Open now' ? cc.open : cc.closed }]}>
            <Text style={styles.statusLabel}>{shop.openStatus || 'Open now'}</Text>
          </View>
          {photos.length > 1 && (
            <View style={styles.photosCountBadge}>
              <MaterialCommunityIcons name="image-multiple-outline" size={13} color={cc.text} />
              <Text style={styles.photosCountLabel}>{photos.length} photos</Text>
            </View>
          )}
          <AppTopBar variant="overlay" style={{ top: insets.top + spacing.sm }} />
        </Pressable>

        {/* Main info */}
        <View style={styles.main}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{shop.name}</Text>
            <View style={styles.ratingPill}>
              <MaterialCommunityIcons name="star" size={13} color="#F5C518" />
              <Text style={styles.ratingLabel}>{Number(shop.rating).toFixed(1)}</Text>
            </View>
          </View>
          <Text style={styles.coffeeTypes}>☕ {(shop.coffeeTypes || []).slice(0, 4).join(' · ')}</Text>
          <Text style={styles.location}>
            <MaterialCommunityIcons name="map-marker-outline" size={13} color={cc.accentText} />
            {' '}{shop.location}
          </Text>

          {matchedIntents.length > 0 && (
            <View style={styles.intentRow}>
              {matchedIntents.map((i) => (
                <View key={i.key} style={styles.intentChip}>
                  <Text style={styles.intentLabel}>{i.emoji} {i.label}</Text>
                </View>
              ))}
            </View>
          )}

          <Pressable onPress={() => setBookingOpen(true)} style={styles.bookBtn}>
            <MaterialCommunityIcons name="calendar-check-outline" size={18} color={cc.ctaText} />
            <Text style={styles.bookBtnLabel}>Reserve a Seat</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(`tel:${shop.phone}`)} style={styles.callBtn}>
            <MaterialCommunityIcons name="phone-outline" size={18} color={cc.text} />
            <Text style={styles.callBtnLabel}>Call {shop.phone}</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(`https://wa.me/${shop.phone?.replace(/\D/g, '')}`)} style={styles.waBtn}>
            <MaterialCommunityIcons name="whatsapp" size={18} color="#25D366" />
            <Text style={styles.waBtnLabel}>Contact on WhatsApp</Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* Menu first, right under the booking buttons: picked dishes go with the booking */}
        {menuItems.length > 0 && (() => {
          const grouped = {};
          menuItems.forEach((item) => {
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
                      const sel = !!selectedItems[item.id];
                      return (
                        <Pressable
                          key={item.id}
                          style={[styles.menuCard, sel && styles.menuCardSelected]}
                          onPress={() => setSelectedItems(prev => {
                            if (!prev[item.id]) return { ...prev, [item.id]: { name: item.name, price: item.price, qty: 1 } };
                            const next = { ...prev }; delete next[item.id]; return next;
                          })}
                        >
                          <View style={styles.menuCardImg}>
                            {item.photo_url
                              ? <Image source={{ uri: item.photo_url }} style={styles.menuCardImage} resizeMode="cover" />
                              : <MaterialCommunityIcons name="coffee-outline" size={28} color={cc.accentText} />}
                          </View>
                          {sel && (
                            <View style={styles.menuCardBadge}>
                              <MaterialCommunityIcons name="check" size={11} color={cc.text} />
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
          <Text style={styles.description}>{shop.description}</Text>
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
                    <MaterialCommunityIcons name="arrow-right" size={14} color={cc.accentText} />
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
                    <MaterialCommunityIcons name="magnify-plus-outline" size={20} color={cc.text} />
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.divider} />
          </>
        )}


        {/* Coffee details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coffee</Text>
          <View style={styles.tagGroup}>
            <Text style={styles.tagGroupLabel}>Types</Text>
            <View style={styles.tagRow}>
              {(shop.coffeeTypes || []).map((c) => <View key={c} style={styles.tag}><Text style={styles.tagLabel}>{c}</Text></View>)}
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
      </ScrollView>
      {pickedCount > 0 && !bookingOpen ? (
        <Pressable onPress={() => setBookingOpen(true)} style={[styles.dishBar, { bottom: insets.bottom + spacing.md }]} accessibilityRole="button">
          <Text style={styles.dishBarText}>🍽 {pickedCount} dish{pickedCount > 1 ? 'es' : ''} for your table · ≈ {pickedTotal.toLocaleString()} RWF</Text>
          <Text style={styles.dishBarCta}>Reserve a seat →</Text>
        </Pressable>
      ) : null}

      {/* Lightbox */}
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
        placeId={shop.id}
        placeName={shop.name}
        type="coffee_shop"
        navigation={navigation}
        selectedItems={selectedItems}
      />
    </GradientBackground>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <MaterialCommunityIcons name={icon} size={15} color={cc.accentText} style={{ width: 22 }} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dishBar: { position: 'absolute', left: gutter, right: gutter, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, backgroundColor: cc.cta, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  dishBarText: { flex: 1, color: cc.ctaText, fontSize: 13, fontWeight: '600' },
  dishBarCta: { color: cc.ctaText, fontSize: 14, fontWeight: '800' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoWell: { width: '100%', aspectRatio: 16 / 9, backgroundColor: 'rgba(142,98,52,0.14)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  priceBadge: { position: 'absolute', bottom: spacing.md, right: gutter, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  priceBadgeLabel: { fontSize: 13, fontWeight: '700', color: '#F5C518' },
  statusBadge: { position: 'absolute', bottom: spacing.md, left: gutter, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  statusLabel: { fontSize: 11, fontWeight: '700', color: cc.text },
  photosCountBadge: { position: 'absolute', top: spacing.md, right: gutter, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  photosCountLabel: { fontSize: 11, fontWeight: '600', color: cc.text },
  overlayBtn: { position: 'absolute', width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  main: { paddingHorizontal: gutter, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  name: { flex: 1, fontSize: 24, fontWeight: '800', color: cc.text, letterSpacing: -0.5 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,197,24,0.15)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4, gap: 4, marginLeft: spacing.sm },
  ratingLabel: { fontSize: 13, fontWeight: '700', color: '#F5C518' },
  coffeeTypes: { fontSize: 13, color: cc.accentText, marginBottom: spacing.xs },
  location: { fontSize: 13, color: cc.textMuted, marginBottom: spacing.sm },
  intentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  intentChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(142,98,52,0.18)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  intentLabel: { fontSize: 11.5, color: cc.accentText, fontWeight: '600' },
  bookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: cc.cta, borderRadius: radius.md, paddingVertical: spacing.md, marginBottom: spacing.sm, gap: spacing.sm },
  bookBtnLabel: { ...typography.bodyStrong, color: cc.ctaText },
  callBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: cc.accent, borderRadius: radius.md, paddingVertical: spacing.md, marginBottom: spacing.sm, gap: spacing.sm },
  callBtnLabel: { ...typography.bodyStrong, color: cc.text },
  waBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#25D366', borderRadius: radius.md, paddingVertical: spacing.md, gap: spacing.sm },
  waBtnLabel: { ...typography.bodyStrong, fontSize: 14, color: cc.text },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(236,223,208,0.18)', marginVertical: spacing.xs },
  section: { paddingHorizontal: gutter, paddingVertical: spacing.lg },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...typography.bodyStrong, fontSize: 16, color: cc.text, marginBottom: spacing.md },
  menuCatTitle: { fontSize: 12, fontWeight: '800', color: cc.accentText, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm },
  menuCard: { width: 120, marginRight: spacing.md, backgroundColor: 'rgba(236,223,208,0.07)', borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(236,223,208,0.22)', overflow: 'hidden' },
  menuCardSelected: { borderColor: cc.accent, borderWidth: 2 },
  menuCardImg: { width: '100%', height: 88, backgroundColor: 'rgba(142,98,52,0.12)', alignItems: 'center', justifyContent: 'center' },
  menuCardImage: { width: '100%', height: 88 },
  menuCardBadge: { position: 'absolute', top: spacing.xs, right: spacing.xs, backgroundColor: cc.accent, borderRadius: 10, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  menuCardBody: { padding: spacing.xs + 2 },
  menuCardName: { fontSize: 12, fontWeight: '600', color: cc.text, marginBottom: 3 },
  menuCardPrice: { fontSize: 12, fontWeight: '700', color: '#60C080' },
  menuBookBtn: { backgroundColor: cc.accent, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5 },
  menuBookBtnLabel: { fontSize: 12, fontWeight: '700', color: cc.text },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.md },
  seeAllLabel: { fontSize: 13, color: cc.accentText, fontWeight: '600' },
  description: { fontSize: 13.5, lineHeight: 21, color: cc.textSoft },
  tagGroup: { marginBottom: spacing.md },
  tagGroupLabel: { fontSize: 12, color: cc.textMuted, marginBottom: spacing.xs },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: { backgroundColor: 'rgba(142,98,52,0.18)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  tagLabel: { fontSize: 12, color: cc.accentText, fontWeight: '600' },
  detailsTable: { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(236,223,208,0.22)', borderRadius: radius.md, overflow: 'hidden' },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(236,223,208,0.15)' },
  detailLabel: { flex: 1, fontSize: 13, color: cc.textMuted, marginLeft: spacing.xs },
  detailValue: { flex: 2, fontSize: 13, fontWeight: '600', color: cc.text, textAlign: 'right' },
  gallery: { paddingHorizontal: gutter, paddingBottom: spacing.lg, gap: spacing.sm },
  galleryItem: { width: 160, position: 'relative' },
  galleryImage: { width: 160, height: 120, borderRadius: radius.md, marginBottom: spacing.xs },
  galleryLabel: { fontSize: 11.5, color: cc.textSoft, textAlign: 'center' },
  galleryOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, borderRadius: radius.md, backgroundColor: 'rgba(0,0,0,0)', alignItems: 'center', justifyContent: 'center' },
});

const lb = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  slide: { width: SW, height: SH, alignItems: 'center', justifyContent: 'center' },
  image: { width: SW, height: SH },
  labelWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: gutter },
  labelText: { fontSize: 13, color: 'rgba(236,223,208,0.75)', fontWeight: '500', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5 },
  counter: { position: 'absolute', alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5 },
  counterText: { fontSize: 13, color: cc.text, fontWeight: '600' },
  arrow: { position: 'absolute', top: '50%', marginTop: -24, width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  arrowLeft: { left: spacing.md },
  arrowRight: { right: spacing.md },
  dots: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(236,223,208,0.35)' },
  dotActive: { backgroundColor: cc.text, width: 18 },
  closeBtn: { position: 'absolute', right: spacing.md, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
});
