/**
 * useTab.js — the table's running tab (every phone's orders and their
 * status), kept fresh: every 5 seconds while an order is on its way, every
 * 15 seconds otherwise, and right away when the guest comes back to the page.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { tableApi } from './api';

const ACTIVE = ['needs_confirm', 'placed', 'accepted', 'preparing', 'ready'];

export default function useTab(token, initial) {
  const [tab, setTab] = useState(initial);
  const busy = useRef(false);
  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try { const d = await tableApi.tab(token); setTab(d.tab); } catch { /* next round */ }
    busy.current = false;
  }, [token]);

  const fast = !!tab?.orders.some((o) => ACTIVE.includes(o.status));
  useEffect(() => {
    const id = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, fast ? 5000 : 15000);
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [refresh, fast]);

  return [tab, setTab];
}
