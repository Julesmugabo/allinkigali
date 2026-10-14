/**
 * useSavedPlaces.js — the ♡ on place cards and pages. Saved places live on
 * this device only (AsyncStorage, which is browser storage on web); every
 * screen using the hook sees the same list and updates together.
 */
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'allinkigali-saved-places';
let saved = null; // Set of "kind:id", loaded once
const listeners = new Set();

const load = async () => {
  if (saved) return saved;
  try { saved = new Set(JSON.parse((await AsyncStorage.getItem(KEY)) || '[]')); } catch { saved = new Set(); }
  return saved;
};

export default function useSavedPlaces() {
  const [, bump] = useState(0);
  useEffect(() => {
    const rerender = () => bump((n) => n + 1);
    listeners.add(rerender);
    load().then(rerender);
    return () => listeners.delete(rerender);
  }, []);

  const isSaved = useCallback((kind, id) => !!saved?.has(`${kind}:${id}`), []);
  const toggle = useCallback(async (kind, id) => {
    const set = await load();
    const k = `${kind}:${id}`;
    if (set.has(k)) set.delete(k); else set.add(k);
    listeners.forEach((fn) => fn());
    AsyncStorage.setItem(KEY, JSON.stringify([...set])).catch(() => {});
  }, []);

  return { isSaved, toggle };
}
