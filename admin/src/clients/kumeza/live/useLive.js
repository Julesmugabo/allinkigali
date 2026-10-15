/**
 * useLive.js — keeps a Ku Meza screen current.
 *
 * Opens the live stream (Server-Sent Events). An event only says "something
 * changed here" (and what, for the sound and the banner), so the screen then
 * fetches the latest state from the server — after a dropped connection it
 * simply reloads, and an order is never lost or shown twice.
 * While the stream is down it reconnects with a fresh ticket and polls every
 * 5 seconds; while it's up, a quiet 20-second check is the safety net.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUrl } from '../../../api';
import { kumezaApi } from '../kumezaApi';

export default function useLive(fetcher, onEvent) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [live, setLive] = useState(false);
  const fetchRef = useRef(fetcher);
  const eventRef = useRef(onEvent);
  fetchRef.current = fetcher;
  eventRef.current = onEvent;
  const liveRef = useRef(false);
  const lastLoad = useRef(0);

  const reload = useCallback(() => {
    lastLoad.current = Date.now();
    return fetchRef.current()
      .then((d) => { setData(d); setError(''); })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    let es = null;
    let stopped = false;
    let retry = null;
    let soon = null;
    const setUp = (v) => { liveRef.current = v; setLive(v); };
    // Several events in a burst → one reload.
    const reloadSoon = () => { if (!soon) soon = setTimeout(() => { soon = null; reload(); }, 250); };

    const connect = async () => {
      try {
        const { ticket } = await kumezaApi.streamTicket();
        if (stopped) return;
        es = new EventSource(apiUrl(`/clients/kumeza/stream?ticket=${encodeURIComponent(ticket)}`));
        es.addEventListener('ready', () => { setUp(true); reloadSoon(); });
        es.addEventListener('change', (e) => {
          reloadSoon();
          try { eventRef.current?.(JSON.parse(e.data)); } catch { /* not for us */ }
        });
        es.onerror = () => {
          setUp(false);
          es.close();
          if (!stopped) retry = setTimeout(connect, 4000);
        };
      } catch {
        setUp(false);
        if (!stopped) retry = setTimeout(connect, 8000);
      }
    };

    reload();
    connect();
    const poll = setInterval(() => {
      if (!liveRef.current || Date.now() - lastLoad.current > 20000) reload();
    }, 5000);
    const onVisible = () => { if (document.visibilityState === 'visible') reload(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      es?.close();
      clearTimeout(retry);
      clearTimeout(soon);
      clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [reload]);

  return { data, error, live, reload };
}
