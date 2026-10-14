/**
 * SellersDashboard.jsx — the Sales Partners admin: new business
 * applications, every client (restaurants + coffee shops) with a way into
 * their own dashboard, deliveries, wedding venue visits, and the shop
 * fliers strip.
 */
import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageShell';
import { Toast } from '../../components/ui';
import { SellersProvider, useSellers } from './SellersContext';
import { SECTIONS } from './nav';

import Overview from './sections/overview/Overview';
import Applications from './sections/applications/Applications';
import Clients from './sections/clients/Clients';
import Deliveries from './sections/deliveries/Deliveries';
import Fliers from './sections/fliers/Fliers';
import WeddingVisits from './sections/visits/WeddingVisits';

const VIEWS = { overview: Overview, applications: Applications, clients: Clients, deliveries: Deliveries, visits: WeddingVisits, fliers: Fliers };

function Shell() {
  const { section = 'overview' } = useParams();
  const { toast } = useSellers();
  const View = VIEWS[section];
  if (!View) return <Navigate to="/sellers" replace />;
  return (
    <div>
      <PageHeader title="Sales Partners" subtitle={SECTIONS.find((x) => x.key === section)?.label} />
      <View />
      <Toast toast={toast} />
    </div>
  );
}

export default function SellersDashboard() {
  return (
    <SellersProvider>
      <Shell />
    </SellersProvider>
  );
}
