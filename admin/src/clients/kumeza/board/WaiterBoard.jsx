/**
 * WaiterBoard.jsx — Ku Meza › Waiter board. Every table with guests is a card
 * coloured by its state, live; free tables sit in a strip below. Alerts (with
 * sound after "Start shift") for new guests to confirm, new orders, food or
 * drinks ready, waiter calls and bill requests. Filters: a section (a waiter
 * opens on their own) or all tables, and "Needs you".
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { t } from '../../../theme';
import { PageHeader } from '../../../components/PageShell';
import { ErrorText, Loading } from '../../../components/ui';
import useNow from '../../common/useNow';
import Flash, { useFlash } from '../../common/Flash';
import { kumezaApi } from '../kumezaApi';
import useLive from '../live/useLive';
import ShiftBar, { Chip } from '../live/ShiftBar';
import AlertBanner, { useAlert } from '../live/AlertBanner';
import { STATE, tableState } from './tableState';
import TableCard from './TableCard';
import CloseTable from './CloseTable';

const ALERTS = {
  needs_confirm: ['urgent', (e) => `${e.table}: new guest — go and confirm they're seated`],
  new_order: ['normal', (e) => `${e.table}: new order`],
  call_waiter: ['urgent', (e) => `${e.table} is calling a waiter`],
  bill: ['urgent', (e) => `${e.table} asks for the bill`],
  ready: ['normal', (e) => `${e.table}: ready to serve`],
  station_ready: ['normal', (e) => `${e.table}: ${e.station === 'bar' ? 'drinks' : 'food'} ready — collect`],
  cancelled: ['soft', (e) => `${e.table}: the guest cancelled an order`],
};
const URGENCY = ['confirm', 'call', 'bill', 'new', 'ready', 'preparing', 'served', 'free'];

export default function WaiterBoard({ me }) {
  const now = useNow();
  const [alert, raise] = useAlert();
  const [section, setSection] = useState(me.sectionId || 'all');
  const [needsOnly, setNeedsOnly] = useState(false);
  const [busy, setBusy] = useState(null); // table id
  const [closingId, setClosingId] = useState(null);
  const [flash, show] = useFlash();
  const myTables = useRef(null); // labels in the chosen section, to keep other sections quiet

  const onEvent = useCallback((e) => {
    const a = ALERTS[e.type];
    if (!a || (myTables.current && !myTables.current.has(e.table))) return;
    raise(a[1](e), a[0]);
  }, [raise]);
  const { data: tables, error: loadError, live, reload } = useLive(kumezaApi.board, onEvent);

  const sections = useMemo(() => {
    const m = new Map();
    (tables || []).forEach((tb) => { if (tb.sectionId) m.set(tb.sectionId, tb.section); });
    return [...m.entries()];
  }, [tables]);
  const inSection = (tables || []).filter((tb) => section === 'all' || tb.sectionId === section);
  myTables.current = section === 'all' ? null : new Set(inSection.map((tb) => tb.label));
  const needy = inSection.filter((tb) => STATE[tableState(tb)].urgent);
  const busyTables = (needsOnly ? needy : inSection.filter((tb) => tb.session))
    .slice().sort((a, b) => (needsOnly ? URGENCY.indexOf(tableState(a)) - URGENCY.indexOf(tableState(b)) : 0));
  const free = inSection.filter((tb) => !tb.session);
  const closing = (tables || []).find((tb) => tb.id === closingId && tb.session) || null;

  const run = async (tableId, fn) => {
    setBusy(tableId);
    try { await fn(); } catch (e) { show(e.message, true); }
    await reload();
    setBusy(null);
  };
  const tableOf = (sessionId) => tables.find((tb) => tb.session?.id === sessionId)?.id;

  if (!tables) return loadError ? <ErrorText>{loadError}</ErrorText> : <Loading />;
  return (
    <div>
      <PageHeader title="Waiter board" subtitle={me.place.name} />
      <ShiftBar live={live}>
        <Chip on={!needsOnly} onClick={() => setNeedsOnly(false)}>Tables with guests</Chip>
        <Chip on={needsOnly} onClick={() => setNeedsOnly(true)} color={t.danger}>Needs you · {needy.length}</Chip>
        {sections.length > 0 && <span style={s.sep} />}
        {sections.length > 0 && <Chip on={section === 'all'} onClick={() => setSection('all')}>All sections</Chip>}
        {sections.map(([id, name]) => (
          <Chip key={id} on={section === id} onClick={() => setSection(id)}>{name}{id === me.sectionId ? ' (mine)' : ''}</Chip>
        ))}
      </ShiftBar>
      <AlertBanner alert={alert} />

      {!tables.length ? (
        <div style={s.empty}>
          No tables yet.{' '}
          {['owner', 'manager'].includes(me.role)
            ? <>Add them in <Link to="/kumeza/tables">Ku Meza › Tables &amp; QR codes</Link>.</>
            : 'Ask the owner to set up Ku Meza.'}
        </div>
      ) : (
        <>
          {busyTables.length ? (
            <div style={s.grid}>
              {busyTables.map((tb) => (
                <TableCard
                  key={tb.id} table={tb} now={now} busy={busy === tb.id}
                  onOrder={(o, action) => run(tableOf(o.sessionId), () => kumezaApi.order(o.id, action))}
                  onRequest={(r) => run(tb.id, () => kumezaApi.handleRequest(r.id))}
                  onClose={(table) => setClosingId(table.id)}
                />
              ))}
            </div>
          ) : (
            <div style={s.empty}>{needsOnly ? 'Nothing needs you right now.' : 'No guests ordering yet. New orders appear here by themselves.'}</div>
          )}
          {!needsOnly && free.length > 0 && (
            <div style={s.freeRow}>
              <span style={s.freeLabel}>Free</span>
              {free.map((tb) => <span key={tb.id} style={s.free}>{tb.label}</span>)}
            </div>
          )}
        </>
      )}

      <Flash flash={flash} />
      <CloseTable
        table={closing}
        onCancel={() => setClosingId(null)}
        onConfirm={async (tb, method) => { await run(tb.id, () => kumezaApi.closeTable(tb.session.id, method)); setClosingId(null); }}
      />
    </div>
  );
}

const s = {
  sep: { width: 1, alignSelf: 'stretch', background: t.borderLight, margin: '0 4px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, alignItems: 'start' },
  empty: { color: t.textSecondary, background: t.bgCard, borderRadius: t.radiusLg, padding: 28, textAlign: 'center' },
  freeRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 18 },
  freeLabel: { color: t.textMuted, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginRight: 4 },
  free: { background: t.bgCard, color: t.textSecondary, borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600 },
};
