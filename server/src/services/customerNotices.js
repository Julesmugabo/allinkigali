/**
 * customerNotices.js — what customers find under the bell about their own
 * bookings, food orders and business applications: proof that what they
 * sent went through, then every answer from the place. One place for the
 * wording, used by every route that books, answers or cancels.
 */
const { notifyUser } = require('../pushNotifications');

// "2026-10-17" → "Fri 17 Oct" (dates are stored as plain text).
function niceDate(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d))) return String(d);
  return new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}
const when = (b) => `${niceDate(b.date)} at ${b.time}`;
const what = (b) => (b.type === 'wedding' ? 'visit' : 'booking');
const people = (n) => `${n || 2} ${Number(n) === 1 ? 'person' : 'people'}`;
const shortId = (id) => `#${String(id).slice(-6).toUpperCase()}`;
const rwf = (n) => `${Number(n || 0).toLocaleString('en-US')} RWF`;

// Saves the notification (and pushes it to phones); never breaks the request.
async function send(userId, title, body, data) {
  if (!userId) return;
  try { await notifyUser(userId, { title, body, data }); } catch (e) { console.error('customer notice:', e.message); }
}

const bookingNotices = {
  sent: (b) => send(b.user_id, `Booking sent — ${b.place_name}`,
    `${b.place_name} will confirm your ${what(b)} for ${when(b)} (${people(b.party_size)}). We'll let you know here as soon as they answer.`,
    { type: 'booking_sent', bookingId: b.id }),
  confirmed: (b) => send(b.user_id, `Booking confirmed — ${b.place_name}`,
    `Your ${what(b)} at ${b.place_name} on ${when(b)} is confirmed (${people(b.party_size)}). See you there!`,
    { type: 'booking_confirmed', bookingId: b.id }),
  declined: (b, reason) => send(b.user_id, `Booking declined — ${b.place_name}`,
    `${b.place_name} can't take your ${what(b)} on ${when(b)}${reason ? `: ${reason}` : ''}. You can choose another time.`,
    { type: 'booking_rejected', bookingId: b.id }),
  cancelledByPlace: (b) => send(b.user_id, `Booking cancelled — ${b.place_name}`,
    `${b.place_name} cancelled your ${what(b)} on ${when(b)}.`,
    { type: 'booking_cancelled', bookingId: b.id }),
  cancelledByYou: (b) => send(b.user_id, `Booking cancelled — ${b.place_name}`,
    `You cancelled your ${what(b)} at ${b.place_name} on ${when(b)}. ${b.place_name} has been told.`,
    { type: 'booking_cancelled', bookingId: b.id }),
};

const ORDER_STEPS = {
  confirmed: ['Order confirmed', 'has confirmed your order and will prepare it shortly.'],
  preparing: ['Order being prepared', 'is preparing your order.'],
  ready: ['Order on the way', 'has your order ready and on the way to you.'],
  delivered: ['Order delivered', 'delivered your order. Enjoy!'],
  cancelled: ['Order cancelled', 'cancelled your order. Please contact them for details.'],
};

const orderNotices = {
  // Right after checkout: one notice, even when the order went to several places.
  sent: (orders) => {
    const list = [].concat(orders).filter(Boolean);
    if (!list.length) return Promise.resolve();
    const first = list[0];
    const total = list.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const data = { type: 'order_placed', orderId: first.id, checkoutId: first.checkout_id || null };
    if (list.length === 1) {
      return send(first.user_id, `Order sent — ${first.place_name}`,
        `${first.place_name} has your order ${shortId(first.id)} (${rwf(total)}). We'll let you know here when they confirm it.`, data);
    }
    const names = list.map((o) => o.place_name);
    return send(first.user_id, `Order sent — ${list.length} places`,
      `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} have your order (${rwf(total)} in all). We'll let you know here as each one confirms.`, data);
  },
  update: (o, status) => {
    const step = ORDER_STEPS[status];
    if (!step) return Promise.resolve();
    return send(o.user_id, `${step[0]} — ${o.place_name}`, `${o.place_name} ${step[1]}`,
      { type: 'order_update', orderId: o.id, checkoutId: o.checkout_id || null });
  },
  cancelledByYou: (o) => send(o.user_id, `Order cancelled — ${o.place_name}`,
    `You cancelled your order ${shortId(o.id)} at ${o.place_name}. ${o.place_name} has been told.`,
    { type: 'order_update', orderId: o.id, checkoutId: o.checkout_id || null }),
};

const listingNotices = {
  received: (p) => send(p.user_id, `Application received — ${p.business_name}`,
    `Thank you! We're checking ${p.business_name}. You'll hear from us here once it's approved.`,
    { type: 'listing_received', listingId: p.id }),
};

module.exports = { bookingNotices, orderNotices, listingNotices, ORDER_STEPS };
