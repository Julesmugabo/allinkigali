/**
 * WeddingVisits.jsx — couples' "Book a visit" requests for wedding venues.
 * Venues have no owner accounts yet, so the Sales Partners team answers
 * them; confirming or declining notifies the couple.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Panel, Loading, ErrorText, Muted } from '../../../../components/ui';
import BookingsTable from '../../../../components/places/BookingsTable';
import { useSellers } from '../../SellersContext';
import { sellersApi } from '../../sellersApi';

export default function WeddingVisits() {
  const { notify } = useSellers();
  const [visits, setVisits] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    sellersApi.weddingVisits().then(setVisits).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const onStatus = async (b, status, reason) => {
    await sellersApi.setBookingStatus(b.id, status, reason);
    notify(status === 'confirmed' ? `Visit confirmed — ${b.guestName || 'the couple'} has been notified`
      : status === 'rejected' ? `Visit declined — ${b.guestName || 'the couple'} has been told why`
        : `Marked ${status === 'noshow' ? 'no-show' : status}`);
    load();
  };

  if (error) return <ErrorText>{error}</ErrorText>;
  if (!visits) return <Loading />;
  return (
    <Panel title="Wedding venue visits">
      <Muted>Call the couple to agree the details, then confirm the visit with the venue.</Muted>
      <BookingsTable bookings={visits} onStatus={onStatus} showPlace />
    </Panel>
  );
}
