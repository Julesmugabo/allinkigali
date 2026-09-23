/**
 * FliersContext.js — Amafliyeri agaragara hejuru y'iduka (Shop tab ad carousel).
 *
 * Talks to our own Express + Postgres backend now (server/src/routes/fliers.js),
 * not in-memory state — every screen still only ever calls useFliers().
 *
 * Same shape as AdsContext (News tab), kept as its own file since a flier is
 * a different concept anchored to a different thing: every flier promotes
 * one specific business (`businessId`), picked by the Sales Partners admin
 * from the real seller directory — not a free-text advertiser.
 */
import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../services/apiClient';

const FliersContext = createContext(null);

export function FliersProvider({ children }) {
  const [fliers, setFliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshFliers = useCallback(async () => {
    try {
      const data = await apiFetch('/fliers');
      setFliers(data || []);
    } catch {
      // Leave whatever was already loaded rather than blanking the list
      // over a transient network hiccup.
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshFliers();
      setIsLoading(false);
    })();
  }, [refreshFliers]);

  const addFlier = useCallback(async (data) => {
    try {
      const newFlier = await apiFetch('/fliers', {
        method: 'POST',
        body: { imageUri: data.imageUri, businessId: data.businessId },
      });
      setFliers((current) => [newFlier, ...current]);
      return newFlier;
    } catch {
      return null;
    }
  }, []);

  const updateFlier = useCallback(async (id, patch) => {
    try {
      const updated = await apiFetch(`/fliers/${id}`, { method: 'PATCH', body: patch });
      setFliers((current) => current.map((f) => (f.id === id ? updated : f)));
      return updated;
    } catch {
      return null;
    }
  }, []);

  const deleteFlier = useCallback(async (id) => {
    try {
      await apiFetch(`/fliers/${id}`, { method: 'DELETE' });
      setFliers((current) => current.filter((f) => f.id !== id));
    } catch {
      // no-op — the flier stays in the list, matching a failed delete
      // leaving state untouched rather than silently disappearing
    }
  }, []);

  const getFlierById = useCallback((id) => fliers.find((f) => f.id === id) || null, [fliers]);

  const value = useMemo(
    () => ({ fliers, isLoading, refreshFliers, addFlier, updateFlier, deleteFlier, getFlierById }),
    [fliers, isLoading, refreshFliers, addFlier, updateFlier, deleteFlier, getFlierById]
  );

  return <FliersContext.Provider value={value}>{children}</FliersContext.Provider>;
}

export function useFliers() {
  const context = useContext(FliersContext);
  if (!context) {
    throw new Error('useFliers must be used inside <FliersProvider>.');
  }
  return context;
}

export default FliersContext;
