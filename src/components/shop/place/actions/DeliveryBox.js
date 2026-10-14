/**
 * DeliveryBox.js — delivery time, fee and minimum order; once dishes are
 * added from the menu it becomes the cart with a total and checkout
 * (address + phone, cash on delivery). Log-in is asked for at checkout.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { apiFetch } from '../../../../services/apiClient';
import { rwf } from '../MenuSection';
import { makeBoxStyles } from './boxStyles';
import { useShopTheme, useShopStyles } from '../../../../theme/shopThemes';

export default function DeliveryBox({ kind, place, user, cart, onClearCart, onLogin, onJumpToMenu }) {
  const c = useShopTheme(); // eslint-disable-line no-unused-vars
  const styles = useShopStyles(makeStyles);
  const box = useShopStyles(makeBoxStyles);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(null); // null = use the account's phone
  const [status, setStatus] = useState({ busy: false, error: '', order: null });
  const items = Object.entries(cart).map(([id, v]) => ({ id, ...v }));
  const subtotal = items.reduce((s, v) => s + v.price * v.qty, 0);
  const fee = Number(place.deliveryFee || 0);
  const minOrder = Number(place.minOrder || 0);
  const shortBy = minOrder - subtotal;

  const checkout = async () => {
    if (!user) { onLogin(); return; }
    const deliveryPhone = phone ?? (user.phone || '');
    if (!address.trim() || !deliveryPhone.trim()) { setStatus({ error: 'Add your delivery address and phone.' }); return; }
    setStatus({ busy: true, error: '' });
    try {
      const order = await apiFetch('/food-orders', {
        method: 'POST',
        body: {
          placeId: place.id, placeName: place.name, placeType: kind.orderType,
          items: items.map(({ id, name, price, qty }) => ({ id, name, price, qty })),
          subtotal, deliveryFee: fee, total: subtotal + fee,
          deliveryAddress: address.trim(), deliveryPhone: deliveryPhone.trim(), paymentMethod: 'cash',
        },
      });
      onClearCart();
      setStatus({ busy: false, error: '', order });
    } catch (e) { setStatus({ busy: false, error: e.message || 'Could not place the order.' }); }
  };

  if (status.order) {
    return (
      <View style={box.card}>
        <MaterialCommunityIcons name="check-circle-outline" size={40} color="#60C080" />
        <Text style={box.title}>Order placed</Text>
        <Text style={box.muted}>{place.name} has your order. You'll be notified when it's confirmed; track it under Me → My Orders.</Text>
      </View>
    );
  }

  return (
    <View style={box.card}>
      <View style={box.titleRow}><MaterialCommunityIcons name="moped" size={20} color={c.accentText} /><Text style={box.title}>Order delivery</Text></View>
      <Text style={box.muted}>
        {[place.estimatedTime ? `~${place.estimatedTime}` : null, `fee ${rwf(fee)}`, minOrder ? `min order ${rwf(minOrder)}` : null].filter(Boolean).join(' · ')}
      </Text>

      {!items.length ? (
        onJumpToMenu
          ? <Pressable onPress={onJumpToMenu} style={styles.outline}><Text style={styles.outlineLabel}>Choose from the menu</Text></Pressable>
          : <Text style={box.muted}>Your cart is empty — add dishes with +.</Text>
      ) : (
        <>
          {items.map((v) => (
            <View key={v.id} style={styles.line}>
              <Text style={styles.lineName} numberOfLines={1}>{v.qty} × {v.name}</Text>
              <Text style={styles.linePrice}>{rwf(v.price * v.qty)}</Text>
            </View>
          ))}
          <View style={styles.line}><Text style={box.muted}>Delivery</Text><Text style={box.muted}>{rwf(fee)}</Text></View>
          <View style={styles.line}><Text style={styles.total}>Total</Text><Text style={styles.total}>{rwf(subtotal + fee)}</Text></View>
          {shortBy > 0 ? <Text style={styles.warn}>Add {rwf(shortBy)} more to reach the minimum order.</Text> : null}
          {user ? (
            <>
              <TextInput value={address} onChangeText={setAddress} placeholder="Delivery address" placeholderTextColor={c.textMuted} style={box.input} />
              <TextInput value={phone ?? (user.phone || '')} onChangeText={setPhone} placeholder="Phone number" placeholderTextColor={c.textMuted} style={box.input} />
            </>
          ) : null}
          {status.error ? <Text style={box.error}>{status.error}</Text> : null}
          <Pressable onPress={checkout} disabled={status.busy || shortBy > 0} style={[box.primary, (status.busy || shortBy > 0) && { opacity: 0.5 }]}>
            <Text style={box.primaryLabel}>{status.busy ? 'Placing order…' : user ? 'Checkout · pay cash on delivery' : 'Log in to checkout'}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  outline: { borderRadius: 10, borderWidth: 1, borderColor: c.borderStrong, paddingVertical: 10, alignItems: 'center' },
  outlineLabel: { color: c.accentText, fontWeight: '700' },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  lineName: { color: c.text, flex: 1 },
  linePrice: { color: c.text, fontWeight: '600' },
  total: { color: c.text, fontWeight: '800', fontSize: 15 },
  warn: { color: '#FBBF24', fontSize: 13 },
});
