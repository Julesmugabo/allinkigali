const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

function toJson(row) {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    category: row.category,
    name: row.name,
    description: row.description,
    price: row.price,
    photo_url: row.photo_url || null,
    available: row.available,
    sortOrder: row.sort_order,
  };
}

// GET /restaurant-menu/:restaurantId — public
router.get('/:restaurantId', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM restaurant_menu_items
       WHERE restaurant_id = $1
       ORDER BY category, sort_order, name`,
      [req.params.restaurantId]
    );
    res.json(rows.map(toJson));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /restaurant-menu — admin only
router.post('/', requireAuth, requireRole(['restaurant', 'director']), async (req, res) => {
  const { restaurantId, category, name, description, price, sortOrder } = req.body;
  if (!restaurantId || !name || price == null) return res.status(400).json({ error: 'restaurantId, name and price required' });
  try {
    const { rows } = await query(
      `INSERT INTO restaurant_menu_items (restaurant_id, category, name, description, price, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [restaurantId, category || 'Main', name, description || '', price, sortOrder || 0]
    );
    res.status(201).json(toJson(rows[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /restaurant-menu/:id — admin only
router.put('/:id', requireAuth, requireRole(['restaurant', 'director']), async (req, res) => {
  const { category, name, description, price, available, sortOrder } = req.body;
  try {
    const { rows } = await query(
      `UPDATE restaurant_menu_items
       SET category=$1, name=$2, description=$3, price=$4, available=$5, sort_order=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [category, name, description, price, available !== false, sortOrder ?? 0, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(toJson(rows[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /restaurant-menu/:id — admin only
router.delete('/:id', requireAuth, requireRole(['restaurant', 'director']), async (req, res) => {
  try {
    await query('DELETE FROM restaurant_menu_items WHERE id=$1', [req.params.id]);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /restaurant-menu/coffee-shop/:id — public, returns coffee shop menu items
router.get('/coffee-shop/:id', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM coffee_shop_menu_items WHERE coffee_shop_id=$1 AND available=TRUE ORDER BY category, sort_order, name`,
      [req.params.id]
    );
    res.json(rows.map(row => ({
      id: row.id, coffeeShopId: row.coffee_shop_id,
      category: row.category, name: row.name,
      description: row.description, price: row.price,
      photo_url: row.photo_url || null,
      available: row.available, sortOrder: row.sort_order,
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
