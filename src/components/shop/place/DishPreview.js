/**
 * DishPreview.js — clicking a dish on a restaurant/coffee page opens this:
 * big photo, full description, price, quantity and "Add for my table", so
 * the dish is ready when the guest arrives.
 */
import React, { useState } from 'react';
import { Modal, View, Text, Image, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { radius, spacing } from '../../../theme';
import { useShopTheme, useShopStyles } from '../../../theme/shopThemes';
import { rwf } from '../../../utils/money';

export default function DishPreview({ dish, placeName, onAdd, onClose }) {
  const c = useShopTheme();
  const styles = useShopStyles(makeStyles);
  const [qty, setQty] = useState(1);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.center} pointerEvents="box-none">
        <View style={styles.card}>
          <View style={styles.photo}>
            {dish.photoUrl ? <Image source={{ uri: dish.photoUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              : <MaterialCommunityIcons name="food-outline" size={56} color={c.textMuted} />}
            <Pressable onPress={onClose} style={styles.close} accessibilityLabel="Close"><MaterialCommunityIcons name="close" size={20} color="#FFFFFF" /></Pressable>
          </View>
          <View style={styles.body}>
            <View style={styles.row}>
              <Text style={styles.name}>{dish.name}</Text>
              <Text style={styles.price}>{rwf(dish.price)}</Text>
            </View>
            {dish.description ? <Text style={styles.desc}>{dish.description}</Text> : null}
            <Text style={styles.meta}>{dish.category} · {placeName}</Text>
            <View style={styles.addRow}>
              <View style={styles.qty}>
                <Pressable onPress={() => setQty((n) => Math.max(1, n - 1))} style={styles.step} accessibilityLabel="One less"><MaterialCommunityIcons name="minus" size={18} color={c.text} /></Pressable>
                <Text style={styles.qtyText}>{qty}</Text>
                <Pressable onPress={() => setQty((n) => Math.min(99, n + 1))} style={styles.step} accessibilityLabel="One more"><MaterialCommunityIcons name="plus" size={18} color={c.text} /></Pressable>
              </View>
              <Pressable onPress={() => { onAdd(dish, qty); onClose(); }} style={styles.cta}>
                <Text style={styles.ctaText}>Add {qty} for my table · {rwf(dish.price * qty)}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c) => StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { width: 560, maxWidth: '100%', borderRadius: radius.lg, overflow: 'hidden', backgroundColor: c.menu, borderWidth: 1, borderColor: c.border },
  photo: { width: '100%', aspectRatio: 16 / 9, backgroundColor: c.photoWell, alignItems: 'center', justifyContent: 'center' },
  close: { position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.xl, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  name: { flex: 1, color: c.text, fontSize: 22, fontWeight: '800' },
  price: { color: c.text, fontSize: 18, fontWeight: '800' },
  desc: { color: c.textSoft, fontSize: 15, lineHeight: 22 },
  meta: { color: c.textMuted, fontSize: 13 },
  addRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: spacing.md },
  qty: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.surfaceAlt, borderRadius: 22, padding: 3 },
  step: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  qtyText: { color: c.text, fontSize: 17, fontWeight: '800', minWidth: 20, textAlign: 'center' },
  cta: { flex: 1, backgroundColor: c.cta, borderRadius: radius.md, paddingVertical: 13, alignItems: 'center' },
  ctaText: { color: c.ctaText, fontWeight: '800', fontSize: 15 },
});
