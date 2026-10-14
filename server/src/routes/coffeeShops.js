const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

function toJson(row, photos = []) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    location: row.location,
    district: row.district,
    phone: row.phone,
    website: row.website,
    coffeeTypes: row.coffee_types || [],
    brewingMethods: row.brewing_methods || [],
    origins: row.origins || [],
    food: row.food || [],
    atmosphere: row.atmosphere || [],
    facilities: row.facilities || [],
    seating: row.seating || [],
    attributes: row.attributes || [],
    services: row.services || [],
    price: row.price,
    rating: row.rating ? Number(row.rating) : 4.0,
    openStatus: row.open_status,
    busyNow: row.busy_now || null,
    deliveryEnabled: !!row.delivery_enabled,
    lat: row.lat ? Number(row.lat) : null,
    lng: row.lng ? Number(row.lng) : null,
    isActive: row.is_active,
    createdAt: row.created_at,
    photos: photos.map((p) => ({ id: p.id, url: p.url, label: p.label, sortOrder: p.sort_order })),
  };
}

// GET /coffee-shops
router.get('/', async (_req, res) => {
  const { rows } = await query(
    'SELECT * FROM coffee_shops WHERE is_active = true ORDER BY name ASC'
  );
  const ids = rows.map((r) => r.id);
  let photos = [];
  if (ids.length) {
    const { rows: pRows } = await query(
      'SELECT * FROM coffee_shop_photos WHERE coffee_shop_id = ANY($1) ORDER BY sort_order ASC',
      [ids]
    );
    photos = pRows;
  }
  const photosByShop = {};
  photos.forEach((p) => {
    if (!photosByShop[p.coffee_shop_id]) photosByShop[p.coffee_shop_id] = [];
    photosByShop[p.coffee_shop_id].push(p);
  });
  res.json(rows.map((r) => toJson(r, photosByShop[r.id] || [])));
});

// GET /coffee-shops/:id
router.get('/:id', async (req, res) => {
  const { rows } = await query('SELECT * FROM coffee_shops WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  const { rows: photos } = await query(
    'SELECT * FROM coffee_shop_photos WHERE coffee_shop_id = $1 ORDER BY sort_order ASC',
    [req.params.id]
  );
  res.json(toJson(rows[0], photos));
});

// POST /coffee-shops — admin only
router.post('/', requireAuth, requireRole('sellers'), async (req, res) => {
  const {
    name, description, location, district, phone, website,
    coffeeTypes, brewingMethods, origins, food, atmosphere,
    facilities, seating, attributes, services, price, rating,
    openStatus, lat, lng, photos,
  } = req.body;
  const { rows } = await query(
    `INSERT INTO coffee_shops
      (name, description, location, district, phone, website,
       coffee_types, brewing_methods, origins, food, atmosphere,
       facilities, seating, attributes, services, price, rating,
       open_status, lat, lng)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
     RETURNING *`,
    [name, description, location, district, phone, website,
     coffeeTypes || [], brewingMethods || [], origins || [],
     food || [], atmosphere || [], facilities || [], seating || [],
     attributes || [], services || [], price || 2, rating || 4.0,
     openStatus || 'Open now', lat, lng]
  );
  const shop = rows[0];
  if (photos?.length) {
    for (let i = 0; i < photos.length; i++) {
      await query(
        'INSERT INTO coffee_shop_photos (coffee_shop_id, url, label, sort_order) VALUES ($1,$2,$3,$4)',
        [shop.id, photos[i].url, photos[i].label || '', i]
      );
    }
  }
  const { rows: pRows } = await query(
    'SELECT * FROM coffee_shop_photos WHERE coffee_shop_id = $1 ORDER BY sort_order ASC',
    [shop.id]
  );
  res.status(201).json(toJson(shop, pRows));
});

// PUT /coffee-shops/:id — admin only
router.put('/:id', requireAuth, requireRole('sellers'), async (req, res) => {
  const {
    name, description, location, district, phone, website,
    coffeeTypes, brewingMethods, origins, food, atmosphere,
    facilities, seating, attributes, services, price, rating,
    openStatus, lat, lng, isActive, photos,
  } = req.body;
  const { rows } = await query(
    `UPDATE coffee_shops SET
      name=$1, description=$2, location=$3, district=$4, phone=$5, website=$6,
      coffee_types=$7, brewing_methods=$8, origins=$9, food=$10, atmosphere=$11,
      facilities=$12, seating=$13, attributes=$14, services=$15, price=$16,
      rating=$17, open_status=$18, lat=$19, lng=$20, is_active=$21, updated_at=NOW()
     WHERE id=$22 RETURNING *`,
    [name, description, location, district, phone, website,
     coffeeTypes || [], brewingMethods || [], origins || [],
     food || [], atmosphere || [], facilities || [], seating || [],
     attributes || [], services || [], price || 2, rating || 4.0,
     openStatus || 'Open now', lat, lng, isActive !== false, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  if (photos) {
    await query('DELETE FROM coffee_shop_photos WHERE coffee_shop_id = $1', [req.params.id]);
    for (let i = 0; i < photos.length; i++) {
      await query(
        'INSERT INTO coffee_shop_photos (coffee_shop_id, url, label, sort_order) VALUES ($1,$2,$3,$4)',
        [req.params.id, photos[i].url, photos[i].label || '', i]
      );
    }
  }
  const { rows: pRows } = await query(
    'SELECT * FROM coffee_shop_photos WHERE coffee_shop_id = $1 ORDER BY sort_order ASC',
    [req.params.id]
  );
  res.json(toJson(rows[0], pRows));
});

// DELETE /coffee-shops/:id — admin only
router.delete('/:id', requireAuth, requireRole('sellers'), async (req, res) => {
  await query('DELETE FROM coffee_shops WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
