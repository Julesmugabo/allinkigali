const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const requireVerified = require('../middleware/requireVerified');
const requireRole = require('../middleware/requireRole');
const { clientOwnersOnly } = require('../middleware/clientAuth');
const { notifyUser } = require('../pushNotifications');
const { placeOwnerIds } = require('../clients/placeOwners');

const router = express.Router();

// GET /food-orders/delivery-places — restaurants/coffee shops with delivery enabled
router.get('/delivery-places', async (_req, res) => {
  const cols = `id, name, location, district, phone, rating,
            delivery_enabled, delivery_fee, min_order, estimated_time`;
  const [{ rows: restos }, { rows: cafes }] = await Promise.all([
    query(`SELECT ${cols} FROM restaurants WHERE delivery_enabled = true ORDER BY name`),
    query(`SELECT ${cols} FROM coffee_shops WHERE delivery_enabled = true ORDER BY name`),
  ]);
  const restosMapped = restos.map(r => ({ ...r, place_type: 'restaurant', photos: [] }));
  const cafesMapped = cafes.map(r => ({ ...r, place_type: 'coffeeshop', photos: [] }));
  res.json([...restosMapped, ...cafesMapped]);
});

// GET /food-orders/delivery-places/:id/menu
router.get('/delivery-places/:id/menu', async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM restaurant_menu_items WHERE restaurant_id=$1 AND available=true ORDER BY category, name`,
    [req.params.id]
  );
  res.json(rows);
});

// POST /food-orders — place an order
router.post('/', requireAuth, requireVerified, async (req, res) => {
  const { placeId, placeName, placeType, items, subtotal, deliveryFee, total,
          deliveryAddress, deliveryPhone, notes, paymentMethod } = req.body || {};
  if (!placeId || !items?.length || !deliveryAddress || !deliveryPhone) {
    return res.status(400).json({ error: 'placeId, items, deliveryAddress and deliveryPhone are required.' });
  }
  const { rows } = await query(
    `INSERT INTO food_orders
      (user_id, place_id, place_name, place_type, items, subtotal, delivery_fee, total,
       delivery_address, delivery_phone, notes, payment_method)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [req.user.sub, placeId, placeName || '', placeType || 'restaurant',
     JSON.stringify(items), subtotal || 0, deliveryFee || 0, total || 0,
     deliveryAddress.trim(), deliveryPhone.trim(), notes?.trim() || '', paymentMethod || 'cash']
  );
  const order = rows[0];

  // Notify the place's owners and managers
  for (const ownerId of await placeOwnerIds(placeType, placeId)) {
    notifyUser(ownerId, {
      title: 'New delivery order!',
      body: `Order #${order.id.slice(-6).toUpperCase()} — ${items.length} item(s) to ${deliveryAddress}`,
      data: { type: 'new_order', orderId: order.id },
    }).catch(() => {});
  }

  res.status(201).json(order);
});

// GET /food-orders/my — customer's own orders
router.get('/my', requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM food_orders WHERE user_id=$1 ORDER BY created_at DESC`,
    [req.user.sub]
  );
  res.json(rows);
});

// PUT /food-orders/:id/cancel — customer cancels
router.put('/:id/cancel', requireAuth, async (req, res) => {
  const { rows } = await query(
    `UPDATE food_orders SET status='cancelled', updated_at=NOW()
     WHERE id=$1 AND user_id=$2 AND status IN ('pending','confirmed')
     RETURNING *`,
    [req.params.id, req.user.sub]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Order not found or cannot be cancelled.' });
  res.json(rows[0]);
});

// Restaurant owner views their orders
router.get('/restaurant-orders', requireAuth, requireRole('restaurant', 'coffeeshop', 'director'), clientOwnersOnly, async (req, res) => {
  const restaurantId = req.user.restaurantId || req.user.restaurant_id;
  if (!restaurantId) return res.status(400).json({ error: 'No restaurant linked to account.' });
  const { rows } = await query(
    `SELECT fo.*, u.first_name, u.last_name, u.email as customer_email
     FROM food_orders fo
     LEFT JOIN users u ON fo.user_id = u.id
     WHERE fo.place_id=$1 ORDER BY fo.created_at DESC`,
    [restaurantId]
  );
  res.json(rows);
});

// Restaurant owner updates order status
router.put('/:id/status', requireAuth, requireRole('restaurant', 'coffeeshop', 'director'), clientOwnersOnly, async (req, res) => {
  const { status } = req.body || {};
  const allowed = ['confirmed','preparing','ready','delivered','cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  const restaurantId = req.user.restaurantId || req.user.restaurant_id;
  const { rows } = await query(
    `UPDATE food_orders SET status=$1, updated_at=NOW()
     WHERE id=$2 AND place_id=$3 RETURNING *`,
    [status, req.params.id, restaurantId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Order not found.' });

  // Notify customer
  const msgMap = {
    confirmed: 'Your order has been confirmed and will be prepared shortly.',
    preparing: 'Your order is being prepared!',
    ready: 'Your order is ready and on the way!',
    delivered: 'Your order has been delivered. Enjoy!',
    cancelled: 'Your order was cancelled by the restaurant. Please contact them for details.',
  };
  const title = `Order ${status}`;
  const body = msgMap[status] || `Your order status: ${status}`;
  notifyUser(rows[0].user_id, { title, body, data: { type: 'order_update', orderId: rows[0].id } }).catch(() => {});

  res.json(rows[0]);
});

module.exports = router;
