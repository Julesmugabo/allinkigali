/**
 * SellersContext.jsx — listings (both kinds) and applications for the
 * Sales Partners admin; `changed()` reloads after an edit.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { sellersApi } from './sellersApi';

const Ctx = createContext(null);

export function SellersProvider({ children }) {
  const [places, setPlaces] = useState([]);
  const [applications, setApplications] = useState([]);
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
    Promise.all([sellersApi.places(), sellersApi.applications()])
      .then(([p, a]) => { if (live) { setPlaces(p); setApplications(a); setError(''); } })
      .catch((e) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [version]);

  return <Ctx.Provider value={{ places, applications, loading, error, changed, toast, notify }}>{children}</Ctx.Provider>;
}

export const useSellers = () => useContext(Ctx);
