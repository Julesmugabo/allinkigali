/**
 * PropertyContext.js — Inzu zamacye / House for Sale listings, backed by the
 * real API. Falls back to seed data on network failure.
 */
import React, {
  createContext, useContext, useState, useCallback, useEffect, useMemo,
} from 'react';
import { apiFetch } from '../services/apiClient';
import { SEED_PROPERTIES } from '../data/propertyListings';

const PropertyContext = createContext(null);

export function PropertyProvider({ children }) {
  const [properties,  setProperties]  = useState(SEED_PROPERTIES);
  const [isLoading,   setIsLoading]   = useState(true);
  const [loadFailed,  setLoadFailed]  = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadFailed(false);
    try {
      const data = await apiFetch('/properties');
      if (data && data.length > 0) setProperties(data);
    } catch {
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getPropertyById = useCallback(
    (id) => properties.find((p) => p.id === id) || null,
    [properties],
  );

  // Owner self-listing — POSTs to /properties then refreshes
  const addProperty = useCallback(async (data) => {
    const created = await apiFetch('/properties', { method: 'POST', body: data });
    await load();
    return created;
  }, [load]);

  // Admin mutations
  const pinProperty = useCallback(async (id) => {
    await apiFetch(`/properties/${id}/pin`, { method: 'PATCH' });
    await load();
  }, [load]);

  const toggleStatus = useCallback(async (id) => {
    await apiFetch(`/properties/${id}/status`, { method: 'PATCH' });
    await load();
  }, [load]);

  const removeProperty = useCallback(async (id) => {
    await apiFetch(`/properties/${id}`, { method: 'DELETE' });
    setProperties((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updatePropertyPhotos = useCallback(async (id, photos) => {
    const updated = await apiFetch(`/properties/${id}/photos`, { method: 'PATCH', body: { photos } });
    setProperties((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }, []);

  const value = useMemo(() => ({
    properties, isLoading, loadFailed,
    reload: load,
    getPropertyById,
    addProperty,
    pinProperty, toggleStatus, removeProperty, updatePropertyPhotos,
  }), [properties, isLoading, loadFailed, load, getPropertyById, addProperty, pinProperty, toggleStatus, removeProperty, updatePropertyPhotos]);

  return <PropertyContext.Provider value={value}>{children}</PropertyContext.Provider>;
}

export function useProperties() {
  const ctx = useContext(PropertyContext);
  if (!ctx) throw new Error('useProperties must be used inside <PropertyProvider>.');
  return ctx;
}

export default PropertyContext;
