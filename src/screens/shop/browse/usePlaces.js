/**
 * usePlaces.js — loads one category's places from the server, falling back
 * to the built-in examples when the server has none (as the phone screens do).
 */
import { useEffect, useState } from 'react';
import { apiFetch } from '../../../services/apiClient';

export default function usePlaces(kind) {
  const [state, setState] = useState({ places: kind.fallback, loading: true });
  useEffect(() => {
    let live = true;
    apiFetch(kind.path)
      .then((d) => (Array.isArray(d) && d.length ? d : kind.fallback))
      .catch(() => kind.fallback)
      .then((places) => live && setState({ places, loading: false }));
    return () => { live = false; };
  }, [kind]);
  return state;
}
