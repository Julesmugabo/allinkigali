/**
 * PropertyContext.js — Inzu zamacye / House for Sale listings.
 *
 * Front-end-only for now (per explicit instruction — build the browsing
 * experience first, wire a real backend later): starts from the seed mock
 * data and keeps anything a seller "registers" in memory for the rest of the
 * session, the same pattern CartContext uses. Nothing here is persisted or
 * sent to a server yet.
 */
import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { SEED_PROPERTIES } from '../data/propertyListings';

const PropertyContext = createContext(null);

export function PropertyProvider({ children }) {
  const [properties, setProperties] = useState(SEED_PROPERTIES);

  const addProperty = useCallback((data) => {
    const newProperty = {
      id: `rt-${Date.now()}`,
      listingType: 'rent',
      features: [],
      createdAt: new Date().toISOString(),
      ...data,
    };
    setProperties((current) => [newProperty, ...current]);
    return newProperty;
  }, []);

  const getPropertyById = useCallback((id) => properties.find((p) => p.id === id) || null, [properties]);

  const value = useMemo(
    () => ({ properties, addProperty, getPropertyById }),
    [properties, addProperty, getPropertyById]
  );

  return <PropertyContext.Provider value={value}>{children}</PropertyContext.Provider>;
}

export function useProperties() {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperties must be used inside <PropertyProvider>.');
  }
  return context;
}

export default PropertyContext;
