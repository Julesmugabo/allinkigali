/**
 * Bookings.jsx — this place's table bookings; confirming or declining
 * notifies the guest (with the decline reason).
 */
import React from 'react';
import { Panel } from '../../../../components/ui';
import BookingsTable from '../../../../components/places/BookingsTable';
import { useOwner } from '../../OwnerContext';

export default function Bookings() {
  const { bookings, api, changed, notify } = useOwner();
  const onStatus = async (b, status, reason) => {
    await api.setBookingStatus(b.id, status, reason);
    notify(status === 'confirmed' ? `${b.guestName || 'Guest'} confirmed — they've been notified`
      : status === 'rejected' ? `${b.guestName || 'Guest'} declined — they've been told why`
        : `Marked ${status === 'noshow' ? 'no-show' : status}`);
    changed();
  };
  return (
    <Panel title="Bookings">
      <BookingsTable bookings={bookings} onStatus={onStatus} />
    </Panel>
  );
}
