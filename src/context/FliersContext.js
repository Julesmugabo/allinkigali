/**
 * FliersContext.js — Amafliyeri agaragara hejuru y'iduka (Shop tab ad carousel).
 *
 * Same shape as AdsContext (News tab), kept as its own file since a flier is
 * a different concept anchored to a different thing: every flier promotes
 * one specific business (`businessId`), picked by the Sales Partners admin
 * from the real seller directory — not a free-text advertiser.
 */
import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

const FliersContext = createContext(null);

export function FliersProvider({ children }) {
  const [fliers, setFliers] = useState([]);

  const addFlier = useCallback((data) => {
    const newFlier = {
      id: `flier-${Date.now()}`,
      imageUri: null,
      businessId: null,
      createdAt: new Date().toISOString(),
      ...data,
    };
    setFliers((current) => [newFlier, ...current]);
    return newFlier;
  }, []);

  const updateFlier = useCallback((id, patch) => {
    setFliers((current) => current.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);

  const deleteFlier = useCallback((id) => {
    setFliers((current) => current.filter((f) => f.id !== id));
  }, []);

  const getFlierById = useCallback((id) => fliers.find((f) => f.id === id) || null, [fliers]);

  const value = useMemo(
    () => ({ fliers, addFlier, updateFlier, deleteFlier, getFlierById }),
    [fliers, addFlier, updateFlier, deleteFlier, getFlierById]
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
