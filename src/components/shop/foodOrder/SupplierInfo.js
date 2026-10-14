/**
 * SupplierInfo.js — the "Info" tab of a supplier's page: about, opening
 * hours, delivery (time, fee, minimum, areas), payment, location and contact.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing } from '../../../theme';
import { useShopStyles } from '../../../theme/shopThemes';
import { rwf } from '../../../utils/money';
import LocationSection from '../place/LocationSection';
import ContactBox from '../place/actions/ContactBox';

export default function SupplierInfo({ supplier }) {
  const styles = useShopStyles(makeStyles);
  const rows = [
    ['About', supplier.description],
    ['Opening hours', supplier.openHours || supplier.openStatus],
    ['Delivery', `${supplier.estimatedTime || '30–45 min'} · fee ${rwf(supplier.deliveryFee)} · ${supplier.minOrder ? `minimum order ${rwf(supplier.minOrder)}` : 'no minimum order'}`],
    ['Delivers to', supplier.deliveryZones],
    ['Payment', 'Cash on delivery (mobile money coming soon)'],
  ].filter(([, v]) => v);
  return (
    <View>
      {rows.map(([k, v]) => (
        <View key={k} style={styles.row}><Text style={styles.key}>{k}</Text><Text style={styles.value}>{v}</Text></View>
      ))}
      <LocationSection place={supplier} />
      <View style={styles.contact}><ContactBox place={supplier} /></View>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border },
  key: { width: 160, color: c.textMuted, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, paddingTop: 2 },
  value: { flex: 1, color: c.text, fontSize: 15, lineHeight: 22 },
  contact: { maxWidth: 420, marginTop: spacing.md },
});
