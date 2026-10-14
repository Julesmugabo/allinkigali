/**
 * PlacesContext.jsx — the listings of one kind (restaurants or coffee
 * shops) plus their bookings, refreshed after any change via `changed()`.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { placesApi } from './placesApi';

const Ctx = createContext(null);

export function PlacesProvider({ type, children }) {
  const [places, setPlaces] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const changed = useCallback(() => setVersion((v) => v + 1), []);
  const [toast, setToast] = useState(null);
  const notify = useCallback((text) => {
    const id = Date.now();
    setToast({ text, id });
    setTimeout(() => setToast((c) => (c?.id === id ? null : c)), 3000);
  }, []);

  useEffect(() => {
    let live = true;
    Promise.all([placesApi.list(), placesApi.bookings(type).catch(() => [])])
      .then(([all, b]) => {
        if (!live) return;
        setPlaces(all.filter((p) => p.type === type.key));
        setBookings(b);
        setError('');
      })
      .catch((e) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [type, version]);

  return <Ctx.Provider value={{ type, places, bookings, loading, error, changed, toast, notify }}>{children}</Ctx.Provider>;
}

export const usePlaces = () => useContext(Ctx);
