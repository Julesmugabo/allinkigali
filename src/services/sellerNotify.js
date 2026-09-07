/**
 * sellerNotify.js — Kumenyesha umucuruzi ko hari icyifuzo gishya (the "connect" step).
 *
 * The platform doesn't fulfil requests — a registered seller does, directly
 * with the customer. This is the seam where that hand-off happens: today it's
 * a stub that just simulates sending a message, so the booking flow already
 * behaves like the real thing will. Swap the inside of notifySeller() for a
 * real SMS API call (e.g. Africa's Talking) later — nothing calling it has
 * to change.
 */

export async function notifySeller(business, request) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    sent: true,
    channel: 'sms-stub',
    businessId: business.id,
    request,
  };
}

export default { notifySeller };
