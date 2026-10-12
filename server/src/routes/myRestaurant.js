/**
 * myRestaurant.js — Owner self-service routes for both restaurant and coffee shop owners.
 * The caller's role ('restaurant' or 'coffeeshop') determines which table and id to use.
 * The place id is read from the JWT so an owner can never touch another place.
 */
const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();
const guard = [requireAuth, requireRole('restaurant', 'coffeeshop', 'director')];

// Derive context from the JWT: which table, which id, which booking type.
function getContext(user) {
  const isRestaurant = user.role === 'restaurant' || (user.role === 'director' && user.restaurantId);
  if (isRestaurant) {
    return {
      table: 'restaurants',
      idField: 'restaurantId',
      placeId: user.restaurantId || user.restaurant_id,
      bookingType: 'restaurant',
    };
  }
  return {
    table: 'coffee_shops',
    idField: 'coffeeShopId',
    placeId: user.coffeeShopId || user.coffee_shop_id,
    bookingType: 'coffee_shop',
  };
}

// GET /my-restaurant — get the owner's own listing
router.get('/', ...guard, async (req, res) => {
  const ctx = getContext(req.user);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked to this account.' });
  const { rows } = await query(`SELECT * FROM ${ctx.table} WHERE id=$1`, [ctx.placeId]);
  if (!rows.length) return res.status(404).json({ error: 'Listing not found.' });
  res.json(rows[0]);
});

// PUT /my-restaurant — update profile
router.put('/', ...guard, async (req, res) => {
  const ctx = getContext(req.user);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });

  let sql, params;
  if (ctx.table === 'restaurants') {
    const { name, description, location, district, phone, website, openStatus, openHours,
            cuisines, foods, occasion, price, atmosphere, dietary, seating, features, photos } = req.body;
    sql = `UPDATE restaurants SET
             name=$1, description=$2, location=$3, district=$4, phone=$5,
             website=$6, open_status=$7, cuisines=$8, foods=$9,
             occasion=$10, price=$11, atmosphere=$12, dietary=$13, seating=$14,
             features=$15, photos=$16, updated_at=NOW()
           WHERE id=$17 RETURNING *`;
    params = [name, description, location, district, phone, website, openStatus,
              cuisines || [], foods || [], occasion || [], price || 2,
              atmosphere || [], dietary || [], seating || [], features || [], photos || [], ctx.placeId];
  } else {
    const { name, description, location, district, phone, website, openStatus,
            specialties, features, atmosphere, price, photos } = req.body;
    sql = `UPDATE coffee_shops SET
             name=$1, description=$2, location=$3, district=$4, phone=$5,
             website=$6, open_status=$7, specialties=$8, features=$9,
             atmosphere=$10, price=$11, updated_at=NOW()
           WHERE id=$12 RETURNING *`;
    params = [name, description, location, district, phone, website, openStatus,
              specialties || [], features || [], atmosphere || [], price || 2, ctx.placeId];
  }

  const { rows } = await query(sql, params);
  res.json(rows[0]);
});

// GET /my-restaurant/bookings
router.get('/bookings', ...guard, async (req, res) => {
  const ctx = getContext(req.user);
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
  })));
});

// PUT /my-restaurant/bookings/:id/status
router.put('/bookings/:id/status', ...guard, async (req, res) => {
  const ctx = getContext(req.user);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  const { status } = req.body;
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

  await query(
    `UPDATE resto_bookings SET ${updates.join(',')} WHERE id=$${params.length + 1}`,
    [...params, booking.id]
  );

  // Notify the customer
  if (booking.user_id) {
    const msgMap = {
      confirmed: `Your reservation at ${booking.place_name} on ${booking.date} at ${booking.time} is confirmed. See you there!`,
      rejected: `Your reservation at ${booking.place_name} on ${booking.date} at ${booking.time} could not be accommodated.`,
      cancelled: `Your reservation at ${booking.place_name} on ${booking.date} at ${booking.time} was cancelled.`,
    };
    const titleMap = {
      confirmed: `Booking confirmed — ${booking.place_name}`,
      rejected: `Booking declined — ${booking.place_name}`,
      cancelled: `Booking cancelled — ${booking.place_name}`,
    };
    if (msgMap[status]) {
      await query(
        `INSERT INTO notifications (user_id, title, body, type, ref_id)
         VALUES ($1,$2,$3,$4,$5)`,
        [booking.user_id, titleMap[status], msgMap[status],
         status === 'confirmed' ? 'booking_confirmed' : status === 'rejected' ? 'booking_rejected' : 'booking_cancelled',
         booking.id]
      );
    }
  }

  res.json({ ok: true });
});

// Menu routes — restaurants only (coffee shops don't have a menu in this system)
router.get('/menu', ...guard, async (req, res) => {
  const ctx = getContext(req.user);
  if (ctx.table !== 'restaurants') return res.json([]);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  const { rows } = await query(
    'SELECT * FROM restaurant_menu_items WHERE restaurant_id=$1 ORDER BY category, sort_order, name',
    [ctx.placeId]
  );
  res.json(rows);
});

router.post('/menu', ...guard, async (req, res) => {
  const ctx = getContext(req.user);
  if (ctx.table !== 'restaurants') return res.status(400).json({ error: 'Menu is for restaurants only.' });
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  const { category, name, description, price, photoUrl, sortOrder } = req.body;
  if (!name || price == null) return res.status(400).json({ error: 'name and price required.' });
  const { rows } = await query(
    `INSERT INTO restaurant_menu_items (restaurant_id, category, name, description, price, photo_url, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [ctx.placeId, category || 'Main', name, description || '', price, photoUrl || null, sortOrder || 0]
  );
  res.status(201).json(rows[0]);
});

router.put('/menu/:id', ...guard, async (req, res) => {
  const ctx = getContext(req.user);
  if (ctx.table !== 'restaurants') return res.status(400).json({ error: 'Menu is for restaurants only.' });
  const { category, name, description, price, available, photoUrl, sortOrder } = req.body;
  const { rows } = await query(
    `UPDATE restaurant_menu_items
     SET category=$1, name=$2, description=$3, price=$4, available=$5, photo_url=$6, sort_order=$7, updated_at=NOW()
     WHERE id=$8 AND restaurant_id=$9 RETURNING *`,
    [category, name, description, price, available !== false, photoUrl || null, sortOrder ?? 0, req.params.id, ctx.placeId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json(rows[0]);
});

router.delete('/menu/:id', ...guard, async (req, res) => {
  const ctx = getContext(req.user);
  if (ctx.table !== 'restaurants') return res.status(400).json({ error: 'Menu is for restaurants only.' });
  await query('DELETE FROM restaurant_menu_items WHERE id=$1 AND restaurant_id=$2', [req.params.id, ctx.placeId]);
  res.status(204).end();
});

// ── Coffee-shop /menu alias (mirrors cs-menu, used by CoffeeShopOwnerDashboard) ─

router.get('/menu', ...guard, async (req, res) => {
  const ctx = getContext(req.user);
  if (ctx.table !== 'coffee_shops') {
    // For restaurants, fall through to the restaurant menu endpoint already registered above
    // This path is reached only when the same route file is mounted at /my-coffeeshop
    if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
    const { rows } = await query(
      'SELECT * FROM restaurant_menu_items WHERE restaurant_id=$1 ORDER BY category, sort_order, name',
      [ctx.placeId]
    );
    return res.json(rows);
  }
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  const { rows } = await query(
    'SELECT * FROM coffee_shop_menu_items WHERE coffee_shop_id=$1 ORDER BY category, sort_order, name',
    [ctx.placeId]
  );
  res.json(rows.map(r => ({ ...r, brewMethod: r.brew_method, origin: r.origin })));
});

router.post('/menu', ...guard, async (req, res) => {
  const ctx = getContext(req.user);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  const { category, name, description, price, available, brewMethod, origin } = req.body;
  if (!name || price == null) return res.status(400).json({ error: 'name and price required.' });
  if (ctx.table === 'coffee_shops') {
    const { rows } = await query(
      `INSERT INTO coffee_shop_menu_items (coffee_shop_id, category, name, description, price, available, brew_method, origin)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [ctx.placeId, category || 'Espresso drinks', name, description || '', price, available !== false, brewMethod || null, origin || null]
    );
    return res.status(201).json(rows[0]);
  }
  const { rows } = await query(
    `INSERT INTO restaurant_menu_items (restaurant_id, category, name, description, price, available)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [ctx.placeId, category || 'Mains', name, description || '', price, available !== false]
  );
  res.status(201).json(rows[0]);
});

router.put('/menu/:id', ...guard, async (req, res) => {
  const ctx = getContext(req.user);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  const { category, name, description, price, available, brewMethod, origin } = req.body;
  if (ctx.table === 'coffee_shops') {
    const { rows } = await query(
      `UPDATE coffee_shop_menu_items
       SET category=$1, name=$2, description=$3, price=$4, available=$5, brew_method=$6, origin=$7, updated_at=NOW()
       WHERE id=$8 AND coffee_shop_id=$9 RETURNING *`,
      [category, name, description, price, available !== false, brewMethod || null, origin || null, req.params.id, ctx.placeId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found.' });
    return res.json(rows[0]);
  }
  const { rows } = await query(
    `UPDATE restaurant_menu_items
     SET category=$1, name=$2, description=$3, price=$4, available=$5, updated_at=NOW()
     WHERE id=$6 AND restaurant_id=$7 RETURNING *`,
    [category, name, description, price, available !== false, req.params.id, ctx.placeId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json(rows[0]);
});

router.delete('/menu/:id', ...guard, async (req, res) => {
  const ctx = getContext(req.user);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  if (ctx.table === 'coffee_shops') {
    await query('DELETE FROM coffee_shop_menu_items WHERE id=$1 AND coffee_shop_id=$2', [req.params.id, ctx.placeId]);
  } else {
    await query('DELETE FROM restaurant_menu_items WHERE id=$1 AND restaurant_id=$2', [req.params.id, ctx.placeId]);
  }
  res.status(204).end();
});

// ── Reviews ───────────────────────────────────────────────────────────────────

router.get('/reviews', ...guard, async (req, res) => {
  const ctx = getContext(req.user);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  try {
    const { rows } = await query(
      `SELECT r.*, u.name as "guestName"
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.place_id = $1 AND r.place_type = $2
       ORDER BY r.created_at DESC`,
      [ctx.placeId, ctx.bookingType]
    );
    res.json(rows.map(r => ({
      id: r.id, rating: r.rating, text: r.text,
      guestName: r.guestName, date: r.created_at?.toISOString().slice(0,10),
      ownerReply: r.owner_reply,
    })));
  } catch {
    res.json([]);
  }
});

router.post('/reviews/:id/reply', ...guard, async (req, res) => {
  const ctx = getContext(req.user);
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

// ── Orders (pipeline board) ───────────────────────────────────────────────────
// Returns [] until an orders table is added; the dashboard renders an empty state.

router.get('/orders', ...guard, async (req, res) => {
  const ctx = getContext(req.user);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  try {
    const { rows } = await query(
      `SELECT * FROM resto_orders WHERE place_id=$1 AND place_type=$2 ORDER BY created_at DESC LIMIT 100`,
      [ctx.placeId, ctx.bookingType]
    );
    res.json(rows.map(o => ({
      id: o.id, code: o.code, status: o.status,
      total: o.total, items: o.items || [],
      customerPhone: o.customer_phone, address: o.address,
      prepMinutes: o.prep_minutes, createdAt: o.created_at,
    })));
  } catch {
    res.json([]);
  }
});

router.put('/orders/:id/status', ...guard, async (req, res) => {
  const ctx = getContext(req.user);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  const { status, prepMinutes } = req.body;
  const allowed = ['accepted','preparing','ready','delivered','cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  try {
    const updates = ['status=$1', 'updated_at=NOW()'];
    const params = [status];
    if (prepMinutes) { updates.push(`prep_minutes=$${params.length + 1}`); params.push(prepMinutes); }
    await query(
      `UPDATE resto_orders SET ${updates.join(',')} WHERE id=$${params.length + 1} AND place_id=$${params.length + 2}`,
      [...params, req.params.id, ctx.placeId]
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Could not update order.' });
  }
});

// ── Busy-now (coffee shops) ───────────────────────────────────────────────────

router.put('/busy', ...guard, async (req, res) => {
  const ctx = getContext(req.user);
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
  const ctx = getContext(req.user);
  if (ctx.table !== 'coffee_shops') return res.json([]);
  if (!ctx.placeId) return res.status(404).json({ error: 'No listing linked.' });
  const { rows } = await query(
    'SELECT * FROM coffee_shop_menu_items WHERE coffee_shop_id=$1 ORDER BY category, sort_order, name',
    [ctx.placeId]
  );
  res.json(rows);
});

router.post('/cs-menu', ...guard, async (req, res) => {
  const ctx = getContext(req.user);
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
  const ctx = getContext(req.user);
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
  const ctx = getContext(req.user);
  if (ctx.table !== 'coffee_shops') return res.status(400).json({ error: 'CS menu is for coffee shops only.' });
  await query('DELETE FROM coffee_shop_menu_items WHERE id=$1 AND coffee_shop_id=$2', [req.params.id, ctx.placeId]);
  res.status(204).end();
});

module.exports = router;
