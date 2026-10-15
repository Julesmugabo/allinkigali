/**
 * useNow.js — the current time, refreshed every `ms` (for "12 min ago").
 */
import { useEffect, useState } from 'react';

export default function useNow(ms = 30000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}
