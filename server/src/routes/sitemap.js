/**
 * sitemap.js — https://allinkigali.rw/sitemap.xml, the list of pages Google
 * reads to find the whole site: the main sections, every published article,
 * and every restaurant, café and wedding venue. Built from the database on
 * each request, so new articles and places appear by themselves.
 * nginx sends /sitemap.xml here; robots.txt points Google to it.
 */
const express = require('express');
const { query } = require('../db');

const router = express.Router();
const SITE = (process.env.WEB_SITE_URL || 'https://allinkigali.rw').replace(/\/$/, '');

const SECTIONS = ['/', '/news/articles', '/shop', '/shop/restaurants', '/shop/coffee-shops', '/shop/order-food', '/shop/wedding-venues'];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

function entry(path, lastmod) {
  return `  <url><loc>${esc(SITE + path)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
}

router.get('/sitemap.xml', async (_req, res) => {
  const [articles, restaurants, cafes, venues] = await Promise.all([
    query(`select id, published_at from news_articles where status = 'published' and not is_archived order by published_at desc`),
    query('select id, updated_at from restaurants where is_active = true'),
    query('select id, updated_at from coffee_shops where is_active = true'),
    query('select id, updated_at from wedding_venues'),
  ]);
  const urls = [
    ...SECTIONS.map((p) => entry(p)),
    ...articles.rows.map((a) => entry(`/news/article/${a.id}`, day(a.published_at))),
    ...restaurants.rows.map((r) => entry(`/shop/restaurant/${r.id}`, day(r.updated_at))),
    ...cafes.rows.map((c) => entry(`/shop/coffee-shop/${c.id}`, day(c.updated_at))),
    ...venues.rows.map((v) => entry(`/shop/wedding-venue/${v.id}`, day(v.updated_at))),
  ];
  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
});

module.exports = router;
