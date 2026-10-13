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
    cuisines: row.cuisines || [],
    foods: row.foods || [],
    occasion: row.occasion || [],
    price: row.price,
    atmosphere: row.atmosphere || [],
    dietary: row.dietary || [],
    seating: row.seating || [],
    features: row.features || [],
    rating: row.rating ? Number(row.rating) : 4.0,
    lat: row.lat ? Number(row.lat) : null,
    lng: row.lng ? Number(row.lng) : null,
    openStatus: row.open_status,
    isActive: row.is_active,
    createdAt: row.created_at,
    photos: photos.map((p) => ({ id: p.id, url: p.url, label: p.label, sortOrder: p.sort_order })),
  };
}

// GET /restaurants — list all active restaurants
router.get('/', async (_req, res) => {
  const { rows } = await query(
    'SELECT * FROM restaurants WHERE is_active = true ORDER BY name ASC'
  );
  const ids = rows.map((r) => r.id);
  let photos = [];
  if (ids.length) {
    const { rows: pRows } = await query(
      'SELECT * FROM restaurant_photos WHERE restaurant_id = ANY($1) ORDER BY sort_order ASC',
      [ids]
    );
    photos = pRows;
  }
  const photosByRestaurant = {};
  photos.forEach((p) => {
    if (!photosByRestaurant[p.restaurant_id]) photosByRestaurant[p.restaurant_id] = [];
    photosByRestaurant[p.restaurant_id].push(p);
  });
  res.json(rows.map((r) => toJson(r, photosByRestaurant[r.id] || [])));
});

// GET /restaurants/:id
router.get('/:id', async (req, res) => {
  const { rows } = await query('SELECT * FROM restaurants WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  const { rows: photos } = await query(
    'SELECT * FROM restaurant_photos WHERE restaurant_id = $1 ORDER BY sort_order ASC',
    [req.params.id]
  );
  res.json(toJson(rows[0], photos));
});

// POST /restaurants — admin only
router.post('/', requireAuth, requireRole('sellers'), async (req, res) => {
  const {
    name, description, location, district, phone, website,
    cuisines, foods, occasion, price, atmosphere, dietary,
    seating, features, rating, lat, lng, openStatus, photos,
  } = req.body;
  const { rows } = await query(
    `INSERT INTO restaurants
      (name, description, location, district, phone, website,
       cuisines, foods, occasion, price, atmosphere, dietary,
       seating, features, rating, lat, lng, open_status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     RETURNING *`,
    [name, description, location, district, phone, website,
     cuisines || [], foods || [], occasion || [], price || 2,
     atmosphere || [], dietary || [], seating || [], features || [],
     rating || 4.0, lat, lng, openStatus || 'Open now']
  );
  const restaurant = rows[0];
  if (photos?.length) {
    for (let i = 0; i < photos.length; i++) {
      await query(
        'INSERT INTO restaurant_photos (restaurant_id, url, label, sort_order) VALUES ($1,$2,$3,$4)',
        [restaurant.id, photos[i].url, photos[i].label || '', i]
      );
    }
  }
  const { rows: pRows } = await query(
    'SELECT * FROM restaurant_photos WHERE restaurant_id = $1 ORDER BY sort_order ASC',
    [restaurant.id]
  );
  res.status(201).json(toJson(restaurant, pRows));
});

// PUT /restaurants/:id — admin only
router.put('/:id', requireAuth, requireRole('sellers'), async (req, res) => {
  const {
    name, description, location, district, phone, website,
    cuisines, foods, occasion, price, atmosphere, dietary,
    seating, features, rating, lat, lng, openStatus, isActive, photos,
  } = req.body;
  const { rows } = await query(
    `UPDATE restaurants SET
      name=$1, description=$2, location=$3, district=$4, phone=$5, website=$6,
      cuisines=$7, foods=$8, occasion=$9, price=$10, atmosphere=$11, dietary=$12,
      seating=$13, features=$14, rating=$15, lat=$16, lng=$17, open_status=$18,
      is_active=$19, updated_at=NOW()
     WHERE id=$20 RETURNING *`,
    [name, description, location, district, phone, website,
     cuisines || [], foods || [], occasion || [], price || 2,
     atmosphere || [], dietary || [], seating || [], features || [],
     rating || 4.0, lat, lng, openStatus || 'Open now',
     isActive !== false, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  if (photos) {
    await query('DELETE FROM restaurant_photos WHERE restaurant_id = $1', [req.params.id]);
    for (let i = 0; i < photos.length; i++) {
      await query(
        'INSERT INTO restaurant_photos (restaurant_id, url, label, sort_order) VALUES ($1,$2,$3,$4)',
        [req.params.id, photos[i].url, photos[i].label || '', i]
      );
    }
  }
  const { rows: pRows } = await query(
    'SELECT * FROM restaurant_photos WHERE restaurant_id = $1 ORDER BY sort_order ASC',
    [req.params.id]
  );
  res.json(toJson(rows[0], pRows));
});

// DELETE /restaurants/:id — admin only
router.delete('/:id', requireAuth, requireRole('sellers'), async (req, res) => {
  await query('DELETE FROM restaurants WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
