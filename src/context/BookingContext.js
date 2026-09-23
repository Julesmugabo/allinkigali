/**
 * BookingContext.js — Ibyifuzo byo kubona serivisi (service bookings).
 *
 * Talks to our own Express + Postgres backend now (server/src/routes/bookings.js),
 * not in-memory state — every screen still only ever calls useBookings().
 *
 * PAYMENT IS NOT BUILT — and per the platform's business model (it only
 * connects customer and seller, never handles the transaction itself) it
 * doesn't need to be; placeBooking() just records the request with
 * paymentMethod: null.
 *
 * `status` + `respondedAt` exist so the seller dashboard has something to
 * show as an inbox: a request starts 'new', and the seller marks it
 * 'handled' or 'no_response' — that's also what a response-time stat is
 * computed from.
 */
import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../services/apiClient';
import { makeOrderRef } from '../utils/format';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBookings = useCallback(async () => {
    try {
      const data = await apiFetch('/bookings');
      setBookings(data || []);
    } catch {
      // Leave whatever was already loaded rather than blanking the list
      // over a transient network hiccup.
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshBookings();
      setIsLoading(false);
    })();
  }, [refreshBookings]);

  const placeBooking = useCallback(async ({ business, itemLabel, quantity, date, note }) => {
    const payload = {
      ref: makeOrderRef(),
      businessId: business.id,
      businessName: business.name,
      itemLabel: itemLabel || null,
      priceFrom: business.priceFrom,
      priceUnit: business.priceUnit,
      currency: business.currency,
      quantity,
      date,
      note: note || '',
    };

    try {
      const booking = await apiFetch('/bookings', { method: 'POST', body: payload });
      setBookings((current) => [booking, ...current]);
      return booking;
    } catch {
      return null;
    }
  }, []);

  const updateBookingStatus = useCallback(async (id, status) => {
    try {
      const updated = await apiFetch(`/bookings/${id}`, { method: 'PATCH', body: { status } });
      setBookings((current) => current.map((b) => (b.id === id ? updated : b)));
    } catch {
      // no-op — status stays as it was, matching the pre-fix state
    }
  }, []);

  const getBookingsForBusiness = useCallback(
    (businessId) => bookings.filter((b) => b.businessId === businessId),
    [bookings]
  );

  const value = useMemo(
    () => ({ bookings, isLoading, refreshBookings, placeBooking, updateBookingStatus, getBookingsForBusiness }),
    [bookings, isLoading, refreshBookings, placeBooking, updateBookingStatus, getBookingsForBusiness]
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBookings() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookings must be used inside <BookingProvider>.');
  }
  return context;
}

export default BookingContext;
