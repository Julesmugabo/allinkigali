/**
 * PlaceScreen.js — the wide-web page for one restaurant, coffee shop or
 * wedding venue. Photos on top; on the left everything about the place
 * (about, menu, reviews, location); on the right an action box that stays
 * on screen while scrolling (book / order / call). Similar places close it.
 * Phones keep the original detail screens.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import GradientBackground from '../../../components/common/GradientBackground';
import WebContainer from '../../../web/layout/WebContainer';
import PhotoMosaic from '../../../components/shop/place/PhotoMosaic';
import PhotoViewer from '../../../components/shop/place/PhotoViewer';
import PlaceHeader from '../../../components/shop/place/PlaceHeader';
import AboutSection from '../../../components/shop/place/AboutSection';
import Section from '../../../components/shop/place/Section';
import DishPreview from '../../../components/shop/place/DishPreview';
import SupplierMenu from '../../../components/shop/foodOrder/SupplierMenu';
import ReviewsSection from '../../../components/shop/place/ReviewsSection';
import LocationSection from '../../../components/shop/place/LocationSection';
import MoreLikeThis from '../../../components/shop/place/MoreLikeThis';
import { jumpTo } from '../../../components/shop/place/Section';
import BookBox from '../../../components/shop/place/actions/BookBox';
import OrderDeliveryBox from '../../../components/shop/place/actions/OrderDeliveryBox';
import ContactBox from '../../../components/shop/place/actions/ContactBox';
import { useUser } from '../../../context/UserContext';
import useSavedPlaces from '../../../hooks/useSavedPlaces';
import { spacing } from '../../../theme';
import { isOpen } from '../home/useDiscoverData';
import usePlaceDetail from './usePlaceDetail';
import { useShopTheme, useShopStyles } from '../../../theme/shopThemes';

export default function PlaceScreen({ kind, navigation, route }) {
  const c = useShopTheme(); // eslint-disable-line no-unused-vars
  const styles = useShopStyles(makeStyles);
  const id = route.params?.id;
  const { place, photos, menu, reviews, reloadReviews, similar, missing } = usePlaceDetail(kind, id);
  const { user } = useUser();
  const { isSaved, toggle } = useSavedPlaces();
  const [viewer, setViewer] = useState(null);
  const [table, setTable] = useState({}); // dishes picked for the table booking: id → { id, name, price, qty }
  const [preview, setPreview] = useState(null); // dish shown in the quick look
  const [copied, setCopied] = useState(false);

  // Log in, then come straight back to this place (the booking box keeps what was filled in).
  const login = useCallback(() => navigation.navigate('AccountTab', { screen: 'Login', params: { returnTo: { tab: 'ShopTab', screen: route.name, params: route.params } } }), [navigation, route]);
  // The menu in the same shape the Order Food menu uses.
  const dishes = useMemo(() => menu.map((m) => ({
    id: String(m.id), category: m.category || 'Menu', name: m.name, description: m.description || '',
    price: Number(m.price || 0), photoUrl: m.photo_url || m.photoUrl || null, orders: 0, sortOrder: m.sortOrder || m.sort_order || 0,
  })), [menu]);
  const setDishQty = useCallback((dishId, qty) => setTable((t) => {
    const next = { ...t };
    if (qty > 0 && next[dishId]) next[dishId] = { ...next[dishId], qty: Math.min(qty, 99) }; else delete next[dishId];
    return next;
  }), []);
  const addDish = useCallback((d, n = 1) => setTable((t) => ({ ...t, [d.id]: { id: d.id, name: d.name, price: d.price, qty: Math.min((t[d.id]?.qty || 0) + n, 99) } })), []);
  const selection = useMemo(() => ({ qtyOf: (d) => table[d.id]?.qty || 0, add: (d) => addDish(d), setQty: (d, n) => setDishQty(d.id, n) }), [table, addDish, setDishQty]);
  const share = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  if (!place) {
    return (
      <GradientBackground colorsOverride={c.gradient}>
        <View style={styles.center}>
          {missing ? <Text style={styles.missing}>This place could not be found.</Text> : <ActivityIndicator color={c.accentText} />}
        </View>
      </GradientBackground>
    );
  }

  const hasMenu = !!kind.menuPath; // restaurants and coffee shops; weddings have none
  const delivers = !!kind.orderType && place.deliveryEnabled;
  const sections = [
    hasMenu ? { id: 'menu', label: `Menu${dishes.length ? ` (${dishes.length})` : ''}` } : null,
    photos.length ? { id: 'photos', label: `Photos (${photos.length})` } : null,
    { id: 'reviews', label: 'Reviews' },
    { id: 'about', label: 'About' },
    { id: 'location', label: 'Location' },
  ].filter(Boolean);
  const tableDishes = Object.values(table);
  const onJump = (s) => (s === 'photos' ? setViewer(0) : jumpTo(s));
  const saved = isSaved(kind.key, place.id);

  return (
    <GradientBackground colorsOverride={c.gradient}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <WebContainer>
          <View style={styles.topBar}>
            <Pressable onPress={() => navigation.navigate(kind.listRoute)} style={styles.back}>
              <MaterialCommunityIcons name="arrow-left" size={18} color={c.accentText} />
              <Text style={styles.backLabel}>Back to {kind.title.toLowerCase()}</Text>
            </Pressable>
            <View style={styles.tools}>
              <Pressable onPress={() => toggle(kind.key, place.id)} style={styles.tool}>
                <MaterialCommunityIcons name={saved ? 'heart' : 'heart-outline'} size={18} color={saved ? '#F87171' : c.text} />
                <Text style={styles.toolLabel}>{saved ? 'Saved' : 'Save'}</Text>
              </Pressable>
              <Pressable onPress={share} style={styles.tool}>
                <MaterialCommunityIcons name="share-variant-outline" size={18} color={c.text} />
                <Text style={styles.toolLabel}>{copied ? 'Link copied' : 'Share'}</Text>
              </Pressable>
            </View>
          </View>

          <PhotoMosaic photos={photos} icon={kind.icon} onOpen={setViewer} />

          <View style={styles.body}>
            <View style={styles.main}>
              <PlaceHeader kind={kind} place={place} reviews={reviews} sections={sections} onJump={onJump} />
              {hasMenu ? (
                <Section id="menu" title="Menu" right={<Text style={styles.menuHint}>Add dishes with + to have them ready for your table</Text>}>
                  <SupplierMenu supplier={{ ...place, key: `table:${place.id}` }} dishes={dishes} closed={false}
                    selection={selection} onOpenDish={setPreview} />
                </Section>
              ) : null}
              <ReviewsSection kind={kind} place={place} reviews={reviews} user={user} onLogin={login} onPosted={reloadReviews} />
              <AboutSection place={place} details={kind.details(place)} />
              <LocationSection place={place} />
            </View>
            <View style={styles.side}>
              <BookBox kind={kind} place={place} user={user} closedNow={!isOpen(place)} onLogin={login}
                dishes={tableDishes} onDishQty={hasMenu ? setDishQty : null} onBooked={() => setTable({})} />
              {delivers ? (
                <OrderDeliveryBox place={place} onOrder={() => navigation.navigate('OrderFoodPlace', { type: kind.orderType, id: place.id })} />
              ) : null}
              <ContactBox place={place} />
            </View>
          </View>

          <MoreLikeThis kind={kind} places={similar} onOpen={(pid) => navigation.push(kind.detailRoute, { id: pid })} />
        </WebContainer>
      </ScrollView>
      {preview ? <DishPreview dish={preview} placeName={place.name} onAdd={addDish} onClose={() => setPreview(null)} /> : null}
      {viewer != null && photos.length ? <PhotoViewer photos={photos} start={viewer} onClose={() => setViewer(null)} /> : null}
    </GradientBackground>
  );
}

const makeStyles = (c) => StyleSheet.create({
  scroll: { paddingTop: spacing.lg, paddingBottom: spacing.huge * 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missing: { color: c.text, fontSize: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backLabel: { color: c.accentText, fontSize: 14, fontWeight: '600' },
  tools: { flexDirection: 'row', gap: 8 },
  tool: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, backgroundColor: c.surface },
  toolLabel: { color: c.text, fontWeight: '600', fontSize: 13.5 },
  body: { flexDirection: 'row', gap: spacing.huge, alignItems: 'flex-start' },
  main: { flex: 1, minWidth: 0 },
  menuHint: { color: c.textMuted, fontSize: 13 },
  side: { width: 360, gap: 14, position: 'sticky', top: 16, marginTop: spacing.xl },
});
