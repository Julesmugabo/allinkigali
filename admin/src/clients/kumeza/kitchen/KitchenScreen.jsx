/**
 * KitchenScreen.jsx — Ku Meza › Kitchen screen: tickets in arrival order,
 * each exactly once and tied to its table, live. A screen can show the whole
 * queue or only the kitchen's or the bar's dishes (remembered on this
 * device); each station presses Ready for its own part and the waiter is
 * called when the whole order is ready. New tickets ring after "Start shift".
 * Orders a waiter hasn't confirmed yet never reach this screen.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { t } from '../../../theme';
import { PageHeader } from '../../../components/PageShell';
import { ErrorText, Loading } from '../../../components/ui';
import useNow from '../../common/useNow';
import Flash, { useFlash } from '../../common/Flash';
import { kumezaApi } from '../kumezaApi';
import useLive from '../live/useLive';
import ShiftBar, { Chip } from '../live/ShiftBar';
import AlertBanner, { useAlert } from '../live/AlertBanner';
import Ticket from './Ticket';

const STATIONS = [['all', 'Everything'], ['kitchen', 'Kitchen'], ['bar', 'Bar']];
const STATION_KEY = 'kumeza-station';
const savedStation = () => { try { return localStorage.getItem(STATION_KEY) || 'all'; } catch { return 'all'; } };

const hasItemsFor = (o, station) => station === 'all' || o.items.some((i) => i.station === station);
const doneFor = (o, station) => o.status === 'ready' || (station !== 'all' && o.readyStations.includes(station));

export default function KitchenScreen({ me }) {
  const now = useNow(15000);
  const [station, setStation] = useState(savedStation);
  const [busy, setBusy] = useState(null);
  const [alert, raise] = useAlert();
  const [flash, show] = useFlash();
  const { data: orders, error, live, reload } = useLive(kumezaApi.kitchen);
  const seen = useRef(null);

  const pick = (st) => { setStation(st); try { localStorage.setItem(STATION_KEY, st); } catch { /* private mode */ } };
  const mine = (orders || []).filter((o) => hasItemsFor(o, station));
  const toMake = mine.filter((o) => !doneFor(o, station));
  const ready = mine.filter((o) => doneFor(o, station));

  // A ticket this screen hasn't shown before → ring (not on first load, nor
  // when switching between Kitchen and Bar).
  const seenStation = useRef(station);
  useEffect(() => {
    if (!orders) return;
    if (seenStation.current !== station) { seen.current = null; seenStation.current = station; }
    const ids = toMake.map((o) => o.id);
    if (seen.current) {
      const fresh = toMake.filter((o) => !seen.current.has(o.id));
      if (fresh.length) raise(fresh.length === 1 ? `${fresh[0].table}: new ticket` : `${fresh.length} new tickets`, 'normal');
    }
    seen.current = new Set([...(seen.current || []), ...ids]);
  }, [orders, station]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = useCallback(async (id, fn) => {
    setBusy(id);
    try { await fn(); } catch (e) { show(e.message, true); }
    await reload();
    setBusy(null);
  }, [reload, show]);

  if (!orders) return error ? <ErrorText>{error}</ErrorText> : <Loading />;
  return (
    <div>
      <PageHeader title="Kitchen screen" subtitle={me.place.name} />
      <ShiftBar live={live}>
        {STATIONS.map(([k, label]) => <Chip key={k} on={station === k} onClick={() => pick(k)}>{label}</Chip>)}
      </ShiftBar>
      <AlertBanner alert={alert} />

      {toMake.length ? (
        <div style={s.grid}>
          {toMake.map((o) => (
            <Ticket
              key={o.id} order={o} station={station} now={now} busy={busy === o.id}
              onPreparing={() => run(o.id, () => kumezaApi.order(o.id, 'preparing'))}
              onReady={() => run(o.id, () => kumezaApi.ready(o.id, station === 'all' ? undefined : station))}
            />
          ))}
        </div>
      ) : <div style={s.empty}>No tickets waiting. New orders appear here by themselves.</div>}

      {ready.length > 0 && (
        <>
          <div style={s.readyTitle}>Ready — waiting for the waiter</div>
          <div style={s.readyRow}>
            {ready.map((o) => <span key={o.id} style={s.readyChip}>{o.table} · {o.items.filter((i) => station === 'all' || i.station === station).reduce((n, i) => n + i.qty, 0)} items</span>)}
          </div>
        </>
      )}
      <Flash flash={flash} />
    </div>
  );
}

const s = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, alignItems: 'start' },
  empty: { color: t.textSecondary, background: t.bgCard, borderRadius: t.radiusLg, padding: 28, textAlign: 'center' },
  readyTitle: { color: t.textMuted, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, margin: '22px 0 8px' },
  readyRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  readyChip: { background: 'rgba(145,213,31,0.22)', color: t.text, borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 700 },
};
