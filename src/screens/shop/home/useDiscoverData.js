/**
 * useDiscoverData.js — restaurants, coffee shops and wedding venues for the
 * Resto/Coffee front page. Uses the live lists, falling back to the built-in
 * examples (same as each market screen does) when the server has none.
 */
import { useEffect, useState } from 'react';
import { apiFetch } from '../../../services/apiClient';
import { RESTAURANTS } from '../../../data/restaurantData';
import { COFFEE_SHOPS } from '../../../data/coffeeShopData';
import { WEDDING_VENUES } from '../../../data/weddingVenueData';

const load = (path, fallback) => apiFetch(path)
  .then((d) => (Array.isArray(d) && d.length ? d : fallback))
  .catch(() => fallback);

export default function useDiscoverData() {
  const [data, setData] = useState({ restaurants: RESTAURANTS, coffeeShops: COFFEE_SHOPS, venues: WEDDING_VENUES, loading: true });
  useEffect(() => {
    let live = true;
    Promise.all([load('/restaurants', RESTAURANTS), load('/coffee-shops', COFFEE_SHOPS), load('/wedding-venues', WEDDING_VENUES)])
      .then(([restaurants, coffeeShops, venues]) => live && setData({ restaurants, coffeeShops, venues, loading: false }));
    return () => { live = false; };
  }, []);
  return data;
}

export const isOpen = (p) => /^open/i.test(p.openStatus || p.open_status || 'Open now');
export const coverOf = (p) => p.photos?.[0]?.url || p.photos?.[0] || null;
