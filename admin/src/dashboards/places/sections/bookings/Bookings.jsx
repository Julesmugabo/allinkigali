/**
 * Bookings.jsx — table bookings across every listing of this kind.
 */
import React from 'react';
import { Panel, Loading } from '../../../../components/ui';
import BookingsTable from '../../../../components/places/BookingsTable';
import { usePlaces } from '../../PlacesContext';
import { placesApi } from '../../placesApi';

export default function Bookings() {
  const { type, bookings, loading, changed, notify } = usePlaces();
  const onStatus = async (b, status) => {
    await placesApi.setBookingStatus(b.id, status);
    notify(`Booking for ${b.guestName || 'guest'}: ${status === 'noshow' ? 'no-show' : status}`);
    changed();
  };
  return (
    <Panel title={`${type.one} bookings`}>
      {loading ? <Loading /> : <BookingsTable bookings={bookings} onStatus={onStatus} showPlace />}
    </Panel>
  );
}
