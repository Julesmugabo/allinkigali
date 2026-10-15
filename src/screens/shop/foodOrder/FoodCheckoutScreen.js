/**
 * FoodCheckoutScreen.js — checkout for the ticked places in the order:
 * delivery address (remembered on this device) with a landmark, phone,
 * payment, and a summary per place. One press creates one order per place.
 * Guests are asked to log in here; nothing in the order is lost. If the
 * server says prices changed or a dish sold out, the cart is updated and
 * the person confirms again.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GradientBackground from '../../../components/common/GradientBackground';
import WebContainer from '../../../web/layout/WebContainer';
import { groupState } from '../../../components/shop/foodOrder/CartPanel';
import { rwf } from '../../../utils/money';
import { useFoodCart } from '../../../context/FoodCartContext';
import { useUser } from '../../../context/UserContext';
import { apiFetch } from '../../../services/apiClient';
import { useShopTheme, useShopStyles } from '../../../theme/shopThemes';
import { radius, spacing } from '../../../theme';
import useFoodCatalog from './useFoodCatalog';

const ADDRESS_KEY = 'allinkigali-delivery-address';

export default function FoodCheckoutScreen({ navigation, route }) {
  const c = useShopTheme();
  const styles = useShopStyles(makeStyles);
  const { bySupplierKey } = useFoodCatalog();
  const cart = useFoodCart();
  const { user } = useUser();
  const [form, setForm] = useState({ address: '', landmark: '', phone: '', notes: '' });
  const [status, setStatus] = useState({ busy: false, error: '' });

  useEffect(() => {
    AsyncStorage.getItem(ADDRESS_KEY).then((raw) => raw && setForm((f) => ({ ...f, ...JSON.parse(raw) }))).catch(() => {});
  }, []);
  useEffect(() => { if (user?.phone) setForm((f) => (f.phone ? f : { ...f, phone: user.phone })); }, [user]);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const chosen = cart.groups.filter((g) => g.selected).map((g) => ({ g, s: groupState(g, bySupplierKey.get(g.key)) }));
  const ready = chosen.filter(({ s }) => s.ok);
  const total = ready.reduce((n, { g, s }) => n + g.subtotal + s.fee, 0);

  const placeOrder = async () => {
    if (!user) { navigation.navigate('AccountTab', { screen: 'Login', params: { returnTo: { tab: 'ShopTab', screen: route.name, params: route.params } } }); return; }
    if (!form.address.trim() || !form.phone.trim()) { setStatus({ error: 'Add your delivery address and phone number.' }); return; }
    setStatus({ busy: true, error: '' });
    AsyncStorage.setItem(ADDRESS_KEY, JSON.stringify({ address: form.address, landmark: form.landmark })).catch(() => {});
    try {
      const res = await apiFetch('/food-orders/checkout', {
        method: 'POST',
        body: {
          groups: ready.map(({ g }) => ({ placeId: g.placeId, placeType: g.placeType, expectedSubtotal: g.subtotal, items: g.itemList.map((i) => ({ id: i.id, qty: i.qty, note: i.note })) })),
          address: form.address, landmark: form.landmark, phone: form.phone, notes: form.notes,
        },
      });
      cart.removePlaces(ready.map(({ g }) => g.key));
      navigation.replace('FoodOrderStatus', { checkoutId: res.checkoutId });
    } catch (e) {
      if (e.code === 'EMAIL_NOT_VERIFIED') {
        setStatus({ busy: false, error: '' });
        navigation.navigate('AccountTab', { screen: 'VerifyEmail', params: { returnTo: { tab: 'ShopTab', screen: route.name, params: route.params } } });
        return;
      }
      // "Prices changed" comes back with the current prices: refresh the cart so the person sees them.
      setStatus({ busy: false, error: e.message || 'Could not place your order. Please try again.' });
      apiFetch('/food-orders/catalog').then((menu) => {
        ready.forEach(({ g }) => cart.applyQuote(g.key, menu.filter((d) => d.placeId === g.placeId)));
      }).catch(() => {});
    }
  };

  return (
    <GradientBackground colorsOverride={c.gradient}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <WebContainer>
          <Pressable onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('OrderFood'))} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={c.accentText} />
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
          <Text style={styles.heading}>Checkout</Text>
          <View style={styles.body}>
            <View style={styles.main}>
              <Text style={styles.section}>Delivery</Text>
              <Field c={c} styles={styles} label="Address" value={form.address} onChange={set('address')} placeholder="e.g. KG 11 Ave 23, Kimihurura" />
              <Field c={c} styles={styles} label="Landmark (helps the rider)" value={form.landmark} onChange={set('landmark')} placeholder="e.g. blue gate after the roundabout" />
              <Field c={c} styles={styles} label="Phone" value={form.phone} onChange={set('phone')} placeholder="07…" />
              <Field c={c} styles={styles} label="Note for everyone (optional)" value={form.notes} onChange={set('notes')} placeholder="e.g. call when you arrive" />

              <Text style={styles.section}>Payment</Text>
              <View style={[styles.pay, styles.payOn]}><MaterialCommunityIcons name="radiobox-marked" size={20} color={c.accent} /><Text style={styles.payText}>Cash on delivery</Text></View>
              <View style={[styles.pay, { opacity: 0.5 }]}><MaterialCommunityIcons name="radiobox-blank" size={20} color={c.textMuted} /><Text style={styles.payText}>MTN MoMo · Airtel Money — coming soon</Text></View>
            </View>

            <View style={styles.side}>
              <Text style={styles.section}>Your order</Text>
              {!chosen.length ? <Text style={styles.muted}>Nothing is ticked in your order. Go back and tick a place.</Text> : null}
              {chosen.map(({ g, s }) => (
                <View key={g.key} style={[styles.group, !s.ok && { opacity: 0.55 }]}>
                  <Text style={styles.place}>{g.name}</Text>
                  {g.itemList.map((i) => (
                    <View key={i.id} style={styles.row}><Text style={styles.item}>{i.qty} × {i.name}{i.note ? ` — “${i.note}”` : ''}</Text><Text style={styles.item}>{rwf(i.qty * i.price)}</Text></View>
                  ))}
                  <View style={styles.row}><Text style={styles.muted}>Delivery</Text><Text style={styles.muted}>{rwf(s.fee)}</Text></View>
                  {!s.ok ? <Text style={styles.warn}>{s.closed ? 'Closed now — not included' : `Add ${rwf(s.short)} more — not included`}</Text> : null}
                </View>
              ))}
              <View style={styles.row}><Text style={styles.total}>Total</Text><Text style={styles.total}>{rwf(total)}</Text></View>
              {ready.length > 1 ? <Text style={styles.muted}>ⓘ {ready.length} separate deliveries — they may arrive at different times.</Text> : null}
              {status.error ? <Text style={styles.error}>{status.error}</Text> : null}
              <Pressable onPress={placeOrder} disabled={!ready.length || status.busy} style={[styles.cta, (!ready.length || status.busy) && { opacity: 0.45 }]}>
                <Text style={styles.ctaText}>{status.busy ? 'Placing your order…' : user ? `Place order · ${rwf(total)}` : 'Log in to place your order'}</Text>
              </Pressable>
            </View>
          </View>
        </WebContainer>
      </ScrollView>
    </GradientBackground>
  );
}

function Field({ c, styles, label, value, onChange, placeholder }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={c.textMuted} style={styles.input} />
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  scroll: { paddingTop: spacing.lg, paddingBottom: 120 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  backLabel: { color: c.accentText, fontSize: 14, fontWeight: '600' },
  heading: { color: c.text, fontSize: 30, fontWeight: '800', marginTop: spacing.sm, marginBottom: spacing.lg },
  body: { flexDirection: 'row', gap: spacing.huge, alignItems: 'flex-start' },
  main: { flex: 1, gap: 14, maxWidth: 620 },
  side: { width: 400, gap: 10, backgroundColor: c.panel, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, padding: 18 },
  section: { color: c.text, fontSize: 18, fontWeight: '800', marginTop: 6 },
  label: { color: c.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  input: { color: c.text, borderRadius: radius.sm, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, outlineStyle: 'none' },
  pay: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: c.border },
  payOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
  payText: { color: c.text, fontSize: 15, fontWeight: '600' },
  group: { gap: 4, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  place: { color: c.text, fontWeight: '800', fontSize: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  item: { color: c.textSoft, fontSize: 13.5, flexShrink: 1 },
  muted: { color: c.textMuted, fontSize: 13 },
  warn: { color: '#E6B92E', fontSize: 12.5 },
  total: { color: c.text, fontWeight: '800', fontSize: 17 },
  error: { color: '#F87171', fontSize: 13.5 },
  cta: { backgroundColor: c.cta, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  ctaText: { color: c.ctaText, fontWeight: '800', fontSize: 16 },
});
