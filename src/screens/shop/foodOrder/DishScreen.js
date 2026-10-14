/**
 * DishScreen.js — one dish's own page (wide web), opened by clicking a
 * dish's photo, name or price: big photo, full description, price, which
 * place it's from, a note for the kitchen, quantity and "Add to cart", then
 * "Goes well with" (sides and drinks from the same place). Order panel on
 * the right. Its own address, so a single dish can be shared.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Image, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import GradientBackground from '../../../components/common/GradientBackground';
import WebContainer from '../../../web/layout/WebContainer';
import CartPanel from '../../../components/shop/foodOrder/CartPanel';
import AddedToast from '../../../components/shop/foodOrder/AddedToast';
import DishCard from '../../../components/shop/foodOrder/DishCard';
import { rwf } from '../../../utils/money';
import { useFoodCart, placeKey } from '../../../context/FoodCartContext';
import { useShopTheme, useShopStyles } from '../../../theme/shopThemes';
import { radius, spacing } from '../../../theme';
import useFoodCatalog, { isSupplierOpen } from './useFoodCatalog';

const SIDE_WORDS = ['drink', 'juice', 'soda', 'coke', 'fanta', 'water', 'side', 'fries', 'chips', 'salad', 'dessert', 'shake', 'coffee', 'tea'];
const isSide = (d) => SIDE_WORDS.some((w) => `${d.category} ${d.name}`.toLowerCase().includes(w));

export default function DishScreen({ navigation, route }) {
  const c = useShopTheme();
  const styles = useShopStyles(makeStyles);
  const { type, id, dishId } = route.params || {};
  const key = placeKey(type, id);
  const { loading, bySupplierKey, menuOf } = useFoodCatalog();
  const cart = useFoodCart();
  const supplier = bySupplierKey.get(key);
  const menu = menuOf(key);
  const dish = menu.find((d) => String(d.id) === String(dishId));
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');

  // Other categories of the same place, sides and drinks first, then most ordered.
  const pairs = useMemo(() => (dish ? menu.filter((d) => d.id !== dish.id && d.category !== dish.category)
    .sort((a, b) => (isSide(b) - isSide(a)) || b.orders - a.orders).slice(0, 4) : []), [menu, dish]);
  const popular = dish && dish.orders > 0 && menu.filter((d) => d.orders > dish.orders).length < 6;

  const backToMenu = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('OrderFoodPlace', { type, id }));
  if (!supplier || !dish) {
    return (
      <GradientBackground colorsOverride={c.gradient}>
        <View style={styles.center}>
          {loading ? <ActivityIndicator color={c.accentText} /> : <Text style={styles.missing}>This dish isn't available right now.</Text>}
        </View>
      </GradientBackground>
    );
  }
  const open = isSupplierOpen(supplier);
  const add = () => { cart.addItem(supplier, dish, qty, note.trim()); setQty(1); setNote(''); };

  return (
    <GradientBackground colorsOverride={c.gradient}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <WebContainer>
          <Pressable onPress={backToMenu} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={c.accentText} />
            <Text style={styles.backLabel}>Back to {supplier.name} menu</Text>
          </Pressable>
          <View style={styles.body}>
            <View style={styles.main}>
              <View style={[styles.photo, !dish.photoUrl && styles.noPhoto]}>
                {dish.photoUrl ? <Image source={{ uri: dish.photoUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  : <MaterialCommunityIcons name="food-outline" size={72} color={c.textMuted} />}
              </View>
              <View style={styles.titleRow}>
                <Text style={styles.name}>{dish.name}</Text>
                <Text style={styles.price}>{rwf(dish.price)}</Text>
              </View>
              {popular ? <Text style={styles.badge}>🔥 Popular at {supplier.name}</Text> : null}
              {dish.description ? <Text style={styles.desc}>{dish.description}</Text> : null}
              <Text style={styles.meta}>{dish.category} · {supplier.name}{supplier.district ? `, ${supplier.district}` : ''}</Text>

              <Text style={styles.label}>Note for the kitchen (optional)</Text>
              <TextInput value={note} onChangeText={setNote} placeholder="e.g. no onions, well done" placeholderTextColor={c.textMuted} style={styles.input} maxLength={200} />
              <View style={styles.addRow}>
                <View style={styles.qty}>
                  <Pressable onPress={() => setQty((n) => Math.max(1, n - 1))} style={styles.step} accessibilityLabel="One less"><MaterialCommunityIcons name="minus" size={18} color={c.text} /></Pressable>
                  <Text style={styles.qtyText}>{qty}</Text>
                  <Pressable onPress={() => setQty((n) => Math.min(99, n + 1))} style={styles.step} accessibilityLabel="One more"><MaterialCommunityIcons name="plus" size={18} color={c.text} /></Pressable>
                </View>
                <Pressable onPress={add} disabled={!open} style={[styles.cta, !open && { opacity: 0.45 }]}>
                  <Text style={styles.ctaText}>{open ? `Add ${qty} to cart · ${rwf(dish.price * qty)}` : `${supplier.name} is closed now`}</Text>
                </Pressable>
              </View>
              {cart.qtyOf(key, dish.id) ? <Text style={styles.inCart}>✓ {cart.qtyOf(key, dish.id)} already in your order</Text> : null}

              {pairs.length ? (
                <View style={styles.pairs}>
                  <Text style={styles.pairsTitle}>Goes well with</Text>
                  <View style={styles.grid}>
                    {pairs.map((d) => (
                      <View key={d.id} style={styles.cell}>
                        <DishCard dish={d} closed={!open} qty={cart.qtyOf(key, d.id)}
                          onOpen={() => navigation.push('OrderFoodDish', { type, id, dishId: d.id })}
                          onAdd={() => cart.addItem(supplier, d)} onChange={(n) => cart.setQty(key, d.id, n)} />
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
            <View style={styles.side}>
              <CartPanel suppliers={bySupplierKey} onCheckout={() => navigation.navigate('FoodCheckout')}
                onOpenPlace={(g) => navigation.navigate('OrderFoodPlace', { type: g.placeType, id: g.placeId })} />
            </View>
          </View>
        </WebContainer>
      </ScrollView>
      <AddedToast />
    </GradientBackground>
  );
}

const makeStyles = (c) => StyleSheet.create({
  scroll: { paddingTop: spacing.lg, paddingBottom: 120 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missing: { color: c.text, fontSize: 16 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: spacing.md },
  backLabel: { color: c.accentText, fontSize: 14, fontWeight: '600' },
  body: { flexDirection: 'row', gap: spacing.xxl, alignItems: 'flex-start' },
  main: { flex: 1, minWidth: 0, gap: 10 },
  side: { width: 340, position: 'sticky', top: 16 },
  noPhoto: { aspectRatio: undefined, height: 150 },
  photo: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: c.photoWell, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 16, marginTop: spacing.md },
  name: { flex: 1, color: c.text, fontSize: 30, fontWeight: '800' },
  price: { color: c.text, fontSize: 24, fontWeight: '800' },
  badge: { color: '#F5C518', fontWeight: '700' },
  desc: { color: c.textSoft, fontSize: 16, lineHeight: 25 },
  meta: { color: c.textMuted, fontSize: 14 },
  label: { color: c.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginTop: spacing.md },
  input: { color: c.text, borderRadius: radius.sm, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, outlineStyle: 'none' },
  addRow: { flexDirection: 'row', gap: 14, alignItems: 'center', marginTop: 6 },
  qty: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.surfaceAlt, borderRadius: 24, padding: 4 },
  step: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  qtyText: { color: c.text, fontSize: 18, fontWeight: '800', minWidth: 22, textAlign: 'center' },
  cta: { flex: 1, backgroundColor: c.cta, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  ctaText: { color: c.ctaText, fontWeight: '800', fontSize: 16 },
  inCart: { color: '#7BC67E', fontWeight: '700' },
  pairs: { marginTop: spacing.xl },
  pairsTitle: { color: c.text, fontSize: 20, fontWeight: '800', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  cell: { width: '50%', padding: 6 },
});
