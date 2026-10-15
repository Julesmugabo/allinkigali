/**
 * VenueVisits.jsx — couples asking to visit the venue: confirm or decline
 * (with a reason they see), then mark the visit done or a no-show.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Panel, ErrorText, Loading } from '../../components/ui';
import BookingsTable from '../../components/places/BookingsTable';
import { venueApi } from './venueApi';

export default function VenueVisits({ show }) {
  const [visits, setVisits] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => venueApi.visits().then(setVisits).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const onStatus = async (v, status, reason) => {
    await venueApi.setVisit(v.id, status, reason);
    show(status === 'confirmed' ? 'Visit confirmed — the couple is told' : 'Saved');
    load();
  };

  if (!visits) return error ? <ErrorText>{error}</ErrorText> : <Loading />;
  return (
    <Panel title="Visit requests">
      <BookingsTable bookings={visits} onStatus={onStatus} />
    </Panel>
  );
}
