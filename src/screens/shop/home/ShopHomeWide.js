/**
 * ShopHomeWide.js — the Resto/Coffee front page on a wide browser: just the
 * four doors (restaurants, coffee shops, weddings, order food), each with a
 * photo and a live line. Clicking one opens that category's list page.
 * Phones and the native app keep ServicesPanel (see ShopHome.web.js).
 */
import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import GradientBackground from '../../../components/common/GradientBackground';
import WebContainer from '../../../web/layout/WebContainer';
import CategoryCards from '../../../components/shop/discover/CategoryCards';
import { colors, spacing } from '../../../theme';
import useDiscoverData, { isOpen, coverOf } from './useDiscoverData';

// A card shows the first place in its list that has a photo.
const firstPhoto = (list) => coverOf(list.find((p) => coverOf(p)) || {});

export default function ShopHomeWide({ navigation }) {
  const { restaurants, coffeeShops, venues } = useDiscoverData();

  const cards = useMemo(() => {
    const delivering = [...restaurants, ...coffeeShops].filter((p) => p.deliveryEnabled);
    const quiet = coffeeShops.filter((c) => c.busyNow === 'quiet').length;
    return [
      { key: 'resto', label: 'Restaurants', icon: 'silverware-fork-knife', photo: firstPhoto(restaurants), stat: `${restaurants.length} places · ${restaurants.filter(isOpen).length} open now`, onPress: () => navigation.navigate('RestaurantMarket') },
      { key: 'coffee', label: 'Coffee Shops', icon: 'coffee-outline', photo: firstPhoto(coffeeShops), stat: quiet ? `${quiet} quiet right now` : `${coffeeShops.length} shops · ${coffeeShops.filter(isOpen).length} open now`, onPress: () => navigation.navigate('CoffeeShopMarket') },
      { key: 'wedding', label: 'Wedding Venues', icon: 'flower-outline', photo: firstPhoto(venues), stat: `${venues.length} venues · book a visit`, onPress: () => navigation.navigate('WeddingMarket') },
      { key: 'order', label: 'Order Food', icon: 'moped', photo: firstPhoto([...delivering].reverse()), stat: delivering.length ? `${delivering.length} places deliver to you` : 'Delivered to your door', onPress: () => navigation.navigate('OrderFood') },
    ];
  }, [restaurants, coffeeShops, venues, navigation]);

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
