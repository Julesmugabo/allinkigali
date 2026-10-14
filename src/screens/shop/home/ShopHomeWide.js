/**
 * ShopHomeWide.js — the Resto/Coffee front page on a wide browser: just the
 * four doors (restaurants, coffee shops, weddings, order food), each with a
 * photo and a live line. Clicking one opens that category's list page.
 * Phones and the native app keep ServicesPanel (see ShopHome.web.js).
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import GradientBackground from '../../../components/common/GradientBackground';
import WebContainer from '../../../web/layout/WebContainer';
import CategoryCards from '../../../components/shop/discover/CategoryCards';
import { colors, spacing } from '../../../theme';
import useCategoryCards from './useCategoryCards';

export default function ShopHomeWide({ navigation }) {
  const cards = useCategoryCards(navigation);

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <WebContainer>
          <Text style={styles.title}>Where to eat, drink or celebrate in Kigali</Text>
          <Text style={styles.subtitle}>Choose what you're looking for</Text>
          <View style={styles.cards}><CategoryCards cards={cards} /></View>
        </WebContainer>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: spacing.huge * 1.5, paddingBottom: spacing.huge },
  title: { color: colors.white, fontSize: 32, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: colors.textOnNavyFaint, fontSize: 16, textAlign: 'center', marginTop: spacing.sm },
  cards: { marginTop: spacing.huge },
});
