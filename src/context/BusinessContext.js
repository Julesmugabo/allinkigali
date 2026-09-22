/**
 * BusinessContext.js — Ububiko bw'ubucuruzi (the business "database").
 *
 * Talks to our own Express + Postgres backend (server/src/routes/businesses.js)
 * now, not in-memory state — every screen still only ever calls
 * useBusinesses(), nothing outside this file needed to change.
 *
 * Verified is a trust badge, not a search gate (an established product
 * decision) — the server returns every business regardless of status,
 * same as the in-memory version always did.
 */
import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../services/apiClient';

const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const [businesses, setBusinesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBusinesses = useCallback(async () => {
    try {
      const data = await apiFetch('/businesses');
      setBusinesses(data || []);
    } catch {
      // Leave whatever was already loaded rather than blanking the list
      // over a transient network hiccup.
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshBusinesses();
      setIsLoading(false);
    })();
  }, [refreshBusinesses]);

  const addBusiness = useCallback(async (business) => {
    try {
      const newBusiness = await apiFetch('/businesses', { method: 'POST', body: business });
      setBusinesses((current) => [newBusiness, ...current]);
      return newBusiness;
    } catch {
      return null;
    }
  }, []);

  // Counted only from a genuine customer tapping "view details" on a search
  // result (see ServicesPanel.js) — never from a seller previewing their own
  // listing or an admin browsing it, so this stays an honest reach metric.
  const incrementBusinessView = useCallback(async (id) => {
    try {
      await apiFetch(`/businesses/${id}/view`, { method: 'POST' });
      setBusinesses((current) => current.map((b) => (b.id === id ? { ...b, views: (b.views || 0) + 1 } : b)));
    } catch {
      // a missed view count isn't worth surfacing an error for
    }
  }, []);

  const updateBusiness = useCallback(async (id, patch) => {
    try {
      const updated = await apiFetch(`/businesses/${id}`, { method: 'PATCH', body: patch });
      setBusinesses((current) => current.map((b) => (b.id === id ? updated : b)));
      return updated;
    } catch {
      return null;
    }
  }, []);

  // Verified is a trust badge, not a search gate — a new business is already
  // discoverable the moment it registers (that's the point of self-serve
  // sign-up), approving it here just adds the checkmark customers see.
  const approveBusiness = useCallback(async (id) => {
    try {
      const updated = await apiFetch(`/businesses/${id}/approve`, { method: 'POST' });
      setBusinesses((current) => current.map((b) => (b.id === id ? updated : b)));
    } catch {
      // no-op
    }
  }, []);

  // Only meant for the pending-approval queue — rejecting something that
  // was never live yet is a different, lower-stakes action than deleting an
  // established listing with real bookings against it.
  const deleteBusiness = useCallback(async (id) => {
    try {
      await apiFetch(`/businesses/${id}`, { method: 'DELETE' });
      setBusinesses((current) => current.filter((b) => b.id !== id));
    } catch {
      // no-op — business stays in the list, matching the pre-fix state
    }
  }, []);

  const getBusinessById = useCallback(
    (id) => businesses.find((b) => b.id === id) || null,
    [businesses]
  );

  const getBusinessesByOwner = useCallback(
    (ownerId) => (ownerId ? businesses.filter((b) => b.ownerId === ownerId) : []),
    [businesses]
  );

  const value = useMemo(
    () => ({
      businesses,
      isLoading,
      refreshBusinesses,
      addBusiness,
      updateBusiness,
      approveBusiness,
      deleteBusiness,
      incrementBusinessView,
      getBusinessById,
      getBusinessesByOwner,
    }),
    [
      businesses,
      isLoading,
      refreshBusinesses,
      addBusiness,
      updateBusiness,
      approveBusiness,
      deleteBusiness,
      incrementBusinessView,
      getBusinessById,
      getBusinessesByOwner,
    ]
  );

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusinesses() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusinesses must be used inside <BusinessProvider>.');
  }
  return context;
}

export default BusinessContext;
