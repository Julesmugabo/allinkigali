/**
 * CartDrawer.js — on the Order Food cards page: a floating "🛒 Your order ·
 * 2 places · 12,300" button (bottom-right) that slides the order panel in
 * from the right. Also hosts the "added" message.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useFoodCart } from '../../../context/FoodCartContext';
import { useShopStyles } from '../../../theme/shopThemes';
import { rwf } from '../../../utils/money';
import CartPanel, { groupState } from './CartPanel';
import AddedToast from './AddedToast';

export default function CartDrawer({ suppliers, onCheckout, onOpenPlace }) {
  const styles = useShopStyles(makeStyles);
  const cart = useFoodCart();
  const [open, setOpen] = useState(false);
  const chosen = cart.groups.filter((g) => g.selected);
  const total = chosen.reduce((n, g) => n + g.subtotal + groupState(g, suppliers.get(g.key)).fee, 0);

  return (
    <>
      <AddedToast onView={() => setOpen(true)} />
      {cart.itemCount > 0 && !open ? (
        <Pressable onPress={() => setOpen(true)} style={styles.fab} accessibilityRole="button">
          <Text style={styles.fabTitle}>🛒 Your order</Text>
          <Text style={styles.fabSub}>{cart.groups.length} place{cart.groups.length > 1 ? 's' : ''} · {cart.itemCount} item{cart.itemCount > 1 ? 's' : ''} · {rwf(total)}</Text>
        </Pressable>
      ) : null}
      {open ? (
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close your order" />
          <ScrollView style={styles.sheet} contentContainerStyle={{ padding: 16 }}>
            <Pressable onPress={() => setOpen(false)} style={styles.close}><Text style={styles.closeText}>Close ✕</Text></Pressable>
            <CartPanel suppliers={suppliers} onCheckout={() => { setOpen(false); onCheckout(); }}
              onOpenPlace={(g) => { setOpen(false); onOpenPlace(g); }} />
          </ScrollView>
        </View>
      ) : null}
    </>
  );
}

const makeStyles = (c) => StyleSheet.create({
  fab: { position: 'fixed', right: 28, bottom: 28, zIndex: 40, backgroundColor: c.cta, borderRadius: 18, paddingHorizontal: 20, paddingVertical: 12, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 12 },
  fabTitle: { color: c.ctaText, fontWeight: '800', fontSize: 15 },
  fabSub: { color: c.ctaText, fontSize: 12.5, marginTop: 2, opacity: 0.9 },
  overlay: { position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, zIndex: 60, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { width: 420, maxWidth: '92%', backgroundColor: c.menu },
  close: { alignSelf: 'flex-end', marginBottom: 10 },
  closeText: { color: c.accentText, fontWeight: '700' },
});
