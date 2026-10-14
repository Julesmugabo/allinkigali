/**
 * AddedToast.js — "✓ Classic Burger added · View order", shown for a couple
 * of seconds at the bottom whenever a dish goes into the order.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFoodCart } from '../../../context/FoodCartContext';
import { useShopStyles } from '../../../theme/shopThemes';

export default function AddedToast({ onView }) {
  const styles = useShopStyles(makeStyles);
  const { lastAdded } = useFoodCart();
  const [shown, setShown] = useState(null);
  useEffect(() => {
    if (!lastAdded || Date.now() - lastAdded.at > 1000) return undefined;
    setShown(lastAdded);
    const t = setTimeout(() => setShown(null), 2600);
    return () => clearTimeout(t);
  }, [lastAdded]);
  if (!shown) return null;
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.toast}>
        <Text style={styles.text}>✓ {shown.qty > 1 ? `${shown.qty} × ` : ''}{shown.name} added</Text>
        {onView ? <Pressable onPress={onView}><Text style={styles.link}>View order</Text></Pressable> : null}
      </View>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  wrap: { position: 'fixed', left: 0, right: 0, bottom: 28, alignItems: 'center', zIndex: 50 },
  toast: { flexDirection: 'row', gap: 16, alignItems: 'center', backgroundColor: '#0E3B26', borderWidth: 1, borderColor: '#2E8B57', borderRadius: 24, paddingHorizontal: 18, paddingVertical: 10 },
  text: { color: '#FFFFFF', fontWeight: '700' },
  link: { color: c.accentText, fontWeight: '800', textDecorationLine: 'underline' },
});
