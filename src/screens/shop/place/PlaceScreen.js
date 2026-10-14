/**
 * PlaceScreen.js — the wide-web page for one restaurant, coffee shop or
 * wedding venue. Photos on top; on the left everything about the place
 * (about, menu, reviews, location); on the right an action box that stays
 * on screen while scrolling (book / order / call). Similar places close it.
 * Phones keep the original detail screens.
 */
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import GradientBackground from '../../../components/common/GradientBackground';
import WebContainer from '../../../web/layout/WebContainer';
import PhotoMosaic from '../../../components/shop/place/PhotoMosaic';
import PhotoViewer from '../../../components/shop/place/PhotoViewer';
import PlaceHeader from '../../../components/shop/place/PlaceHeader';
import AboutSection from '../../../components/shop/place/AboutSection';
import MenuSection from '../../../components/shop/place/MenuSection';
import ReviewsSection from '../../../components/shop/place/ReviewsSection';
import LocationSection from '../../../components/shop/place/LocationSection';
import MoreLikeThis from '../../../components/shop/place/MoreLikeThis';
import { jumpTo } from '../../../components/shop/place/Section';
import BookBox from '../../../components/shop/place/actions/BookBox';
import DeliveryBox from '../../../components/shop/place/actions/DeliveryBox';
import ContactBox from '../../../components/shop/place/actions/ContactBox';
import { useUser } from '../../../context/UserContext';
import useSavedPlaces from '../../../hooks/useSavedPlaces';
import { colors, spacing } from '../../../theme';
import { isOpen } from '../home/useDiscoverData';
import usePlaceDetail from './usePlaceDetail';

export default function PlaceScreen({ kind, navigation, route }) {
  const id = route.params?.id;
  const { place, photos, menu, reviews, reloadReviews, similar, missing } = usePlaceDetail(kind, id);
  const { user } = useUser();
  const { isSaved, toggle } = useSavedPlaces();
  const [viewer, setViewer] = useState(null);
  const [cart, setCart] = useState({});
  const [copied, setCopied] = useState(false);

  const login = useCallback(() => navigation.navigate('AccountTab', { screen: 'Login' }), [navigation]);
  const addDish = useCallback((m) => setCart((c) => ({ ...c, [m.id]: { name: m.name, price: Number(m.price), qty: (c[m.id]?.qty || 0) + 1 } })), []);
  const removeDish = useCallback((m) => setCart((c) => {
    const qty = (c[m.id]?.qty || 0) - 1;
    const next = { ...c };
    if (qty > 0) next[m.id] = { ...c[m.id], qty }; else delete next[m.id];
    return next;
  }), []);
  const share = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  if (!place) {
    return (
      <GradientBackground>
        <View style={styles.center}>
          {missing ? <Text style={styles.missing}>This place could not be found.</Text> : <ActivityIndicator color={colors.blue300} />}
        </View>
      </GradientBackground>
    );
  }

  const canOrder = !!kind.orderType && place.deliveryEnabled && menu.length > 0;
  const sections = [
    { id: 'overview', label: 'Overview' },
    menu.length ? { id: 'menu', label: 'Menu' } : null,
    photos.length ? { id: 'photos', label: `Photos (${photos.length})` } : null,
    { id: 'reviews', label: 'Reviews' },
    { id: 'location', label: 'Location' },
  ].filter(Boolean);
  const onJump = (s) => (s === 'photos' ? setViewer(0) : jumpTo(s));
  const saved = isSaved(kind.key, place.id);

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scroll}>
        <WebContainer>
          <View style={styles.topBar}>
            <Pressable onPress={() => navigation.navigate(kind.listRoute)} style={styles.back}>
              <MaterialCommunityIcons name="arrow-left" size={18} color={colors.blue300} />
              <Text style={styles.backLabel}>Back to {kind.title.toLowerCase()}</Text>
            </Pressable>
            <View style={styles.tools}>
              <Pressable onPress={() => toggle(kind.key, place.id)} style={styles.tool}>
                <MaterialCommunityIcons name={saved ? 'heart' : 'heart-outline'} size={18} color={saved ? '#F87171' : colors.white} />
                <Text style={styles.toolLabel}>{saved ? 'Saved' : 'Save'}</Text>
              </Pressable>
              <Pressable onPress={share} style={styles.tool}>
                <MaterialCommunityIcons name="share-variant-outline" size={18} color={colors.white} />
                <Text style={styles.toolLabel}>{copied ? 'Link copied' : 'Share'}</Text>
              </Pressable>
            </View>
          </View>

          <PhotoMosaic photos={photos} icon={kind.icon} onOpen={setViewer} />

          <View style={styles.body}>
            <View style={styles.main}>
              <PlaceHeader kind={kind} place={place} reviews={reviews} sections={sections} onJump={onJump} />
              <AboutSection place={place} details={kind.details(place)} />
              <MenuSection menu={menu} canOrder={canOrder} cart={cart} onAdd={addDish} onRemove={removeDish} />
              <ReviewsSection kind={kind} place={place} reviews={reviews} user={user} onLogin={login} onPosted={reloadReviews} />
              <LocationSection place={place} />
            </View>
            <View style={styles.side}>
              <BookBox kind={kind} place={place} user={user} closedNow={!isOpen(place)} onLogin={login} />
              {canOrder ? (
                <DeliveryBox kind={kind} place={place} user={user} cart={cart} onClearCart={() => setCart({})} onLogin={login} onJumpToMenu={() => jumpTo('menu')} />
              ) : null}
              <ContactBox place={place} />
            </View>
          </View>

          <MoreLikeThis kind={kind} places={similar} onOpen={(pid) => navigation.push(kind.detailRoute, { id: pid })} />
        </WebContainer>
      </ScrollView>
      {viewer != null && photos.length ? <PhotoViewer photos={photos} start={viewer} onClose={() => setViewer(null)} /> : null}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: spacing.lg, paddingBottom: spacing.huge * 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missing: { color: colors.white, fontSize: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backLabel: { color: colors.blue300, fontSize: 14, fontWeight: '600' },
  tools: { flexDirection: 'row', gap: 8 },
  tool: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)' },
  toolLabel: { color: colors.white, fontWeight: '600', fontSize: 13.5 },
  body: { flexDirection: 'row', gap: spacing.huge, alignItems: 'flex-start' },
  main: { flex: 1, minWidth: 0 },
  side: { width: 360, gap: 14, position: 'sticky', top: 16, marginTop: spacing.xl },
});
