/**
 * OwnerDashboard.jsx — a restaurant's or coffee shop's own dashboard.
 *   Owners:          /my-place/:section?              (their linked place)
 *   Platform staff:  /clients/:kind/:placeId/:section? (any place; shows a
 *                    "You are managing …" banner with a way back)
 * Sections live in ./sections, one folder each.
 */
import React from 'react';
import { Navigate, NavLink, useParams } from 'react-router-dom';
import { t } from '../../theme';
import { PageHeader } from '../../components/PageShell';
import { Toast, ErrorText, Loading } from '../../components/ui';
import { getUser } from '../../api';
import { OwnerProvider, useOwner } from './OwnerContext';
import { ownerSections } from './sections';
import StaffBanner from './StaffBanner';

import Overview from './sections/overview/Overview';
import Bookings from './sections/bookings/Bookings';
import Orders from './sections/orders/Orders';
import Menu from './sections/menu/Menu';
import Insights from './sections/insights/Insights';
import Reviews from './sections/reviews/Reviews';
import Finance from './sections/finance/Finance';
import Reports from './sections/reports/Reports';
import Intents from './sections/intents/Intents';
import Settings from './sections/settings/Settings';

const VIEWS = { overview: Overview, bookings: Bookings, orders: Orders, menu: Menu, insights: Insights, reviews: Reviews, finance: Finance, reports: Reports, intents: Intents, settings: Settings };

function Shell() {
  const { section = 'overview' } = useParams();
  const { profile, loading, error, isCafe, base, staffView, toast } = useOwner();
  const sections = ownerSections(isCafe);
  const View = VIEWS[section];
  if (!View || !sections.some((x) => x.key === section)) return <Navigate to={base} replace />;
  if (loading) return <Loading />;
  if (!profile) {
    return <ErrorText>{error || 'No place is linked to this account yet. Ask the director to link your restaurant or coffee shop.'}</ErrorText>;
  }
  return (
    <div>
      {staffView && <StaffBanner name={profile.name} />}
      <PageHeader title={profile.name} subtitle={sections.find((x) => x.key === section)?.label} />
      {staffView && (
        // Staff don't get these as sidebar items (the sidebar holds their own
        // dashboards), so the owner's sections are a tab row here instead.
        <nav style={s.tabs}>
          {sections.map((x) => (
            <NavLink key={x.key} end to={x.key === 'overview' ? base : `${base}/${x.key}`}
              style={({ isActive }) => ({ ...s.tab, ...(isActive ? s.tabOn : {}) })}>{x.label}</NavLink>
          ))}
        </nav>
      )}
      <View />
      <Toast toast={toast} />
    </div>
  );
}

/** Owner's own place. */
export function MyPlaceDashboard() {
  const kind = getUser()?.role === 'coffeeshop' ? 'coffeeshop' : 'restaurant';
  return (
    <OwnerProvider kind={kind} base="/my-place">
      <Shell />
    </OwnerProvider>
  );
}

/** A place opened by platform staff from a list. */
export function ClientPlaceDashboard() {
  const { kind, placeId } = useParams();
  if (kind !== 'restaurant' && kind !== 'coffeeshop') return <Navigate to="/" replace />;
  return (
    <OwnerProvider key={`${kind}-${placeId}`} kind={kind} place={{ kind, id: placeId }} base={`/clients/${kind}/${placeId}`}>
      <Shell />
    </OwnerProvider>
  );
}

const s = {
  tabs: { display: 'flex', gap: 4, overflowX: 'auto', borderBottom: `1px solid ${t.border}`, marginBottom: 18 },
  tab: { padding: '9px 12px', color: t.textSecondary, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', borderBottom: '2px solid transparent', marginBottom: -1 },
  tabOn: { color: t.accent, borderBottomColor: t.accent },
};
