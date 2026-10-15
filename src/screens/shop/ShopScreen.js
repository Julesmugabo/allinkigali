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

import GradientBackground from '../../components/common/GradientBackground';
import ShopHome from './home/ShopHome';
import useIsWideWeb from '../../web/hooks/useIsWideWeb';
import AppTopBar from '../../components/common/AppTopBar';
import { spacing, gutter } from '../../theme';

export default function ShopScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  // The wide-web front page brings its own background and layout.
  if (useIsWideWeb()) return <ShopHome navigation={navigation} />;

  return (
    <GradientBackground>
      <View style={styles.flex}>
        <View style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: gutter }}>
          <AppTopBar variant="full" />
        </View>
        <ShopHome navigation={navigation} topPadding={spacing.md} />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
