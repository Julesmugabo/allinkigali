/**
 * DishCard.js — one dish on a menu. With a photo it's a card (text left,
 * photo right); without one it's a compact line, so long menus stay tidy.
 * "+" adds it to the order; the name, photo or price opens the dish page.
 */
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { radius, spacing } from '../../../theme';
import { useShopStyles } from '../../../theme/shopThemes';
import { rwf } from '../../../utils/money';
import AddControl from './AddControl';

export default function DishCard({ dish, popular, qty, closed, onOpen, onAdd, onChange }) {
  const styles = useShopStyles(makeStyles);
  const control = <AddControl qty={qty} onAdd={onAdd} onChange={onChange} disabled={closed} label={dish.name} />;
  const text = (
    <Pressable onPress={onOpen} style={styles.text} accessibilityRole="link" accessibilityLabel={`${dish.name}, ${rwf(dish.price)}`}>
      <Text style={styles.name} numberOfLines={2}>{dish.name}{popular ? '  🔥' : ''}</Text>
      {dish.description ? <Text style={styles.desc} numberOfLines={2}>{dish.description}</Text> : null}
      <Text style={styles.price}>{rwf(dish.price)}</Text>
    </Pressable>
  );
  if (!dish.photoUrl) {
    return <View style={[styles.card, styles.line, qty > 0 && styles.inCart]}>{text}{control}</View>;
  }
  return (
    <View style={[styles.card, qty > 0 && styles.inCart]}>
      {text}
      <View style={styles.photoCol}>
        <Pressable onPress={onOpen} accessibilityLabel={`Open ${dish.name}`}>
          <Image source={{ uri: dish.photoUrl }} style={styles.photo} resizeMode="cover" />
        </Pressable>
        <View style={styles.photoControl}>{control}</View>
      </View>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  card: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, minHeight: 112 },
  line: { alignItems: 'center', minHeight: 0 },
  inCart: { borderColor: c.accent },
  text: { flex: 1, gap: 4, cursor: 'pointer' },
  name: { color: c.text, fontSize: 15, fontWeight: '700' },
  desc: { color: c.textMuted, fontSize: 13, lineHeight: 18 },
  price: { color: c.text, fontSize: 14, fontWeight: '800', marginTop: 2 },
  photoCol: { width: 104 },
  photo: { width: 104, height: 88, borderRadius: radius.sm },
  photoControl: { position: 'absolute', bottom: -6, right: -4 },
});
