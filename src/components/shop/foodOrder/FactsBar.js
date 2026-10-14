/**
 * FactsBar.js — on a supplier's page, everything that answers "can I order
 * from here now?" in one strip: open/closed, delivery time, fee, minimum
 * order and how to pay.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius } from '../../../theme';
import { useShopStyles } from '../../../theme/shopThemes';
import { rwf } from '../place/MenuSection';

export default function FactsBar({ supplier, open }) {
  const styles = useShopStyles(makeStyles);
  const facts = [
    [open ? '🟢' : '🔴', open ? (supplier.openStatus || 'Open now') : 'Closed now'],
    ['🚚', supplier.estimatedTime || '30–45 min'],
    ['💵', `Delivery ${rwf(supplier.deliveryFee)}`],
    ['🧾', supplier.minOrder ? `Minimum ${rwf(supplier.minOrder)}` : 'No minimum'],
    ['💳', 'Cash on delivery'],
  ];
  return (
    <View style={styles.bar}>
      {facts.map(([icon, text]) => (
        <View key={text} style={styles.fact}><Text style={styles.icon}>{icon}</Text><Text style={styles.text}>{text}</Text></View>
      ))}
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  bar: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, overflow: 'hidden' },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12, borderRightWidth: 1, borderRightColor: c.border },
  icon: { fontSize: 15 },
  text: { color: c.text, fontSize: 14, fontWeight: '600' },
});
