/**
 * OrderFoodScreen.js — Browse delivery restaurants, build a cart, place order.
 * Multi-restaurant cart not supported: switching restaurant clears the cart.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity, Pressable, TextInput,
  ActivityIndicator, StyleSheet, Alert, Modal, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiFetch } from '../../../services/apiClient';
import { useUser } from '../../../context/UserContext';
import GradientBackground from '../../../components/common/GradientBackground';
import { colors, typography, spacing, radius, gutter } from '../../../theme';
import { menuColors as mc } from '../../../theme/colors';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(n) {
  return `RWF ${Number(n).toLocaleString()}`;
}

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key] || 'Other';
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

// ─── sub-components ─────────────────────────────────────────────────────────

function PlaceCard({ place, onPress }) {
  return (
    <TouchableOpacity style={styles.placeCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.placeCardInner}>
        <View style={styles.placeImgPlaceholder}>
          <MaterialCommunityIcons
            name={place.place_type === 'coffeeshop' ? 'coffee' : 'silverware-fork-knife'}
            size={36} color={colors.blue600}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.placeName}>{place.name}</Text>
          <Text style={styles.placeMeta}>{place.location}</Text>
          <Text style={styles.placeMeta}>
            {place.estimated_time} · {place.delivery_fee > 0 ? `+${fmt(place.delivery_fee)} delivery` : 'Free delivery'}
          </Text>
          {place.min_order > 0 && (
            <Text style={styles.placeMeta}>Min. order: {fmt(place.min_order)}</Text>
          )}
        </View>
        <View style={styles.ratingBadge}>
          <MaterialCommunityIcons name="star" size={12} color="#f59e0b" />
          <Text style={styles.ratingText}>{place.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function CartIcon({ cart, onPress }) {
  const count = Object.values(cart).reduce((s, v) => s + v.qty, 0);
  return (
    <TouchableOpacity onPress={onPress} style={styles.cartIconBtn} activeOpacity={0.8}>
      <MaterialCommunityIcons name="cart-outline" size={22} color={colors.text} />
      {count > 0 && (
        <View style={styles.cartIconBadge}>
          <Text style={styles.cartIconBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── main screen ────────────────────────────────────────────────────────────

export default function OrderFoodScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');
  const submitSearch = () => setCommittedSearch(search.trim());

  // Selected place state
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);

  // Cart: { itemId: { name, price, qty } }
  const [cart, setCart] = useState({});
  const [cartPlaceId, setCartPlaceId] = useState(null);

  // Checkout modal
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [orderDone, setOrderDone] = useState(null);

  useEffect(() => {
    apiFetch('/food-orders/delivery-places')
      .then(d => setPlaces(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openPlace = useCallback(async (place) => {
    // Warn if cart belongs to a different restaurant
    if (cartPlaceId && cartPlaceId !== place.id && Object.keys(cart).length > 0) {
      Alert.alert(
        'Start new cart?',
        `You have items from another restaurant in your cart. Switch to ${place.name}?`,
        [
          { text: 'Keep current cart', style: 'cancel' },
          { text: 'Switch', style: 'destructive', onPress: () => { setCart({}); setCartPlaceId(null); doOpen(place); } },
        ]
      );
      return;
    }
    doOpen(place);
  }, [cart, cartPlaceId]);

  const doOpen = async (place) => {
    setSelectedPlace(place);
    setMenuLoading(true);
    try {
      const data = await apiFetch(`/food-orders/delivery-places/${place.id}/menu`);
      setMenuItems(Array.isArray(data) ? data : []);
    } catch { setMenuItems([]); }
    finally { setMenuLoading(false); }
  };

  const addToCart = useCallback((item) => {
    setCartPlaceId(selectedPlace?.id);
    setCart(prev => {
      const existing = prev[item.id];
      return { ...prev, [item.id]: { name: item.name, price: item.price, qty: (existing?.qty || 0) + 1 } };
    });
  }, [selectedPlace]);

  const removeFromCart = useCallback((item) => {
    setCart(prev => {
      const existing = prev[item.id];
      if (!existing || existing.qty <= 1) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return { ...prev, [item.id]: { ...existing, qty: existing.qty - 1 } };
    });
  }, []);

  const placeOrder = useCallback(async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to place an order.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    if (!deliveryAddress.trim() || !deliveryPhone.trim()) {
      Alert.alert('Missing info', 'Please enter your delivery address and phone number.');
      return;
    }
    const items = Object.entries(cart).map(([id, v]) => ({ id, name: v.name, price: v.price, qty: v.qty }));
    const subtotal = items.reduce((s, v) => s + v.price * v.qty, 0);
    const deliveryFee = selectedPlace?.delivery_fee || 0;
    setPlacing(true);
    try {
      const order = await apiFetch('/food-orders', {
        method: 'POST',
        body: {
          placeId: cartPlaceId,
          placeName: selectedPlace?.name || '',
          placeType: selectedPlace?.place_type || 'restaurant',
          items,
          subtotal,
          deliveryFee,
          total: subtotal + deliveryFee,
          deliveryAddress: deliveryAddress.trim(),
          deliveryPhone: deliveryPhone.trim(),
          notes: notes.trim(),
          paymentMethod: 'cash',
        },
      });
      setOrderDone(order);
      setCart({});
      setCartPlaceId(null);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  }, [user, cart, cartPlaceId, selectedPlace, deliveryAddress, deliveryPhone, notes, navigation]);

  const cartItems = useMemo(() => Object.entries(cart).map(([id, v]) => ({ id, ...v })), [cart]);
  const cartSubtotal = cartItems.reduce((s, v) => s + v.price * v.qty, 0);
  const cartDeliveryFee = selectedPlace?.delivery_fee || 0;

  // ── Order success screen ───────────────────────────────────────────────
  if (orderDone) {
    return (
      <GradientBackground colorsOverride={mc.gradient}>
        <View style={{ flex: 1, paddingTop: insets.top, alignItems: 'center', justifyContent: 'center', paddingHorizontal: gutter }}>
          <MaterialCommunityIcons name="check-circle-outline" size={72} color="#60C080" />
          <Text style={[styles.title, { textAlign: 'center', marginTop: spacing.lg }]}>Order placed!</Text>
          <Text style={[styles.bodyFaint, { textAlign: 'center', marginTop: spacing.sm }]}>
            Your order has been sent to {selectedPlace?.name}. You'll receive a notification when it's confirmed.
            Payment: Cash on delivery.
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { marginTop: spacing.xl }]}
            onPress={() => { setOrderDone(null); setShowCheckout(false); setSelectedPlace(null); }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Back to restaurants</Text>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    );
  }

  // ── Place menu view ────────────────────────────────────────────────────
  if (selectedPlace) {
    const grouped = groupBy(menuItems, 'category');
    const categories = Object.keys(grouped);
    return (
      <GradientBackground colorsOverride={mc.gradient}>
        <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedPlace(null)} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{selectedPlace.name}</Text>
            <Text style={styles.headerSub}>{selectedPlace.estimated_time} · {selectedPlace.delivery_fee > 0 ? fmt(selectedPlace.delivery_fee) + ' delivery' : 'Free delivery'}</Text>
          </View>
          <CartIcon cart={cart} onPress={() => setShowCheckout(true)} />
        </View>

        {menuLoading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color={colors.blue600} />
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: gutter }}
            showsVerticalScrollIndicator={false}
          >
            {categories.length === 0 && (
              <Text style={[styles.bodyFaint, { marginTop: spacing.xl, textAlign: 'center' }]}>Menu coming soon.</Text>
            )}
            {categories.map(cat => (
              <View key={cat} style={{ marginBottom: spacing.lg }}>
                <Text style={styles.categoryTitle}>{cat}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: gutter }}>
                  {grouped[cat].map(item => {
                    const qty = cart[item.id]?.qty || 0;
                    return (
                      <TouchableOpacity key={item.id} style={styles.menuCard} onPress={() => addToCart(item)} activeOpacity={0.85}>
                        <View style={styles.menuCardImg}>
                          {item.photo_url
                            ? <Image source={{ uri: item.photo_url }} style={styles.menuCardImage} resizeMode="cover" />
                            : <MaterialCommunityIcons name="food-outline" size={28} color={colors.blue600} />}
                        </View>
                        {qty > 0 && (
                          <View style={styles.menuCardBadge}>
                            <Text style={styles.menuCardBadgeText}>{qty}</Text>
                          </View>
                        )}
                        <Text style={styles.menuCardName} numberOfLines={2}>{item.name}</Text>
                        <Text style={styles.menuCardPrice}>{fmt(item.price)}</Text>
                        {qty > 0 && (
                          <TouchableOpacity style={styles.menuCardMinus} onPress={() => removeFromCart(item)}>
                            <MaterialCommunityIcons name="minus-circle" size={18} color={colors.blue600} />
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ))}
          </ScrollView>
        )}


        {/* Checkout modal */}
        <Modal visible={showCheckout} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCheckout(false)}>
          <View style={[styles.modal, { paddingTop: insets.top + spacing.md, backgroundColor: '#042C53' }]}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setShowCheckout(false)} style={styles.back}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Your order</Text>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: insets.bottom + 100 }}>
              {/* Order items */}
              {cartItems.map(v => (
                <View key={v.id} style={styles.orderRow}>
                  <Text style={styles.orderQty}>{v.qty}×</Text>
                  <Text style={[styles.bodyFaint, { flex: 1 }]}>{v.name}</Text>
                  <Text style={styles.bodyFaint}>{fmt(v.price * v.qty)}</Text>
                </View>
              ))}
              <View style={styles.divider} />
              <View style={styles.orderRow}>
                <Text style={styles.bodyFaint}>Subtotal</Text>
                <Text style={styles.bodyFaint}>{fmt(cartSubtotal)}</Text>
              </View>
              <View style={styles.orderRow}>
                <Text style={styles.bodyFaint}>Delivery</Text>
                <Text style={styles.bodyFaint}>{cartDeliveryFee > 0 ? fmt(cartDeliveryFee) : 'Free'}</Text>
              </View>
              <View style={[styles.orderRow, { marginTop: spacing.xs }]}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.white }}>Total</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.white }}>{fmt(cartSubtotal + cartDeliveryFee)}</Text>
              </View>

              <View style={styles.divider} />
              <Text style={styles.fieldLabel}>Delivery address *</Text>
              <TextInput
                style={styles.input}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                placeholder="Your address or nearest landmark"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.fieldLabel}>Phone number *</Text>
              <TextInput
                style={styles.input}
                value={deliveryPhone}
                onChangeText={setDeliveryPhone}
                placeholder="e.g. 0788 000 123"
                keyboardType="phone-pad"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.fieldLabel}>Notes for the restaurant (optional)</Text>
              <TextInput
                style={[styles.input, { minHeight: 64, textAlignVertical: 'top' }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any special instructions..."
                multiline
                placeholderTextColor={colors.textMuted}
              />

              <View style={styles.paymentRow}>
                <MaterialCommunityIcons name="cash" size={20} color="#60C080" />
                <Text style={[styles.bodyFaint, { marginLeft: spacing.xs, color: '#60C080' }]}>Payment: Cash on delivery</Text>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={placeOrder} disabled={placing} activeOpacity={0.85}>
                {placing ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryBtnText}>Place order · {fmt(cartSubtotal + cartDeliveryFee)}</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>
        </View>
      </GradientBackground>
    );
  }

  // ── Place list ─────────────────────────────────────────────────────────
  const filteredPlaces = committedSearch
    ? places.filter(p => {
        const q = committedSearch.toLowerCase();
        return p.name.toLowerCase().includes(q) ||
          (p.location || '').toLowerCase().includes(q) ||
          (p.place_type || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q);
      })
    : places;

  return (
    <GradientBackground colorsOverride={mc.gradient}>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <Text style={styles.headerTitle}>All Orders</Text>
          <CartIcon cart={cart} onPress={() => setShowCheckout(true)} />
        </View>

        <View style={styles.searchWrap}>
          <Pressable onPress={submitSearch} hitSlop={8}>
            <MaterialCommunityIcons name="magnify" size={18} color={colors.textOnNavyFaint} style={{ marginRight: spacing.xs }} />
          </Pressable>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={submitSearch}
            returnKeyType="search"
            placeholder="Search restaurants..."
            placeholderTextColor={colors.textOnNavyFaint}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setCommittedSearch(''); }}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textOnNavyFaint} />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color={colors.blue300} />
        ) : filteredPlaces.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="moped-outline" size={56} color={colors.textOnNavyFaint} />
            <Text style={styles.bodyFaint}>{places.length === 0 ? 'No delivery restaurants available yet.' : 'No results found.'}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredPlaces}
            keyExtractor={i => i.id}
            renderItem={({ item }) => <PlaceCard place={item} onPress={() => openPlace(item)} />}
            contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: insets.bottom + spacing.xl }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gutter,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: mc.border,
  },
  back: { padding: 4, marginRight: spacing.sm },
  headerTitle: { ...typography.title, color: colors.white, marginRight: spacing.sm },
  headerSub: { ...typography.caption, color: 'rgba(184,212,228,0.7)' },
  placeCard: {
    backgroundColor: mc.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  placeCardInner: { flexDirection: 'row', padding: spacing.md, gap: spacing.md, alignItems: 'flex-start' },
  placeImgPlaceholder: {
    width: 64, height: 64, borderRadius: radius.md,
    backgroundColor: mc.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  placeName: { ...typography.subtitle, color: mc.text, marginBottom: 2 },
  placeMeta: { ...typography.caption, color: mc.textMuted, marginBottom: 1 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(244,176,0,0.15)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  ratingText: { fontSize: 11, fontWeight: '700', color: '#D4A017' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: gutter,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: mc.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: { flex: 1, ...typography.body, color: mc.text },
  cartIconBtn: { padding: 6, position: 'relative' },
  cartIconBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: mc.accent,
    borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  cartIconBadgeText: { fontSize: 10, fontWeight: '700', color: colors.white },
  categoryTitle: { fontSize: 12, fontWeight: '800', color: mc.espresso, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm, paddingLeft: 2 },
  menuCard: {
    width: 120,
    marginRight: spacing.md,
    backgroundColor: mc.surfaceAlt,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  menuCardImg: {
    width: '100%', height: 90,
    backgroundColor: '#2C2C2E',
    alignItems: 'center', justifyContent: 'center',
  },
  menuCardImage: { width: '100%', height: 90 },
  menuCardBadge: {
    position: 'absolute', top: spacing.xs, right: spacing.xs,
    backgroundColor: mc.accent, borderRadius: 10,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center',
  },
  menuCardBadgeText: { fontSize: 11, fontWeight: '700', color: colors.white },
  menuCardName: { fontSize: 12, color: mc.text, fontWeight: '600', padding: spacing.xs, paddingBottom: 2 },
  menuCardPrice: { fontSize: 12, color: mc.sage, fontWeight: '700', paddingHorizontal: spacing.xs, paddingBottom: spacing.xs },
  menuCardMinus: { position: 'absolute', bottom: spacing.xs, right: spacing.xs },
  modal: { flex: 1 },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  orderQty: { fontSize: 13, color: mc.textMuted, width: 28 },
  bodyFaint: { fontSize: 13, color: mc.textMuted },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: mc.border, marginVertical: spacing.md },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: mc.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    backgroundColor: mc.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: mc.text,
  },
  paymentRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, padding: spacing.md, backgroundColor: mc.sageSoft, borderRadius: radius.md },
  primaryBtn: {
    backgroundColor: mc.accent,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },
  title: { fontSize: 20, fontWeight: '800', color: colors.white },
});
