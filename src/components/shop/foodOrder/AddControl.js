/**
 * AddControl.js — the "+" on a dish. Once the dish is in the order it turns
 * into "− 2 +" so people see it worked and can change the amount right there.
 * Disabled (with a reason) when the place is closed.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useShopTheme, useShopStyles } from '../../../theme/shopThemes';

export default function AddControl({ qty, onAdd, onChange, disabled, label }) {
  const c = useShopTheme();
  const styles = useShopStyles(makeStyles);
  if (disabled) return <Text style={styles.off}>Closed</Text>;
  if (!qty) {
    return (
      <Pressable onPress={onAdd} accessibilityRole="button" accessibilityLabel={`Add ${label}`} style={({ hovered }) => [styles.plus, hovered && styles.plusHover]}>
        <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
      </Pressable>
    );
  }
  return (
    <View style={styles.stepper}>
      <Pressable onPress={() => onChange(qty - 1)} accessibilityLabel={`One less ${label}`} style={styles.step}>
        <MaterialCommunityIcons name={qty === 1 ? 'trash-can-outline' : 'minus'} size={16} color={c.text} />
      </Pressable>
      <Text style={styles.qty}>{qty}</Text>
      <Pressable onPress={() => onChange(qty + 1)} accessibilityLabel={`One more ${label}`} style={[styles.step, styles.stepAdd]}>
        <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  plus: { width: 34, height: 34, borderRadius: 17, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
  plusHover: { transform: [{ scale: 1.08 }] },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.surfaceAlt, borderRadius: 18, padding: 2 },
  step: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  stepAdd: { backgroundColor: c.accent },
  qty: { color: c.text, fontWeight: '800', minWidth: 16, textAlign: 'center' },
  off: { color: c.textMuted, fontSize: 12, fontWeight: '600' },
});
