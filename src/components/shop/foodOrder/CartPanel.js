/**
 * CartPanel.js — "Your order": the dishes grouped by place. Each place has
 * a tick box (unticked = kept for later), − / + per dish, its own delivery
 * fee and a minimum-order bar, and "Order only from …". The footer totals
 * only the ticked places. A just-added line glows briefly.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { radius, spacing } from '../../../theme';
import { useShopTheme, useShopStyles } from '../../../theme/shopThemes';
import { useFoodCart } from '../../../context/FoodCartContext';
import { isSupplierOpen } from '../../../screens/shop/foodOrder/useFoodCatalog';
import { rwf } from '../../../utils/money';

// Live state of one place's part: what blocks it, using current place data.
export function groupState(group, supplier) {
  const minOrder = Number(supplier?.minOrder ?? group.minOrder ?? 0);
  const fee = Number(supplier?.deliveryFee ?? group.deliveryFee ?? 0);
  const closed = supplier ? !isSupplierOpen(supplier) || !supplier.deliveryEnabled : false;
  const short = Math.max(0, minOrder - group.subtotal);
  return { minOrder, fee, closed, short, ok: !closed && short === 0 };
}

export default function CartPanel({ suppliers, onCheckout, onOpenPlace, title = 'Your order' }) {
  const c = useShopTheme();
  const styles = useShopStyles(makeStyles);
  const cart = useFoodCart();
  const states = cart.groups.map((g) => ({ g, s: groupState(g, suppliers.get(g.key)) }));
  const chosen = states.filter(({ g, s }) => g.selected && s.ok);
  const food = chosen.reduce((n, { g }) => n + g.subtotal, 0);
  const delivery = chosen.reduce((n, { s }) => n + s.fee, 0);
  const blocked = states.filter(({ g, s }) => g.selected && !s.ok);
  const fresh = cart.lastAdded && Date.now() - cart.lastAdded.at < 1500 ? cart.lastAdded : null;

  if (!cart.groups.length) {
    return (
      <View style={styles.panel}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.muted}>Your order is empty. Add dishes with +.</Text>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={() => window.confirm('Remove everything from your order?') && cart.clear()}><Text style={styles.link}>Clear</Text></Pressable>
      </View>

      {states.map(({ g, s }) => (
        <View key={g.key} style={[styles.group, !g.selected && styles.later]}>
          <View style={styles.groupHead}>
            <Pressable onPress={() => cart.toggleSelected(g.key)} accessibilityRole="checkbox" accessibilityState={{ checked: g.selected }} hitSlop={6}>
              <MaterialCommunityIcons name={g.selected ? 'checkbox-marked' : 'checkbox-blank-outline'} size={20} color={g.selected ? c.accent : c.textMuted} />
            </Pressable>
            <Pressable onPress={() => onOpenPlace(g)} style={{ flex: 1 }}><Text style={styles.place} numberOfLines={1}>{g.name}</Text></Pressable>
            {!g.selected ? <Text style={styles.tag}>kept for later</Text> : null}
          </View>
          {g.itemList.map((i) => {
            const glow = fresh && fresh.key === g.key && fresh.itemId === i.id;
            return (
              <View key={i.id} style={[styles.line, glow && styles.glow]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.item} numberOfLines={1}>{i.name}</Text>
                  {i.note ? <Text style={styles.note} numberOfLines={1}>“{i.note}”</Text> : null}
                </View>
                <Pressable onPress={() => cart.setQty(g.key, i.id, i.qty - 1)} style={styles.step} accessibilityLabel={`One less ${i.name}`}><MaterialCommunityIcons name={i.qty === 1 ? 'trash-can-outline' : 'minus'} size={14} color={c.text} /></Pressable>
                <Text style={styles.qty}>{i.qty}</Text>
                <Pressable onPress={() => cart.setQty(g.key, i.id, i.qty + 1)} style={styles.step} accessibilityLabel={`One more ${i.name}`}><MaterialCommunityIcons name="plus" size={14} color={c.text} /></Pressable>
                <Text style={styles.amount}>{rwf(i.price * i.qty)}</Text>
              </View>
            );
          })}
          <View style={styles.line}><Text style={[styles.muted, { flex: 1 }]}>Delivery</Text><Text style={styles.muted}>{rwf(s.fee)}</Text></View>
          {s.closed ? <Text style={styles.warn}>Closed right now — keep it for later or remove it.</Text> : null}
          {!s.closed && s.minOrder > 0 ? (
            <View>
              <View style={styles.track}><View style={[styles.fill, { width: `${Math.min(100, (g.subtotal / s.minOrder) * 100)}%`, backgroundColor: s.short ? '#E6B92E' : '#4CAF50' }]} /></View>
              <Text style={s.short ? styles.warn : styles.okText}>{s.short ? `Add ${rwf(s.short)} more to order from here` : 'Minimum order reached ✓'}</Text>
            </View>
          ) : null}
          {s.ok && cart.groups.length > 1 ? (
            <Pressable onPress={() => { cart.selectOnly(g.key); onCheckout(); }}><Text style={styles.link}>Order only from {g.name} →</Text></Pressable>
          ) : null}
        </View>
      ))}

      <View style={styles.totals}>
        <View style={styles.line}><Text style={[styles.muted, { flex: 1 }]}>Food</Text><Text style={styles.muted}>{rwf(food)}</Text></View>
        <View style={styles.line}><Text style={[styles.muted, { flex: 1 }]}>Delivery{chosen.length > 1 ? ` (${chosen.length} deliveries)` : ''}</Text><Text style={styles.muted}>{rwf(delivery)}</Text></View>
        <View style={styles.line}><Text style={[styles.total, { flex: 1 }]}>Total</Text><Text style={styles.total}>{rwf(food + delivery)}</Text></View>
        {chosen.length > 1 ? <Text style={styles.muted}>ⓘ Arrives in {chosen.length} deliveries, at different times.</Text> : null}
        {blocked.length ? <Text style={styles.warn}>{blocked.map(({ g }) => g.name).join(', ')} can't be ordered yet — see above.</Text> : null}
      </View>
      <Pressable onPress={onCheckout} disabled={!chosen.length || blocked.length > 0}
        style={[styles.cta, (!chosen.length || blocked.length > 0) && { opacity: 0.45 }]}>
        <Text style={styles.ctaText}>Checkout{chosen.length ? ` · ${chosen.length} place${chosen.length > 1 ? 's' : ''} · ${rwf(food + delivery)}` : ''}</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  panel: { backgroundColor: c.panel, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, padding: 16, gap: 12 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: c.text, fontSize: 17, fontWeight: '800' },
  link: { color: c.accentText, fontWeight: '700', fontSize: 13 },
  group: { gap: 6, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.border },
  later: { opacity: 0.55 },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  place: { color: c.text, fontWeight: '800', fontSize: 14.5 },
  tag: { color: c.textMuted, fontSize: 11, fontStyle: 'italic' },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 6, paddingVertical: 2 },
  glow: { backgroundColor: c.accentSoft },
  item: { color: c.text, fontSize: 13.5 },
  note: { color: c.textMuted, fontSize: 11.5, fontStyle: 'italic' },
  step: { width: 24, height: 24, borderRadius: 12, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  qty: { color: c.text, fontWeight: '700', minWidth: 14, textAlign: 'center' },
  amount: { color: c.text, fontWeight: '600', fontSize: 13, minWidth: 72, textAlign: 'right' },
  muted: { color: c.textMuted, fontSize: 13 },
  track: { height: 5, borderRadius: 3, backgroundColor: c.surfaceAlt, overflow: 'hidden', marginTop: 4 },
  fill: { height: '100%', borderRadius: 3 },
  warn: { color: '#E6B92E', fontSize: 12.5, marginTop: 3 },
  okText: { color: '#7BC67E', fontSize: 12.5, marginTop: 3 },
  totals: { gap: 4 },
  total: { color: c.text, fontWeight: '800', fontSize: 16 },
  cta: { backgroundColor: c.cta, borderRadius: radius.md, paddingVertical: 13, alignItems: 'center' },
  ctaText: { color: c.ctaText, fontWeight: '800', fontSize: 15 },
});
