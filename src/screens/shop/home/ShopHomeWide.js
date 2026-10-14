/**
 * ShopHomeWide.js — the Resto/Coffee front page on a wide browser: a search
 * across every place, the four doors (restaurants, coffee, weddings, order
 * food) with live numbers, the shop fliers, then ready-made rows. Phones and
 * the native app keep ServicesPanel (see ShopHome.web.js).
 */
import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import GradientBackground from '../../../components/common/GradientBackground';
import WebContainer from '../../../web/layout/WebContainer';
import FlierCarousel from '../../../components/shop/FlierCarousel';
import CategoryCards from '../../../components/shop/discover/CategoryCards';
import DiscoverSearch from '../../../components/shop/discover/DiscoverSearch';
import PlaceRow from '../../../components/shop/discover/PlaceRow';
import { useBusinesses } from '../../../context/BusinessContext';
import { useFliers } from '../../../context/FliersContext';
import { colors, spacing } from '../../../theme';
import useDiscoverData, { isOpen, coverOf } from './useDiscoverData';

const DETAIL = { resto: 'RestaurantDetail', coffee: 'CoffeeShopDetail', wedding: 'WeddingDetail' };
const tag = (kind) => (place) => ({ place, kind });
const byRating = (a, b) => (b.place.rating || 0) - (a.place.rating || 0);
const has = (list, any) => (list || []).some((x) => any.includes(x));
// A category card shows the first place in its list that has a photo.
const firstPhoto = (list) => coverOf(list.find((p) => coverOf(p)) || {});

export default function ShopHomeWide({ navigation }) {
  const { restaurants, coffeeShops, venues } = useDiscoverData();
  const { businesses, incrementBusinessView } = useBusinesses();
  const { fliers } = useFliers();

  const open = useCallback((place, kind) => navigation.navigate(DETAIL[kind], { id: place.id }), [navigation]);
  const openFlier = useCallback((flier) => {
    const b = businesses.find((x) => x.id === flier.businessId);
    if (b) { incrementBusinessView(b.id); navigation.navigate('BusinessDetail', { businessId: b.id }); }
  }, [businesses, incrementBusinessView, navigation]);

  const v = useMemo(() => {
    const R = restaurants.map(tag('resto'));
    const C = coffeeShops.map(tag('coffee'));
    const W = venues.map(tag('wedding'));
    const delivering = restaurants.filter((r) => r.deliveryEnabled);
    return {
      all: [...R, ...C, ...W],
      cards: [
        { key: 'resto', label: 'Restaurants', icon: 'silverware-fork-knife', photo: firstPhoto(restaurants), stat: `${restaurants.length} places · ${restaurants.filter(isOpen).length} open now`, onPress: () => navigation.navigate('RestaurantMarket') },
        { key: 'coffee', label: 'Coffee Shops', icon: 'coffee-outline', photo: firstPhoto(coffeeShops), stat: coffeeShops.some((c) => c.busyNow === 'quiet') ? `${coffeeShops.filter((c) => c.busyNow === 'quiet').length} quiet right now` : `${coffeeShops.length} shops · ${coffeeShops.filter(isOpen).length} open now`, onPress: () => navigation.navigate('CoffeeShopMarket') },
        { key: 'wedding', label: 'Wedding Venues', icon: 'flower-outline', photo: firstPhoto(venues), stat: `${venues.length} venues · book a visit`, onPress: () => navigation.navigate('WeddingMarket') },
        { key: 'order', label: 'Order Food', icon: 'moped', photo: firstPhoto([...delivering].reverse()) || firstPhoto([...restaurants].reverse()), stat: delivering.length ? `${delivering.length} places deliver to you` : 'Delivered to your door', onPress: () => navigation.navigate('OrderFood') },
      ],
      openNow: [...R, ...C].filter((x) => isOpen(x.place)).sort(byRating).slice(0, 12),
      work: C.filter((x) => has(x.place.attributes, ['wifi', 'laptopfriendly', 'workarea', 'poweroutlets'])).sort(byRating).slice(0, 12),
      date: [...R.filter((x) => has(x.place.occasion, ['romantic'])), ...C.filter((x) => has(x.place.attributes, ['romantic', 'cozy']))].sort(byRating).slice(0, 12),
      topRated: [...R, ...C].sort(byRating).slice(0, 12),
      venues: [...W].sort(byRating).slice(0, 12),
    };
  }, [restaurants, coffeeShops, venues, navigation]);

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <WebContainer>
          <Text style={styles.title}>Where to eat, drink or celebrate in Kigali</Text>
          <DiscoverSearch entries={v.all} onPick={open} />
          <View style={styles.cards}><CategoryCards cards={v.cards} /></View>
          {fliers.length > 0 && (
            <View style={styles.fliers}><FlierCarousel fliers={fliers} businesses={businesses} onPressFlier={openFlier} /></View>
          )}
          <PlaceRow title="Open right now" items={v.openNow} onPressItem={open} />
          <PlaceRow title="☕ Coffee to work from" items={v.work} onPressItem={open} onSeeAll={() => navigation.navigate('CoffeeShopMarket')} />
          <PlaceRow title="❤️ Good for a date" items={v.date} onPressItem={open} />
          <PlaceRow title="⭐ Top rated" items={v.topRated} onPressItem={open} />
          <PlaceRow title="💍 Wedding venues" items={v.venues} onPressItem={open} onSeeAll={() => navigation.navigate('WeddingMarket')} />
        </WebContainer>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: spacing.xxl, paddingBottom: spacing.huge },
  title: { color: colors.white, fontSize: 30, fontWeight: '800', textAlign: 'center', marginBottom: spacing.lg },
  cards: { marginTop: spacing.xxl, zIndex: 1 },
  fliers: { marginTop: spacing.xxl },
});
