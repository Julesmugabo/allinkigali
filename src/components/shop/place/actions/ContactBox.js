/**
 * ContactBox.js — Call and WhatsApp buttons, for people who'd rather ask
 * the place directly.
 */
import React from 'react';
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { radius } from '../../../../theme';
import { useShopTheme, useShopStyles } from '../../../../theme/shopThemes';

// Rwandan numbers written locally (07…) become +250 for WhatsApp.
const waNumber = (phone) => {
  const digits = String(phone).replace(/\D/g, '');
  return digits.startsWith('0') ? `250${digits.slice(1)}` : digits;
};

export default function ContactBox({ place }) {
  const c = useShopTheme(); // eslint-disable-line no-unused-vars
  const styles = useShopStyles(makeStyles);
  if (!place.phone) return null;
  return (
    <View style={styles.row}>
      <Pressable onPress={() => Linking.openURL(`tel:${place.phone}`)} style={[styles.btn, styles.call]}>
        <MaterialCommunityIcons name="phone-outline" size={18} color={c.text} />
        <Text style={styles.label}>Call</Text>
      </Pressable>
      <Pressable onPress={() => Linking.openURL(`https://wa.me/${waNumber(place.phone)}`)} style={[styles.btn, styles.wa]}>
        <MaterialCommunityIcons name="whatsapp" size={18} color="#25D366" />
        <Text style={styles.label}>WhatsApp</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: radius.md },
  call: { backgroundColor: c.accent },
  wa: { borderWidth: 1, borderColor: '#25D366' },
  label: { color: c.text, fontWeight: '700' },
});
