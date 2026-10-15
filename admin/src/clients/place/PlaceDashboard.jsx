/**
 * PlaceDashboard.jsx — a restaurant's or coffee shop's own pages in the
 * client dashboard: /place/:section? (today, table bookings, Order Food
 * orders and earnings, menu, insights, reviews, reports, visitor intents,
 * settings).
 * The sign-in decides the place; sections live in ./sections, one folder each.
 */
import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageShell';
import { Toast, ErrorText, Loading } from '../../components/ui';
import { OwnerProvider, useOwner } from './OwnerContext';

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

const VIEWS = {
  overview: [Overview, 'Today'], bookings: [Bookings, 'Table bookings'], orders: [Orders, 'Order Food · delivery orders'], menu: [Menu, 'Menu'],
  insights: [Insights, 'Insights'], reviews: [Reviews, 'Reviews'], finance: [Finance, 'Order Food · delivery earnings'],
  reports: [Reports, 'Reports'], intents: [Intents, 'Visitor intents'], settings: [Settings, 'Profile & settings'],
};

function Shell() {
  const { section = 'overview' } = useParams();
  const { profile, loading, error, isCafe, toast } = useOwner();
  const [View, title] = VIEWS[section] || [];
  if (!View || (section === 'intents' && !isCafe)) return <Navigate to="/place" replace />;
  if (loading) return <Loading />;
  if (!profile) return <ErrorText>{error || 'This place could not be loaded.'}</ErrorText>;
  return (
    <div>
      <PageHeader title={profile.name} subtitle={title} />
      <View />
      <Toast toast={toast} />
    </div>
  );
}

export default function PlaceDashboard({ kind }) {
  return (
    <OwnerProvider kind={kind} base="/place">
      <Shell />
    </OwnerProvider>
  );
}
