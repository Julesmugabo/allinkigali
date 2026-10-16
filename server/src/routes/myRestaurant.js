/**
 * myRestaurant.js — Owner self-service routes for both restaurant and coffee shop owners.
 * The caller's role ('restaurant' or 'coffeeshop') determines which table and id to use.
 * The place id is read from the JWT so an owner can never touch another place.
 */
const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { hasRole } = require('../middleware/requireRole');
const { clientOwnersOnly } = require('../middleware/clientAuth');
const { bookingNotices, orderNotices, ORDER_STEPS } = require('../services/customerNotices');

const router = express.Router();
const guard = [requireAuth, requireRole('restaurant', 'coffeeshop', 'sellers'), clientOwnersOnly];

// Derive context from the JWT: which table, which id, which booking type.
// Which place this request acts on. Owners always get their own linked
// place. The Sales Partners admin and the director may open any place's
// dashboard by passing ?placeType=restaurant|coffee_shop&placeId=… (the
// staff portal's "Open Dashboard"); without those, the director keeps the
// old behaviour of using a place linked to their own account.
function getContext(req) {
  const user = req.user;
  const staff = hasRole(user, 'director', 'sellers');
  const { placeType, placeId } = req.query || {};
  if (staff && placeId && (placeType === 'restaurant' || placeType === 'coffee_shop')) {
    return placeType === 'restaurant'
      ? { table: 'restaurants', idField: 'restaurantId', placeId, bookingType: 'restaurant' }
      : { table: 'coffee_shops', idField: 'coffeeShopId', placeId, bookingType: 'coffee_shop' };
  }
  const isRestaurant = user.role === 'restaurant' || (user.role === 'director' && user.restaurantId);
  if (isRestaurant) {
    return { table: 'restaurants', idField: 'restaurantId', placeId: user.restaurantId || user.restaurant_id, bookingType: 'restaurant' };
  }
  return { table: 'coffee_shops', idField: 'coffeeShopId', placeId: user.coffeeShopId || user.coffee_shop_id, bookingType: 'coffee_shop' };
}

// GET /my-restaurant — get the owner's own listing
// Profile fields an owner (or platform staff) may change, per kind of place:
// request key → column. Only keys present in the request are written, so a
// partial save never blanks other fields.
const PROFILE_FIELDS = {
  common: {
    name: 'name', description: 'description', location: 'location', district: 'district',
    phone: 'phone', website: 'website', openStatus: 'open_status', price: 'price',
    atmosphere: 'atmosphere', seating: 'seating',
    deliveryEnabled: 'delivery_enabled', deliveryFee: 'delivery_fee', minOrder: 'min_order', estimatedTime: 'estimated_time',
    openHours: 'open_hours', deliveryZones: 'delivery_zones',
  },
  restaurants: { cuisines: 'cuisines', foods: 'foods', occasion: 'occasion', dietary: 'dietary', features: 'features' },
  coffee_shops: {
    coffeeTypes: 'coffee_types', brewingMethods: 'brewing_methods', origins: 'origins', food: 'food',
    facilities: 'facilities', attributes: 'attributes', services: 'services',
  },
};
const PHOTOS = {
  restaurants: { table: 'restaurant_photos', fk: 'restaurant_id' },
  coffee_shops: { table: 'coffee_shop_photos', fk: 'coffee_shop_id' },
};

async function loadProfile(ctx) {
  const { rows } = await query(`SELECT * FROM ${ctx.table} WHERE id=$1`, [ctx.placeId]);
  if (!rows.length) return null;
  const ph = PHOTOS[ctx.table];
  const { rows: photos } = await query(`SELECT id, url, label, sort_order FROM ${ph.table} WHERE ${ph.fk}=$1 ORDER BY sort_order`, [ctx.placeId]);
  return { ...rows[0], type: ctx.bookingType, photos };
}

// GET /my-restaurant — the place's profile (with photos)
router.get('/', ...guard, async (req, res) => {
  const ctx = getContext(req);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked to this account.' });
  const profile = await loadProfile(ctx);
  if (!profile) return res.status(404).json({ error: 'Listing not found.' });
  res.json(profile);
});

// PUT /my-restaurant — update the profile. (The old version wrote columns
// that don't exist — restaurants.photos, coffee_shops.specialties/features —
// so every save failed.)
router.put('/', ...guard, async (req, res) => {
  const ctx = getContext(req);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  const map = { ...PROFILE_FIELDS.common, ...PROFILE_FIELDS[ctx.table] };
  const sets = [];
  const vals = [];
  Object.entries(map).forEach(([key, col]) => {
    if (key in req.body) { vals.push(req.body[key]); sets.push(`${col}=$${vals.length}`); }
  });
  if (sets.length) {
    vals.push(ctx.placeId);
    await query(`UPDATE ${ctx.table} SET ${sets.join(', ')}, updated_at=NOW() WHERE id=$${vals.length}`, vals);
  }
  if (Array.isArray(req.body.photos)) {
    const ph = PHOTOS[ctx.table];
    await query(`DELETE FROM ${ph.table} WHERE ${ph.fk}=$1`, [ctx.placeId]);
    for (const [i, photo] of req.body.photos.filter((x) => x && x.url).entries()) {
      await query(`INSERT INTO ${ph.table} (${ph.fk}, url, label, sort_order) VALUES ($1,$2,$3,$4)`, [ctx.placeId, photo.url, photo.label || '', i]);
    }
  }
  res.json(await loadProfile(ctx));
});

// GET /my-restaurant/bookings
router.get('/bookings', ...guard, async (req, res) => {
  const ctx = getContext(req);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });

  const joinTable = ctx.table === 'restaurants' ? 'restaurants' : 'coffee_shops';
  const { rows } = await query(
    `SELECT rb.*, p.name as "placeName"
     FROM resto_bookings rb
     LEFT JOIN ${joinTable} p ON rb.place_id = p.id
     WHERE rb.place_id = $1 AND rb.type = $2
     ORDER BY rb.date DESC, rb.time DESC`,
    [ctx.placeId, ctx.bookingType]
  );
  res.json(rows.map((b) => ({
    id: b.id, status: b.status, guestName: b.guest_name, guestPhone: b.guest_phone,
    date: b.date, time: b.time, partySize: b.party_size, notes: b.notes,
    placeName: b.placeName, noshowCount: b.noshow_count || 0, createdAt: b.created_at,
    declineReason: b.decline_reason, respondedAt: b.responded_at,
  })));
});

// PUT /my-restaurant/bookings/:id/status
router.put('/bookings/:id/status', ...guard, async (req, res) => {
  const ctx = getContext(req);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  const { status, reason } = req.body;
  const allowed = ['confirmed', 'rejected', 'completed', 'noshow', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

  const { rows: bRows } = await query(
    'SELECT * FROM resto_bookings WHERE id=$1 AND place_id=$2',
    [req.params.id, ctx.placeId]
  );
  if (!bRows.length) return res.status(404).json({ error: 'Booking not found.' });
  const booking = bRows[0];

  const updates = ['status=$1', 'updated_at=NOW()'];
  const params = [status];
  if (status === 'confirmed') updates.push('confirmed_at=NOW()');
  if (status === 'noshow') updates.push('noshow_count=noshow_count+1');
  if (status === 'confirmed' || status === 'rejected') updates.push('responded_at=COALESCE(responded_at, NOW())');
  if (status === 'rejected' && reason) { params.push(String(reason).slice(0, 200)); updates.push(`decline_reason=$${params.length}`); }

  await query(
    `UPDATE resto_bookings SET ${updates.join(',')} WHERE id=$${params.length + 1}`,
    [...params, booking.id]
  );

  // Tell the customer the place's answer.
  if (status === 'confirmed') await bookingNotices.confirmed(booking);
  else if (status === 'rejected') await bookingNotices.declined(booking, reason && String(reason).slice(0, 200));
  else if (status === 'cancelled') await bookingNotices.cancelledByPlace(booking);

  res.json({ ok: true });
});

// ── Menu (restaurants and coffee shops) ──────────────────────────────────────
// Previously registered twice: the restaurant-only version answered first, so
// coffee-shop owners could never list or add menu items.
const MENU = {
  restaurants: { table: 'restaurant_menu_items', fk: 'restaurant_id', defaultCategory: 'Main' },
  coffee_shops: { table: 'coffee_shop_menu_items', fk: 'coffee_shop_id', defaultCategory: 'Espresso drinks' },
};

router.get('/menu', ...guard, async (req, res) => {
  const ctx = getContext(req);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  const m = MENU[ctx.table];
  const { rows } = await query(`SELECT * FROM ${m.table} WHERE ${m.fk}=$1 ORDER BY category, sort_order, name`, [ctx.placeId]);
  res.json(rows.map((r) => ({ ...r, brewMethod: r.brew_method, origin: r.origin, photoUrl: r.photo_url })));
});

router.post('/menu', ...guard, async (req, res) => {
  const ctx = getContext(req);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  const m = MENU[ctx.table];
  const { category, name, description, price, available, photoUrl, sortOrder, brewMethod, origin } = req.body;
  if (!name || price == null) return res.status(400).json({ error: 'name and price required.' });
  const cols = [m.fk, 'category', 'name', 'description', 'price', 'available', 'photo_url', 'sort_order'];
  const vals = [ctx.placeId, category || m.defaultCategory, name, description || '', price, available !== false, photoUrl || null, sortOrder || 0];
  if (ctx.table === 'coffee_shops') { cols.push('brew_method', 'origin'); vals.push(brewMethod || null, origin || null); }
  const { rows } = await query(
    `INSERT INTO ${m.table} (${cols.join(', ')}) VALUES (${vals.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
    vals
  );
  res.status(201).json(rows[0]);
});

router.put('/menu/:id', ...guard, async (req, res) => {
  const ctx = getContext(req);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  const m = MENU[ctx.table];
  // Only the fields sent are changed, so a quick "sold out" toggle that
  // sends just { available } doesn't blank the item's name and price.
  const fields = { category: 'category', name: 'name', description: 'description', price: 'price', available: 'available', photoUrl: 'photo_url', sortOrder: 'sort_order' };
  if (ctx.table === 'coffee_shops') Object.assign(fields, { brewMethod: 'brew_method', origin: 'origin' });
  const sets = [];
  const vals = [];
  Object.entries(fields).forEach(([key, col]) => {
    if (key in req.body) { vals.push(key === 'available' ? req.body[key] !== false : req.body[key]); sets.push(`${col}=$${vals.length}`); }
  });
  if (!sets.length) return res.status(400).json({ error: 'No fields provided.' });
  vals.push(req.params.id, ctx.placeId);
  const { rows } = await query(
    `UPDATE ${m.table} SET ${sets.join(', ')}, updated_at=NOW() WHERE id=$${vals.length - 1} AND ${m.fk}=$${vals.length} RETURNING *`,
    vals
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json(rows[0]);
});

router.delete('/menu/:id', ...guard, async (req, res) => {
  const ctx = getContext(req);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  const m = MENU[ctx.table];
  await query(`DELETE FROM ${m.table} WHERE id=$1 AND ${m.fk}=$2`, [req.params.id, ctx.placeId]);
  res.status(204).end();
});

// ── Reviews ───────────────────────────────────────────────────────────────────

router.get('/reviews', ...guard, async (req, res) => {
  const ctx = getContext(req);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  // reviews.user_id is text; comparing it to the uuid directly failed, and the
  // old catch-all turned that into an empty list, so owners never saw reviews.
  const { rows } = await query(
    `SELECT r.*, COALESCE(NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''), u.email) as "guestName"
     FROM reviews r
     LEFT JOIN users u ON u.id::text = r.user_id
     WHERE r.place_id = $1 AND r.place_type = $2
     ORDER BY r.created_at DESC`,
    [ctx.placeId, ctx.bookingType]
  );
  res.json(rows.map(r => ({
    id: r.id, rating: Number(r.rating), text: r.text,
    guestName: r.guestName || 'Guest', date: r.created_at?.toISOString().slice(0,10),
    ownerReply: r.owner_reply,
  })));
});

router.post('/reviews/:id/reply', ...guard, async (req, res) => {
  const ctx = getContext(req);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  const { reply } = req.body;
  if (!reply?.trim()) return res.status(400).json({ error: 'reply required.' });
  try {
    await query(
      'UPDATE reviews SET owner_reply=$1, reply_at=NOW() WHERE id=$2 AND place_id=$3',
      [reply.trim(), req.params.id, ctx.placeId]
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Could not save reply.' });
  }
});

// ── Orders ────────────────────────────────────────────────────────────────────
// Customer delivery orders live in food_orders (written by routes/foodOrders.js).
// This used to read a resto_orders table nothing ever writes to, so owners
// always saw an empty board.

router.get('/orders', ...guard, async (req, res) => {
  const ctx = getContext(req);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  const { rows } = await query(
    `SELECT fo.*, COALESCE(NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''), u.email) AS customer_name
     FROM food_orders fo LEFT JOIN users u ON u.id = fo.user_id
     WHERE fo.place_id = $1 ORDER BY fo.created_at DESC LIMIT 200`,
    [ctx.placeId]
  );
  res.json(rows.map((o) => ({
    id: o.id, code: String(o.id).slice(-6).toUpperCase(), status: o.status,
    items: o.items || [], subtotal: Number(o.subtotal || 0), deliveryFee: Number(o.delivery_fee || 0), total: Number(o.total || 0),
    customerName: o.customer_name, customerPhone: o.delivery_phone, address: o.delivery_address,
    paymentMethod: o.payment_method, notes: o.notes, createdAt: o.created_at,
  })));
});

router.put('/orders/:id/status', ...guard, async (req, res) => {
  const ctx = getContext(req);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  // The mobile owner app's board says "accepted"; the orders table says "confirmed".
  const status = req.body.status === 'accepted' ? 'confirmed' : req.body.status;
  if (!ORDER_STEPS[status]) return res.status(400).json({ error: 'Invalid status.' });
  const { rows } = await query(
    'UPDATE food_orders SET status=$1, updated_at=NOW() WHERE id=$2 AND place_id=$3 RETURNING *',
    [status, req.params.id, ctx.placeId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Order not found.' });
  await orderNotices.update(rows[0], status);
  res.json({ ok: true });
});

// ── Busy-now (coffee shops) ───────────────────────────────────────────────────

router.put('/busy', ...guard, async (req, res) => {
  const ctx = getContext(req);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  const { busy } = req.body;
  if (!['quiet','moderate','full',null].includes(busy)) return res.status(400).json({ error: 'Invalid busy level.' });
  try {
    if (ctx.table === 'coffee_shops') {
      await query(
        `UPDATE coffee_shops SET busy_now=$1, busy_updated_at=NOW() WHERE id=$2`,
        [busy, ctx.placeId]
      );
    }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Could not update busy status.' });
  }
});

// ── Legacy cs-menu routes (kept for backward compat) ─────────────────────────

// Coffee shop menu routes
router.get('/cs-menu', ...guard, async (req, res) => {
  const ctx = getContext(req);
  if (ctx.table !== 'coffee_shops') return res.json([]);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  const { rows } = await query(
    'SELECT * FROM coffee_shop_menu_items WHERE coffee_shop_id=$1 ORDER BY category, sort_order, name',
    [ctx.placeId]
  );
  res.json(rows);
});

router.post('/cs-menu', ...guard, async (req, res) => {
  const ctx = getContext(req);
  if (ctx.table !== 'coffee_shops') return res.status(400).json({ error: 'CS menu is for coffee shops only.' });
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  const { category, name, description, price, photoUrl, sortOrder } = req.body;
  if (!name || price == null) return res.status(400).json({ error: 'name and price required.' });
  const { rows } = await query(
    `INSERT INTO coffee_shop_menu_items (coffee_shop_id, category, name, description, price, photo_url, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [ctx.placeId, category || 'Drinks', name, description || '', price, photoUrl || null, sortOrder || 0]
  );
  res.status(201).json(rows[0]);
});

router.put('/cs-menu/:id', ...guard, async (req, res) => {
  const ctx = getContext(req);
  if (ctx.table !== 'coffee_shops') return res.status(400).json({ error: 'CS menu is for coffee shops only.' });
  const { category, name, description, price, available, photoUrl, sortOrder } = req.body;
  const { rows } = await query(
    `UPDATE coffee_shop_menu_items
     SET category=$1, name=$2, description=$3, price=$4, available=$5, photo_url=$6, sort_order=$7, updated_at=NOW()
     WHERE id=$8 AND coffee_shop_id=$9 RETURNING *`,
    [category, name, description, price, available !== false, photoUrl || null, sortOrder ?? 0, req.params.id, ctx.placeId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json(rows[0]);
});

router.delete('/cs-menu/:id', ...guard, async (req, res) => {
  const ctx = getContext(req);
  if (ctx.table !== 'coffee_shops') return res.status(400).json({ error: 'CS menu is for coffee shops only.' });
  await query('DELETE FROM coffee_shop_menu_items WHERE id=$1 AND coffee_shop_id=$2', [req.params.id, ctx.placeId]);
  res.status(204).end();
});

module.exports = router;
