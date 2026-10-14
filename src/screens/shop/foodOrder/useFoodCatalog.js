/**
 * useFoodCatalog.js — everything the Order Food pages read: the places that
 * deliver (restaurants and coffee shops), every available dish grouped by
 * place, and the food chips ranked by what's on the menus and ordered most.
 * The catalogue is fetched once per visit and shared by every page.
 */
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../../services/apiClient';
import useDiscoverData from '../home/useDiscoverData';
import KINDS from '../browse/kinds';
import { placeKey } from '../../../context/FoodCartContext';
import { FOODS, matchesFood } from './foodKeywords';

let cache = null; // the catalogue request, shared by all pages of one visit
const loadCatalog = () => {
  if (!cache) cache = apiFetch('/food-orders/catalog').catch(() => { cache = null; return []; });
  return cache;
};

export default function useFoodCatalog() {
  const { restaurants, coffeeShops, loading } = useDiscoverData();
  const [dishes, setDishes] = useState(null);
  useEffect(() => { let live = true; loadCatalog().then((d) => live && setDishes(Array.isArray(d) ? d : [])); return () => { live = false; }; }, []);

  return useMemo(() => {
    const suppliers = [
      ...restaurants.filter((p) => p.deliveryEnabled).map((p) => ({ ...p, placeType: 'restaurant', kind: KINDS.resto })),
      ...coffeeShops.filter((p) => p.deliveryEnabled).map((p) => ({ ...p, placeType: 'coffeeshop', kind: KINDS.coffee })),
    ].map((p) => ({ ...p, key: placeKey(p.placeType, p.id) }));

    const menus = new Map(); // supplier key → dishes, in the owner's order
    (dishes || []).forEach((d) => {
      const k = placeKey(d.placeType, d.placeId);
      if (!menus.has(k)) menus.set(k, []);
      menus.get(k).push(d);
    });
    menus.forEach((list) => list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));

    // Chips: foods found on menus, weighted by how often they're ordered.
    const foods = FOODS.map((f) => {
      const hits = (dishes || []).filter((d) => matchesFood(d, f));
      return { ...f, score: hits.length + hits.reduce((s, d) => s + d.orders * 3, 0) };
    }).filter((f) => f.score > 0).sort((a, b) => b.score - a.score).slice(0, 10);

    return {
      loading: loading || dishes === null,
      suppliers,
      bySupplierKey: new Map(suppliers.map((s) => [s.key, s])),
      menuOf: (key) => menus.get(key) || [],
      foods,
    };
  }, [restaurants, coffeeShops, loading, dishes]);
}

export const minutesOf = (p) => parseInt(String(p.estimatedTime || '99'), 10) || 99;
export const isSupplierOpen = (p) => /^open/i.test(p.openStatus || 'Open now');
