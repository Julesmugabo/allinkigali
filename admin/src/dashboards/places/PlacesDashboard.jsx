/**
 * PlacesDashboard.jsx — the platform admin for restaurants (/restaurants/…)
 * and coffee shops (/coffee-shops/…), for the Sales Partners admin and the
 * director. Sections come from placeTypes.js and live in ./sections.
 */
import React from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageShell';
import { Toast } from '../../components/ui';
import { PlacesProvider, usePlaces } from './PlacesContext';
import { PLACE_TYPES } from './placeTypes';

import Overview from './sections/overview/Overview';
import PlacesList from './sections/list/PlacesList';
import PlaceEditor from './sections/editor/PlaceEditor';
import Bookings from './sections/bookings/Bookings';
import Menus from './sections/menu/Menus';
import Cuisines from './sections/cuisines/Cuisines';
import Intents from './sections/intents/Intents';

const VIEWS = { overview: Overview, list: PlacesList, add: PlaceEditor, bookings: Bookings, menu: Menus, cuisines: Cuisines, intents: Intents };

function PlacesToast() {
  const { toast } = usePlaces();
  return <Toast toast={toast} />;
}

function Shell({ type }) {
  const { section = 'overview' } = useParams();
  const [params] = useSearchParams();
  const View = VIEWS[section];
  if (!View || !type.sections.some((x) => x.key === section)) return <Navigate to={type.base} replace />;
  const label = section === 'add' && params.get('id') ? `Edit ${type.one}` : type.sections.find((x) => x.key === section)?.label;
  return (
    <div>
      <PageHeader title={type.title} subtitle={label} />
      <View />
      <PlacesToast />
    </div>
  );
}

export default function PlacesDashboard({ kind }) {
  const type = PLACE_TYPES[kind];
  return (
    <PlacesProvider type={type}>
      <Shell type={type} />
    </PlacesProvider>
  );
}
