/**
 * LandContext.js — Ibibanza (land plot) listings, backed by the real API.
 * Replaces direct reads of the static LAND_LISTINGS array.
 * Falls back to the seed data from landListings.js on network failure so the
 * screen is never completely empty for a user with no connectivity.
 */
import React, {
  createContext, useContext, useState, useCallback, useEffect, useMemo,
} from 'react';
import { apiFetch } from '../services/apiClient';
import { LAND_LISTINGS } from '../data/landListings';

const LandContext = createContext(null);

export function LandProvider({ children }) {
  const [listings,   setListings]   = useState(LAND_LISTINGS); // seed while loading
  const [isLoading,  setIsLoading]  = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadFailed(false);
    try {
      const data = await apiFetch('/land');
      // If the DB is empty (fresh deploy, no listings yet) keep the seed data
      // so the screen isn't blank — real listings will replace it as they're added.
      if (data && data.length > 0) setListings(data);
    } catch {
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getLandById = useCallback(
    (id) => listings.find((l) => l.id === id) || null,
    [listings],
  );

  // Admin mutations — each calls the API then refreshes the list
  const pinLand = useCallback(async (id) => {
    await apiFetch(`/land/${id}/pin`, { method: 'PATCH' });
    await load();
  }, [load]);

  const markSold = useCallback(async (id) => {
    await apiFetch(`/land/${id}/sold`, { method: 'PATCH' });
    await load();
  }, [load]);

  const addLand = useCallback(async (data) => {
    const created = await apiFetch('/land', { method: 'POST', body: data });
    await load();
    return created;
  }, [load]);

  const removeLand = useCallback(async (id) => {
    await apiFetch(`/land/${id}`, { method: 'DELETE' });
    setListings((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const updateLandPhotos = useCallback(async (id, photos) => {
    const updated = await apiFetch(`/land/${id}/photos`, { method: 'PATCH', body: { photos } });
    setListings((prev) => prev.map((l) => (l.id === id ? updated : l)));
  }, []);

  const value = useMemo(() => ({
    listings, isLoading, loadFailed,
    reload: load,
    getLandById,
    addLand, pinLand, markSold, removeLand, updateLandPhotos,
  }), [listings, isLoading, loadFailed, load, getLandById, addLand, pinLand, markSold, removeLand, updateLandPhotos]);

  return <LandContext.Provider value={value}>{children}</LandContext.Provider>;
}

export function useLand() {
  const ctx = useContext(LandContext);
  if (!ctx) throw new Error('useLand must be used inside <LandProvider>.');
  return ctx;
}
