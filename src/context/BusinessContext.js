/**
 * BusinessContext.js — Ububiko bw'ubucuruzi (the business "database").
 *
 * Stands in for the real database: holds the business list in memory,
 * seeded from mockBusinesses, plus addBusiness()/updateBusiness() for the
 * sales-partner registration/edit forms. `ownerId` links a business back to
 * the user who registered it, which is what makes the seller dashboard
 * possible — getBusinessesByOwner() is how it finds "your" business(es).
 * When the real backend arrives, only this file changes — every screen that
 * calls useBusinesses() keeps working unchanged.
 */
import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { businesses as seedBusinesses } from '../data/mockBusinesses';

const BusinessContext = createContext(null);

// The seed catalogue predates `isAvailableNow` (added for the seller
// dashboard's "closed right now" toggle) and `ownerId` (added for owner
// linkage) — without this, every seed business reads as unavailable/unowned
// by default, which visibly contradicts their own `openLabel`. Applying the
// same defaults addBusiness() gives a new registration keeps seed data and
// freshly-registered businesses consistent with each other.
function withDefaults(business) {
  return { isAvailableNow: true, ownerId: null, views: 0, ...business };
}

export function BusinessProvider({ children }) {
  const [businesses, setBusinesses] = useState(() => seedBusinesses.map(withDefaults));

  const addBusiness = useCallback((business) => {
    const newBusiness = {
      id: `biz-${Date.now()}`,
      verified: false,
      rating: null,
      reviewCount: 0,
      image: null,
      isAvailableNow: true,
      ownerId: null,
      views: 0,
      ...business,
    };
    setBusinesses((current) => [newBusiness, ...current]);
    return newBusiness;
  }, []);

  // Counted only from a genuine customer tapping "view details" on a search
  // result (see ServicesPanel.js) — never from a seller previewing their own
  // listing or an admin browsing it, so this stays an honest reach metric.
  const incrementBusinessView = useCallback((id) => {
    setBusinesses((current) => current.map((b) => (b.id === id ? { ...b, views: (b.views || 0) + 1 } : b)));
  }, []);

  const updateBusiness = useCallback((id, patch) => {
    setBusinesses((current) => current.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }, []);

  // Verified is a trust badge, not a search gate — a new business is already
  // discoverable the moment it registers (that's the point of self-serve
  // sign-up), approving it here just adds the checkmark customers see.
  const approveBusiness = useCallback((id) => {
    setBusinesses((current) => current.map((b) => (b.id === id ? { ...b, verified: true } : b)));
  }, []);

  // Only meant for the pending-approval queue — rejecting something that
  // was never live yet is a different, lower-stakes action than deleting an
  // established listing with real bookings against it.
  const deleteBusiness = useCallback((id) => {
    setBusinesses((current) => current.filter((b) => b.id !== id));
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
