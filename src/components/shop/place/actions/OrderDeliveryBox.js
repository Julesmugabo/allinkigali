/**
 * OrderDeliveryBox.js — on a restaurant/coffee page, for places that also
 * deliver: delivery time and fee, and a button into that place's menu in
 * Order Food (one cart for all delivery, no second cart on this page).
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useShopTheme, useShopStyles } from '../../../../theme/shopThemes';
import { rwf } from '../../../../utils/money';
import { makeBoxStyles } from './boxStyles';

export default function OrderDeliveryBox({ place, onOrder }) {
  const c = useShopTheme();
  const box = useShopStyles(makeBoxStyles);
  return (
    <View style={box.card}>
      <View style={box.titleRow}><MaterialCommunityIcons name="moped" size={20} color={c.accentText} /><Text style={box.title}>Prefer delivery?</Text></View>
      <Text style={box.muted}>
        {[place.estimatedTime ? `~${place.estimatedTime}` : null, `fee ${rwf(place.deliveryFee)}`, place.minOrder ? `min order ${rwf(place.minOrder)}` : null].filter(Boolean).join(' · ')}
      </Text>
      <Pressable onPress={onOrder} style={[box.primary, { backgroundColor: c.accent }]}>
        <Text style={[box.primaryLabel, { color: c.text }]}>Order delivery from {place.name} →</Text>
      </Pressable>
    </View>
  );
}
