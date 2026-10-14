/**
 * OrderFoodWide.js — Order Food on a wide browser, in three columns:
 * places that deliver (left), the chosen place's menu (middle) and the cart
 * that stays on screen (right). The chosen place is in the web address
 * (?place=id) so a link opens straight on its menu. Phones keep
 * OrderFoodScreen.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import GradientBackground from '../../../components/common/GradientBackground';
import WebContainer from '../../../web/layout/WebContainer';
import DeliveryPlaceList from '../../../components/shop/orderFood/DeliveryPlaceList';
import MenuSection, { rwf } from '../../../components/shop/place/MenuSection';
import DeliveryBox from '../../../components/shop/place/actions/DeliveryBox';
import ContactBox from '../../../components/shop/place/actions/ContactBox';
import { useUser } from '../../../context/UserContext';
import { apiFetch } from '../../../services/apiClient';
import { colors, spacing } from '../../../theme';
import useDiscoverData from '../home/useDiscoverData';
import KINDS from '../browse/kinds';

export default function OrderFoodWide({ navigation, route }) {
  const { restaurants, coffeeShops, loading } = useDiscoverData();
  const { user } = useUser();
  const places = useMemo(() => [
    ...restaurants.filter((p) => p.deliveryEnabled).map((p) => ({ ...p, kind: KINDS.resto })),
    ...coffeeShops.filter((p) => p.deliveryEnabled).map((p) => ({ ...p, kind: KINDS.coffee })),
  ], [restaurants, coffeeShops]);

  const wanted = route.params?.place;
  const place = places.find((p) => String(p.id) === String(wanted)) || places[0] || null;
  const [menu, setMenu] = useState({ id: null, items: [], loading: false });
  const [cart, setCart] = useState({});

  useEffect(() => {
    if (!place) return undefined;
    let live = true;
    setMenu({ id: place.id, items: [], loading: true });
    apiFetch(place.kind.menuPath(place.id))
      .then((d) => live && setMenu({ id: place.id, items: (Array.isArray(d) ? d : []).filter((m) => m.available !== false), loading: false }))
      .catch(() => live && setMenu({ id: place.id, items: [], loading: false }));
    return () => { live = false; };
  }, [place?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // One cart per place: switching place with dishes in the cart asks first.
  const select = (p) => {
    if (String(p.id) === String(place?.id)) return;
    if (Object.keys(cart).length && !window.confirm(`Your cart from ${place.name} will be emptied. Continue?`)) return;
    setCart({});
    navigation.setParams({ place: p.id });
  };
  const add = (m) => setCart((c) => ({ ...c, [m.id]: { name: m.name, price: Number(m.price), qty: (c[m.id]?.qty || 0) + 1 } }));
  const remove = (m) => setCart((c) => {
    const qty = (c[m.id]?.qty || 0) - 1;
    const next = { ...c };
    if (qty > 0) next[m.id] = { ...c[m.id], qty }; else delete next[m.id];
    return next;
  });
  const login = () => navigation.navigate('AccountTab', { screen: 'Login' });

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scroll}>
        <WebContainer>
          <Pressable onPress={() => navigation.navigate('Shop')} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={colors.blue300} />
            <Text style={styles.backLabel}>Resto/Coffee</Text>
          </Pressable>
          <Text style={styles.heading}>Order food</Text>
          <Text style={styles.sub}>Delivered to your door · pay cash on delivery</Text>

          {loading && !places.length ? <ActivityIndicator color={colors.blue300} style={{ marginTop: spacing.huge }} /> : null}
          {!loading && !places.length ? <Text style={styles.sub}>No place is delivering right now — check back soon.</Text> : null}

          {place ? (
            <View style={styles.body}>
              <DeliveryPlaceList places={places} selectedId={place.id} onSelect={select} />

              <View style={styles.middle}>
                <View style={styles.placeHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <Text style={styles.placeMeta}>
                      {[place.estimatedTime && `~${place.estimatedTime}`, `delivery ${rwf(place.deliveryFee)}`, place.minOrder ? `min order ${rwf(place.minOrder)}` : null].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Pressable onPress={() => navigation.navigate(place.kind.detailRoute, { id: place.id })}>
                    <Text style={styles.link}>See the place →</Text>
                  </Pressable>
                </View>
                {menu.loading ? <ActivityIndicator color={colors.blue300} style={{ marginTop: spacing.xl }} /> : null}
                {!menu.loading && !menu.items.length ? (
                  <Text style={styles.empty}>{place.name} hasn't put its menu online yet. Call or WhatsApp them to order.</Text>
                ) : null}
                <MenuSection menu={menu.id === place.id ? menu.items : []} canOrder cart={cart} onAdd={add} onRemove={remove} />
              </View>

              <View style={styles.side}>
                <DeliveryBox kind={place.kind} place={place} user={user} cart={cart} onClearCart={() => setCart({})} onLogin={login} />
                <ContactBox place={place} />
              </View>
            </View>
          ) : null}
        </WebContainer>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: spacing.xl, paddingBottom: spacing.huge * 2 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  backLabel: { color: colors.blue300, fontSize: 14, fontWeight: '600' },
  heading: { color: colors.white, fontSize: 30, fontWeight: '800', marginTop: spacing.sm },
  sub: { color: colors.textOnNavyFaint, fontSize: 15, marginTop: 4 },
  body: { flexDirection: 'row', gap: spacing.xxl, marginTop: spacing.xl, alignItems: 'flex-start' },
  middle: { flex: 1, minWidth: 0 },
  placeHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: spacing.sm },
  placeName: { color: colors.white, fontSize: 24, fontWeight: '800' },
  placeMeta: { color: colors.textOnNavyFaint, fontSize: 14, marginTop: 2 },
  link: { color: colors.blue300, fontWeight: '700' },
  empty: { color: colors.textOnNavy, fontSize: 15, marginTop: spacing.xl },
  side: { width: 330, gap: 14, position: 'sticky', top: 16 },
});
