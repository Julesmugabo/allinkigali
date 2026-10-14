/**
 * FoodCartContext.js — the Order Food cart. It can hold dishes from several
 * places at once, grouped by place; each place can be ticked in or out of
 * the next checkout (unticked places stay for later). Saved on the device
 * so it survives moving between pages, refreshing and logging in.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'allinkigali-food-cart';
const FoodCartContext = createContext(null);
export const placeKey = (placeType, placeId) => `${placeType}:${placeId}`;

export function FoodCartProvider({ children }) {
  const [places, setPlaces] = useState({}); // key → { key, placeId, placeType, name, deliveryFee, minOrder, selected, addedAt, items }
  const [lastAdded, setLastAdded] = useState(null); // { key, itemId, name, at } for the "added" message
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => { if (raw) setPlaces(JSON.parse(raw)); })
      .catch(() => {})
      .finally(() => { loaded.current = true; });
  }, []);
  useEffect(() => {
    if (loaded.current) AsyncStorage.setItem(KEY, JSON.stringify(places)).catch(() => {});
  }, [places]);

  const addItem = useCallback((supplier, dish, qty = 1, note = '') => {
    const key = placeKey(supplier.placeType, supplier.id);
    setPlaces((all) => {
      const group = all[key] || {
        key, placeId: supplier.id, placeType: supplier.placeType, name: supplier.name,
        deliveryFee: Number(supplier.deliveryFee || 0), minOrder: Number(supplier.minOrder || 0),
        selected: true, addedAt: Date.now(), items: {},
      };
      const prev = group.items[dish.id];
      const item = { id: dish.id, name: dish.name, price: Number(dish.price), photoUrl: dish.photoUrl || null,
        qty: Math.min((prev?.qty || 0) + qty, 99), note: note || prev?.note || '' };
      return { ...all, [key]: { ...group, selected: true, items: { ...group.items, [dish.id]: item } } };
    });
    setLastAdded({ key, itemId: dish.id, name: dish.name, qty, at: Date.now() });
  }, []);

  const setQty = useCallback((key, itemId, qty) => setPlaces((all) => {
    const group = all[key];
    if (!group) return all;
    const items = { ...group.items };
    if (qty > 0) items[itemId] = { ...items[itemId], qty: Math.min(qty, 99) }; else delete items[itemId];
    const next = { ...all };
    if (Object.keys(items).length) next[key] = { ...group, items }; else delete next[key];
    return next;
  }), []);

  const setNote = useCallback((key, itemId, note) => setPlaces((all) => (all[key]?.items[itemId]
    ? { ...all, [key]: { ...all[key], items: { ...all[key].items, [itemId]: { ...all[key].items[itemId], note } } } } : all)), []);
  const toggleSelected = useCallback((key) => setPlaces((all) => (all[key] ? { ...all, [key]: { ...all[key], selected: !all[key].selected } } : all)), []);
  const selectOnly = useCallback((key) => setPlaces((all) => Object.fromEntries(Object.entries(all).map(([k, g]) => [k, { ...g, selected: k === key }]))), []);
  const removePlaces = useCallback((keys) => setPlaces((all) => Object.fromEntries(Object.entries(all).filter(([k]) => !keys.includes(k)))), []);
  const clear = useCallback(() => setPlaces({}), []);
  // Server's current prices (after a "prices changed" answer) replace the saved ones.
  const applyQuote = useCallback((key, items) => setPlaces((all) => {
    if (!all[key]) return all;
    const next = { ...all[key].items };
    items.forEach((i) => { if (next[i.id]) next[i.id] = { ...next[i.id], price: i.price, name: i.name }; });
    return { ...all, [key]: { ...all[key], items: next } };
  }), []);

  const value = useMemo(() => {
    const groups = Object.values(places).sort((a, b) => a.addedAt - b.addedAt).map((g) => {
      const items = Object.values(g.items);
      return { ...g, itemList: items, subtotal: items.reduce((s, i) => s + i.price * i.qty, 0), count: items.reduce((s, i) => s + i.qty, 0) };
    });
    const qtyOf = (key, itemId) => places[key]?.items[itemId]?.qty || 0;
    const countFor = (key) => groups.find((g) => g.key === key)?.count || 0;
    return {
      groups, lastAdded, qtyOf, countFor,
      itemCount: groups.reduce((s, g) => s + g.count, 0),
      addItem, setQty, setNote, toggleSelected, selectOnly, removePlaces, clear, applyQuote,
    };
  }, [places, lastAdded, addItem, setQty, setNote, toggleSelected, selectOnly, removePlaces, clear, applyQuote]);

  return <FoodCartContext.Provider value={value}>{children}</FoodCartContext.Provider>;
}

export function useFoodCart() {
  const ctx = useContext(FoodCartContext);
  if (!ctx) throw new Error('useFoodCart must be used inside a FoodCartProvider');
  return ctx;
}
