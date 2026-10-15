/**
 * SuppliersScreen.js — Order Food on a wide browser: cards of every place
 * that delivers. Search (places and dishes), common-food chips ranked by
 * real menus and orders, delivery chips, and the order drawer. Open places
 * come first; closed ones are dimmed at the end. Phones keep OrderFoodScreen.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import GradientBackground from '../../../components/common/GradientBackground';
import WebContainer from '../../../web/layout/WebContainer';
import ChipRow from '../../../components/shop/browse/ChipRow';
import SupplierCard from '../../../components/shop/foodOrder/SupplierCard';
import CartDrawer from '../../../components/shop/foodOrder/CartDrawer';
import { rwf } from '../../../utils/money';
import { useFoodCart } from '../../../context/FoodCartContext';
import { useShopTheme, useShopStyles } from '../../../theme/shopThemes';
import { spacing } from '../../../theme';
import useFoodCatalog, { minutesOf, isSupplierOpen } from './useFoodCatalog';
import { FOODS, matchesFood } from './foodKeywords';

const DELIVERY_CHIPS = [
  { key: 'open', label: '🟢 Open now', test: isSupplierOpen },
  { key: 'fast', label: '⚡ Under 30 min', test: (p) => minutesOf(p) <= 30 },
  { key: 'cheap', label: '💸 Delivery ≤ 500 RWF', test: (p) => Number(p.deliveryFee || 0) <= 500 },
  { key: 'top', label: '⭐ Top rated', test: (p) => Number(p.rating || 0) >= 4.5 },
];

export default function SuppliersScreen({ navigation }) {
  const c = useShopTheme();
  const styles = useShopStyles(makeStyles);
  const { loading, suppliers, bySupplierKey, menuOf, foods } = useFoodCatalog();
  const cart = useFoodCart();
  const [q, setQ] = useState('');
  const [food, setFood] = useState(null);
  const [picks, setPicks] = useState([]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    const chosenFood = FOODS.find((f) => f.key === food);
    return suppliers.map((s) => {
      const menu = menuOf(s.key);
      let dishes = chosenFood ? menu.filter((d) => matchesFood(d, chosenFood)) : null;
      if (term) {
        const nameHit = `${s.name} ${s.kind.subtitle(s)}`.toLowerCase().includes(term);
        const hits = (dishes || menu).filter((d) => d.name.toLowerCase().includes(term));
        if (!nameHit && !hits.length) return null;
        if (hits.length) dishes = hits;
      }
      if (dishes && !dishes.length) return null;
      if (!DELIVERY_CHIPS.filter((x) => picks.includes(x.key)).every((x) => x.test(s))) return null;
      const cheapest = dishes && [...dishes].sort((a, b) => a.price - b.price)[0];
      const match = cheapest ? (dishes.length > 1 ? `${chosenFood ? chosenFood.emoji : '🍽'} ${dishes.length} matching dishes, from ${rwf(cheapest.price)}` : `🍽 ${cheapest.name} · ${rwf(cheapest.price)}`) : null;
      return { s, match, open: isSupplierOpen(s) };
    }).filter(Boolean).sort((a, b) => (b.open - a.open) || Number(b.s.rating || 0) - Number(a.s.rating || 0));
  }, [suppliers, menuOf, q, food, picks]);

  const openPlace = (s) => navigation.navigate('OrderFoodPlace', { type: s.placeType, id: s.id });
  const foodChips = foods.map((f) => ({ key: f.key, label: `${f.emoji} ${f.label}` }));

  return (
    <GradientBackground colorsOverride={c.gradient}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <WebContainer>
          <Pressable onPress={() => navigation.navigate('Shop')} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={c.accentText} />
            <Text style={styles.backLabel}>Restaurants & Cafés</Text>
          </Pressable>
          <Text style={styles.heading}>Order food</Text>
          <Text style={styles.sub}>Delivered to your door · from {suppliers.length} places · pay cash on delivery</Text>

          <View style={styles.search}>
            <MaterialCommunityIcons name="magnify" size={20} color={c.textMuted} />
            <TextInput value={q} onChangeText={setQ} placeholder="Search a place or a dish (e.g. “brochettes”)…" placeholderTextColor={c.textMuted} style={styles.input} />
            {q ? <Pressable onPress={() => setQ('')}><MaterialCommunityIcons name="close-circle" size={18} color={c.textMuted} /></Pressable> : null}
          </View>
          {foodChips.length ? <Text style={styles.chipsLabel}>Popular right now</Text> : null}
          <ChipRow chips={foodChips} active={food ? [food] : []} onToggle={(k) => setFood((f) => (f === k ? null : k))} />
          <ChipRow chips={DELIVERY_CHIPS} active={picks} onToggle={(k) => setPicks((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]))} />

          {loading && !suppliers.length ? <ActivityIndicator color={c.accentText} style={{ marginTop: spacing.huge }} /> : null}
          {!loading && !shown.length ? <Text style={styles.empty}>No place matches — try another food or remove a filter.</Text> : null}
          <View style={styles.grid}>
            {shown.map(({ s, match, open }) => (
              <View key={s.key} style={styles.cell}>
                <SupplierCard supplier={s} open={open} inCart={cart.countFor(s.key)} match={match} onPress={() => openPlace(s)} />
              </View>
            ))}
          </View>
        </WebContainer>
      </ScrollView>
      <CartDrawer suppliers={bySupplierKey} onCheckout={() => navigation.navigate('FoodCheckout')}
        onOpenPlace={(g) => navigation.navigate('OrderFoodPlace', { type: g.placeType, id: g.placeId })} />
    </GradientBackground>
  );
}

const makeStyles = (c) => StyleSheet.create({
  scroll: { paddingTop: spacing.xl, paddingBottom: 120 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  backLabel: { color: c.accentText, fontSize: 14, fontWeight: '600' },
  heading: { color: c.text, fontSize: 30, fontWeight: '800', marginTop: spacing.sm },
  sub: { color: c.textMuted, fontSize: 15, marginTop: 4, marginBottom: spacing.lg },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, borderRadius: 26, paddingHorizontal: 18, backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, marginBottom: spacing.md },
  input: { flex: 1, color: c.text, fontSize: 15.5, outlineStyle: 'none' },
  chipsLabel: { color: c.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8, marginTop: spacing.lg },
  cell: { width: '33.333%', padding: 8 },
  empty: { color: c.textSoft, fontSize: 15, marginTop: spacing.xl },
});
