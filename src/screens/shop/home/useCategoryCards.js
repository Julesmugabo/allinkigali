/**
 * useCategoryCards.js — the four Resto/Coffee doors (restaurants, coffee
 * shops, weddings, order food) with a photo and a live line each. Shared by
 * the website front page (four in a row) and the phone (two by two).
 */
import { useMemo } from 'react';
import useDiscoverData, { isOpen, coverOf } from './useDiscoverData';

// A card shows the first place in its list that has a photo.
const firstPhoto = (list) => coverOf(list.find((p) => coverOf(p)) || {});

export default function useCategoryCards(navigation) {
  const { restaurants, coffeeShops, venues } = useDiscoverData();
  return useMemo(() => {
    const delivering = [...restaurants, ...coffeeShops].filter((p) => p.deliveryEnabled);
    const quiet = coffeeShops.filter((c) => c.busyNow === 'quiet').length;
    return [
      { key: 'resto', label: 'Restaurants', icon: 'silverware-fork-knife', photo: firstPhoto(restaurants), stat: `${restaurants.length} places · ${restaurants.filter(isOpen).length} open now`, onPress: () => navigation.navigate('RestaurantMarket') },
      { key: 'coffee', label: 'Coffee Shops', icon: 'coffee-outline', photo: firstPhoto(coffeeShops), stat: quiet ? `${quiet} quiet right now` : `${coffeeShops.length} shops · ${coffeeShops.filter(isOpen).length} open now`, onPress: () => navigation.navigate('CoffeeShopMarket') },
      { key: 'wedding', label: 'Wedding Venues', icon: 'flower-outline', photo: firstPhoto(venues), stat: `${venues.length} venues · book a visit`, onPress: () => navigation.navigate('WeddingMarket') },
      { key: 'order', label: 'Order Food', icon: 'moped', photo: firstPhoto([...delivering].reverse()), stat: delivering.length ? `${delivering.length} places deliver to you` : 'Delivered to your door', onPress: () => navigation.navigate('OrderFood') },
    ];
  }, [restaurants, coffeeShops, venues, navigation]);
}
