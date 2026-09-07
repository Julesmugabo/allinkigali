/**
 * BookingContext.js — Ibyifuzo byo kubona serivisi (service bookings).
 *
 * Mirrors OrdersContext but for services (gym membership, kids visit, a
 * ride) instead of physical goods. PAYMENT IS NOT BUILT — and per the
 * platform's business model (it only connects customer and seller, never
 * handles the transaction itself) it doesn't need to be; placeBooking()
 * just records the request with paymentMethod: null.
 *
 * `status` + `respondedAt` exist so the seller dashboard has something to
 * show as an inbox: a request starts 'new', and the seller marks it
 * 'handled' or 'no_response' — that's also what a response-time stat is
 * computed from.
 */
import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { makeOrderRef } from '../utils/format';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [bookings, setBookings] = useState([]);

  const placeBooking = useCallback(({ business, itemLabel, quantity, date, note }) => {
    const now = new Date().toISOString();
    const booking = {
      id: `booking-${Date.now()}`,
      ref: makeOrderRef(),
      createdAt: now,
      businessId: business.id,
      businessName: business.name,
      itemLabel: itemLabel || null,
      priceFrom: business.priceFrom,
      priceUnit: business.priceUnit,
      currency: business.currency,
      quantity,
      date,
      note: note || '',
      paymentMethod: null, // the platform never collects this — customer and seller settle directly
      status: 'new', // 'new' | 'handled' | 'no_response'
      respondedAt: null,
    };

    setBookings((current) => [booking, ...current]);
    return booking;
  }, []);

  const updateBookingStatus = useCallback((id, status) => {
    setBookings((current) =>
      current.map((b) =>
        b.id === id ? { ...b, status, respondedAt: new Date().toISOString() } : b
      )
    );
  }, []);

  const getBookingsForBusiness = useCallback(
    (businessId) => bookings.filter((b) => b.businessId === businessId),
    [bookings]
  );

  const value = useMemo(
    () => ({ bookings, placeBooking, updateBookingStatus, getBookingsForBusiness }),
    [bookings, placeBooking, updateBookingStatus, getBookingsForBusiness]
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
