/**
 * SupplierScreen.js — one place's ordering page (wide web): photos of the
 * place and its food, a short description, the facts bar (open, time, fee,
 * minimum, payment), then Menu / Reviews / Info tabs, with the order panel
 * always on the right.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import GradientBackground from '../../../components/common/GradientBackground';
import WebContainer from '../../../web/layout/WebContainer';
import PhotoMosaic from '../../../components/shop/place/PhotoMosaic';
import PhotoViewer from '../../../components/shop/place/PhotoViewer';
import ReviewsSection from '../../../components/shop/place/ReviewsSection';
import FactsBar from '../../../components/shop/foodOrder/FactsBar';
import SupplierMenu from '../../../components/shop/foodOrder/SupplierMenu';
import SupplierInfo from '../../../components/shop/foodOrder/SupplierInfo';
import CartPanel from '../../../components/shop/foodOrder/CartPanel';
import AddedToast from '../../../components/shop/foodOrder/AddedToast';
import { useUser } from '../../../context/UserContext';
import { apiFetch } from '../../../services/apiClient';
import { useShopTheme, useShopStyles } from '../../../theme/shopThemes';
import { spacing } from '../../../theme';
import { placeKey } from '../../../context/FoodCartContext';
import useFoodCatalog, { isSupplierOpen } from './useFoodCatalog';

const EMPTY_REVIEWS = { count: 0, average: null, counts: {}, reviews: [] };

export default function SupplierScreen({ navigation, route }) {
  const c = useShopTheme();
  const styles = useShopStyles(makeStyles);
  const { type, id } = route.params || {};
  const { loading, bySupplierKey, menuOf } = useFoodCatalog();
  const { user } = useUser();
  const supplier = bySupplierKey.get(placeKey(type, id));
  const dishes = menuOf(placeKey(type, id));
  const [tab, setTab] = useState('menu');
  const [viewer, setViewer] = useState(null);
  const [reviews, setReviews] = useState(EMPTY_REVIEWS);

  const reloadReviews = useCallback(() => {
    if (!supplier) return;
    apiFetch(`/reviews?placeType=${supplier.kind.reviewType}&placeId=${encodeURIComponent(id)}`).then((r) => r && setReviews(r)).catch(() => {});
  }, [supplier, id]);
  useEffect(reloadReviews, [reloadReviews]);

  // The place's own photos first, then photos of its dishes.
  const photos = useMemo(() => [
    ...(supplier?.photos || []).map((p) => (typeof p === 'string' ? { url: p } : p)).filter((p) => p?.url),
    ...dishes.filter((d) => d.photoUrl).slice(0, 8).map((d) => ({ url: d.photoUrl, label: d.name })),
  ], [supplier, dishes]);

  if (!supplier) {
    return (
      <GradientBackground colorsOverride={c.gradient}>
        <View style={styles.center}>
          {loading ? <ActivityIndicator color={c.accentText} /> : <Text style={styles.missing}>This place isn't taking delivery orders right now.</Text>}
        </View>
      </GradientBackground>
    );
  }
  const open = isSupplierOpen(supplier);
  const rating = reviews.average ?? supplier.rating;
  const openDish = (d) => navigation.navigate('OrderFoodDish', { type, id, dishId: d.id });
  const tabs = [['menu', `🍽 Menu (${dishes.length})`], ['reviews', `⭐ Reviews (${reviews.count})`], ['info', 'ⓘ Info']];

  return (
    <GradientBackground colorsOverride={c.gradient}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <WebContainer>
          <Pressable onPress={() => navigation.navigate('OrderFood')} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={c.accentText} />
            <Text style={styles.backLabel}>All places</Text>
          </Pressable>
          <PhotoMosaic photos={photos} icon={supplier.kind.icon} onOpen={setViewer} height={340} />

          <View style={styles.head}>
            <Text style={styles.name}>{supplier.name}</Text>
            <Text style={styles.facts}>
              {rating ? <Text style={styles.rating}>★ {Number(rating).toFixed(1)}{reviews.count ? ` (${reviews.count} reviews)` : ''}  ·  </Text> : null}
              {[supplier.kind.subtitle(supplier), supplier.district || supplier.location].filter(Boolean).join('  ·  ')}
            </Text>
            {supplier.description ? <Text style={styles.desc} numberOfLines={2}>{supplier.description}</Text> : null}
          </View>
          <FactsBar supplier={supplier} open={open} />

          <View style={styles.tabs}>
            {tabs.map(([key, label]) => (
              <Pressable key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key && styles.tabOn]}>
                <Text style={[styles.tabLabel, tab === key && styles.tabLabelOn]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.body}>
            <View style={styles.main}>
              {tab === 'menu' ? <SupplierMenu supplier={supplier} dishes={dishes} closed={!open} onOpenDish={openDish} /> : null}
              {tab === 'reviews' ? (
                <ReviewsSection kind={supplier.kind} place={supplier} reviews={reviews} user={user}
                  onLogin={() => navigation.navigate('AccountTab', { screen: 'Login', params: { returnTo: { tab: 'ShopTab', screen: route.name, params: route.params } } })} onPosted={reloadReviews} />
              ) : null}
              {tab === 'info' ? <SupplierInfo supplier={supplier} /> : null}
            </View>
            <View style={styles.side}>
              <CartPanel suppliers={bySupplierKey} onCheckout={() => navigation.navigate('FoodCheckout')}
                onOpenPlace={(g) => navigation.navigate('OrderFoodPlace', { type: g.placeType, id: g.placeId })} />
            </View>
          </View>
        </WebContainer>
      </ScrollView>
      <AddedToast />
      {viewer != null && photos.length ? <PhotoViewer photos={photos} start={viewer} onClose={() => setViewer(null)} /> : null}
    </GradientBackground>
  );
}

const makeStyles = (c) => StyleSheet.create({
  scroll: { paddingTop: spacing.lg, paddingBottom: 120 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missing: { color: c.text, fontSize: 16 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: spacing.md },
  backLabel: { color: c.accentText, fontSize: 14, fontWeight: '600' },
  head: { marginTop: spacing.xl, marginBottom: spacing.lg, gap: 6 },
  name: { color: c.text, fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  facts: { color: c.textSoft, fontSize: 15.5 },
  rating: { color: '#F5C518', fontWeight: '700' },
  desc: { color: c.textSoft, fontSize: 15, lineHeight: 22, maxWidth: 820 },
  tabs: { flexDirection: 'row', gap: 4, marginTop: spacing.xl, marginBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: c.border },
  tab: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabOn: { borderBottomColor: c.accent },
  tabLabel: { color: c.textMuted, fontWeight: '700', fontSize: 15 },
  tabLabelOn: { color: c.text },
  body: { flexDirection: 'row', gap: spacing.xl, alignItems: 'flex-start' },
  main: { flex: 1, minWidth: 0 },
  side: { width: 340, position: 'sticky', top: 16 },
});
