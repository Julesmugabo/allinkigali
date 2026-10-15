/**
 * ClientsApp.jsx — the client dashboard (allinclients.allinkigali.rw), where
 * restaurants, coffee shops and wedding venues run their business. The
 * sign-in decides the place and the pages:
 *   /place/…    a restaurant's or café's own pages (today, Order Food, bookings, menu…)
 *   /kumeza/…   Ku Meza: waiter board, kitchen screen, tables & QR codes
 *   /sales      the sales report        /team/…    staff and tablets
 *   /venue/…    a wedding venue's pages /activity  what allinkigali did here
 * Waiters, kitchen staff and cashiers only get their own screens.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { onSignedOut } from '../api';
import { t } from '../theme';
import { session } from './session';
import { homeFor } from './nav';
import Login from './auth/Login';
import DeviceConnect from './auth/DeviceConnect';
import SupportStart from './auth/SupportStart';
import ClientLayout from './layout/ClientLayout';
import PlaceDashboard from './place/PlaceDashboard';
import WaiterBoard from './kumeza/board/WaiterBoard';
import KitchenScreen from './kumeza/kitchen/KitchenScreen';
import TablesSetup from './kumeza/tables/TablesSetup';
import SalesReport from './sales/SalesReport';
import Team from './team/Team';
import SupportActivity from './activity/SupportActivity';
import VenueDashboard from './venue/VenueDashboard';

export default function ClientsApp() {
  const { pathname } = useLocation();
  const [me, setMe] = useState(null);
  const [state, setState] = useState(session.hasToken() ? 'loading' : 'out'); // loading | in | out | error
  const [error, setError] = useState('');

  const signedOut = useCallback(() => { session.signOut(); setMe(null); setState('out'); }, []);
  const load = useCallback(() => {
    if (!session.hasToken()) { setMe(null); setState('out'); return; }
    setState((s) => (s === 'in' ? s : 'loading'));
    session.me()
      .then((m) => { setMe(m); setState('in'); })
      .catch((e) => {
        if (e.status === 401 || e.status === 403) signedOut();
        else { setError(e.message); setState('error'); }
      });
  }, [signedOut]);

  useEffect(() => { onSignedOut(signedOut); load(); }, [load, signedOut]);

  if (pathname === '/support') return <SupportStart onSignedIn={load} />;
  if (state === 'out') return pathname === '/device' ? <DeviceConnect onSignedIn={load} /> : <Login onSignedIn={load} />;
  if (state === 'error') return <Splash text={error} onRetry={load} />;
  if (state === 'loading' || !me) return <Splash text="Loading…" />;

  const dining = me.place.type !== 'wedding';
  const full = ['owner', 'manager'].includes(me.role); // allinkigali support counts as owner
  const floor = full || ['waiter', 'cashier'].includes(me.role);
  const kitchen = full || me.role === 'kitchen';
  return (
    <ClientLayout me={me} onChanged={load}>
      <Routes key={`${me.place.type}:${me.place.id}`}>
        {dining && full && <Route path="/place/:section?" element={<PlaceDashboard kind={me.place.type} />} />}
        {dining && floor && <Route path="/kumeza/board" element={<WaiterBoard me={me} />} />}
        {dining && kitchen && <Route path="/kumeza/kitchen" element={<KitchenScreen me={me} />} />}
        {dining && full && <Route path="/kumeza/tables" element={<TablesSetup me={me} />} />}
        {dining && (full || me.role === 'cashier') && <Route path="/sales" element={<SalesReport me={me} />} />}
        {dining && full && <Route path="/team/:tab" element={<Team me={me} />} />}
        {!dining && full && <Route path="/venue/:section?" element={<VenueDashboard />} />}
        {full && <Route path="/activity" element={<SupportActivity me={me} />} />}
        <Route path="*" element={<Navigate to={homeFor(me)} replace />} />
      </Routes>
    </ClientLayout>
  );
}

function Splash({ text, onRetry }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', justifyContent: 'center', background: t.bg, color: t.textSecondary, fontFamily: t.font, padding: 24, textAlign: 'center' }}>
      <img src="/logo-wordmark.png" alt="AllinKigali" style={{ height: 28, opacity: 0.9 }} />
      <div>{text}</div>
      {onRetry && <button type="button" onClick={onRetry} style={{ background: t.accent, color: t.bg, fontWeight: 700 }}>Try again</button>}
    </div>
  );
}
