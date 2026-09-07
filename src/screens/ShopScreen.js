/**
 * ShopScreen.js — Ecran yo gushakisha ubucuruzi/serivisi (the shop tab).
 *
 * The platform doesn't sell or deliver anything itself — sellers (gas,
 * gyms, rides, ...) register, and this screen is where a customer finds one
 * and connects with them. All of it lives in ServicesPanel; this screen is
 * just the safe-area wrapper.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import ServicesPanel from '../components/shop/ServicesPanel';
import { spacing } from '../theme';

export default function ShopScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <GradientBackground>
      <View style={styles.flex}>
        <ServicesPanel navigation={navigation} topPadding={insets.top + spacing.md} />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
