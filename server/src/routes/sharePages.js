/**
 * sharePages.js — the website pages that people share, served with their
 * own preview (title, words, picture). nginx sends these paths here:
 *   /news/article/:id        a news article
 *   /shop/restaurant/:id     a restaurant
 *   /shop/coffee-shop/:id    a café
 * Anything unknown still gets the normal page, so the site always opens.
 */
const express = require('express');
const { query } = require('../db');
const { renderPage, plainPage, summary } = require('../services/sharePreview');

const router = express.Router();

const UUIDISH = /^[0-9a-zA-Z-]{1,64}$/;

function send(res, html) {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', 'no-cache');
  res.send(html);
}

// Looks a thing up and renders its preview; falls back to the plain page.
function page(find) {
  return async (req, res) => {
    try {
      const meta = UUIDISH.test(req.params.id) ? await find(req.params.id) : null;
      send(res, meta ? renderPage({ ...meta, path: req.path }) : plainPage());
    } catch (err) {
      console.error('share page:', err.message);
      try { send(res, plainPage()); } catch { res.status(502).end(); }
    }
  };
}

router.get('/news/article/:id', page(async (id) => {
  const { rows } = await query(
    `select title, body, image_url, og_image, meta_description from news_articles
      where id::text = $1 and status = 'published' and not is_archived`,
    [id]
  );
  const a = rows[0];
  if (!a) return null;
  return {
    type: 'article',
    title: a.title,
    description: a.meta_description || summary(a.body) || 'Amakuru kuri allinkigali',
    image: a.og_image || a.image_url,
  };
}));

// Restaurants and cafés: name, a line about them, and their first photo.
function place(table, photos, fk, kind) {
  return async (id) => {
    const { rows } = await query(`select name, description, location, district from ${table} where id::text = $1`, [id]);
    const p = rows[0];
    if (!p) return null;
    const { rows: pics } = await query(`select url from ${photos} where ${fk}::text = $1 order by sort_order asc limit 1`, [id]);
    const where = [p.location, p.district].filter(Boolean).join(', ');
    return {
      title: p.name,
      description: summary(p.description) || `${kind}${where ? ` · ${where}` : ''} — book a table on allinkigali`,
      image: pics[0]?.url,
    };
  };
}

router.get('/shop/restaurant/:id', page(place('restaurants', 'restaurant_photos', 'restaurant_id', 'Restaurant')));
router.get('/shop/coffee-shop/:id', page(place('coffee_shops', 'coffee_shop_photos', 'coffee_shop_id', 'Café')));

module.exports = router;
