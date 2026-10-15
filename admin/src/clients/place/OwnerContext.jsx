/**
 * OwnerContext.jsx — the signed-in place's data for the client dashboard:
 * profile, bookings, menu, orders, reviews. `changed()` reloads after any edit.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { makeOwnerApi } from './ownerApi';

const Ctx = createContext(null);

export function OwnerProvider({ kind, base, children }) {
  const api = useMemo(() => makeOwnerApi(), []);
  const [data, setData] = useState({ profile: null, bookings: [], menu: [], orders: [], reviews: [] });
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
    const safe = (p) => p.catch(() => []);
    Promise.all([api.profile(), safe(api.bookings()), safe(api.menu()), safe(api.orders()), safe(api.reviews())])
      .then(([profile, bookings, menu, orders, reviews]) => { if (live) { setData({ profile, bookings, menu, orders, reviews }); setError(''); } })
      .catch((e) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [api, version]);

  const value = { ...data, api, kind, base, isCafe: kind === 'coffeeshop', loading, error, changed, toast, notify };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useOwner = () => useContext(Ctx);
