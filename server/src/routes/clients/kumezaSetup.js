/**
 * clients/kumezaSetup.js — Ku Meza ▸ Tables & QR (owners and managers).
 *   GET    /clients/kumeza/setup               sections and tables (with QR token and code)
 *   POST   /clients/kumeza/sections            { name }
 *   PATCH  /clients/kumeza/sections/:id        { name }
 *   DELETE /clients/kumeza/sections/:id
 *   POST   /clients/kumeza/tables              { label, sectionId } or { count, sectionId } for several
 *   PATCH  /clients/kumeza/tables/:id          { label, sectionId, active }
 *   POST   /clients/kumeza/tables/:id/rotate   new QR token + code; the old printed card stops working
 */
const express = require('express');
const { query } = require('../../db');
const { requireClient } = require('../../middleware/clientAuth');
const { newQrToken, newShortCode } = require('../../kumeza/rules');

const router = express.Router();
const owners = requireClient('owner', 'manager');
const dining = (req, res, next) => (['restaurant', 'coffeeshop'].includes(req.client.placeType) ? next() : res.status(404).json({ error: 'Ku Meza is for restaurants and coffee shops.' }));
const guard = [...owners, dining];
const scope = (req) => [req.client.placeType, req.client.placeId];
const tableJson = (t) => ({ id: t.id, label: t.label, sectionId: t.section_id, qrToken: t.qr_token, shortCode: t.short_code, active: t.active });

router.get('/setup', guard, async (req, res) => {
  const [{ rows: sections }, { rows: tables }] = await Promise.all([
    query('select id, name, sort_order from place_sections where place_type = $1 and place_id = $2 order by sort_order, name', scope(req)),
    query('select * from place_tables where place_type = $1 and place_id = $2 order by active desc, created_at', scope(req)),
  ]);
  res.json({ sections: sections.map((s) => ({ id: s.id, name: s.name })), tables: tables.map(tableJson) });
});

router.post('/sections', guard, async (req, res) => {
  const name = String(req.body?.name || '').trim().slice(0, 40);
  if (!name) return res.status(400).json({ error: 'Name the section, e.g. "Terrace".' });
  const { rows: [s] } = await query(
    `insert into place_sections (place_type, place_id, name, sort_order)
     values ($1, $2, $3, (select coalesce(max(sort_order), 0) + 1 from place_sections where place_type = $1 and place_id = $2)) returning id, name`,
    [...scope(req), name]);
  res.status(201).json(s);
});

router.patch('/sections/:id', guard, async (req, res) => {
  const name = String(req.body?.name || '').trim().slice(0, 40);
  if (!name) return res.status(400).json({ error: 'Name the section.' });
  const { rows: [s] } = await query('update place_sections set name = $1 where id = $2 and place_type = $3 and place_id = $4 returning id, name',
    [name, req.params.id, ...scope(req)]);
  return s ? res.json(s) : res.status(404).json({ error: 'Not found.' });
});

router.delete('/sections/:id', guard, async (req, res) => {
  await query('delete from place_sections where id = $1 and place_type = $2 and place_id = $3', [req.params.id, ...scope(req)]);
  res.status(204).end();
});

// Inserts a table with a fresh token and code (retries on the rare clash).
async function createTable(req, label, sectionId) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const { rows: [t] } = await query(
        `insert into place_tables (place_type, place_id, section_id, label, qr_token, short_code)
         values ($1, $2, $3, $4, $5, $6) returning *`, [...scope(req), sectionId || null, label, newQrToken(), newShortCode()]);
      return t;
    } catch (e) { if (e.code !== '23505') throw e; }
  }
  throw new Error('Could not create a unique table code. Try again.');
}

router.post('/tables', guard, async (req, res) => {
  const { sectionId } = req.body || {};
  const count = Math.min(parseInt(req.body?.count, 10) || 0, 50);
  if (count > 0) {
    const { rows: [{ n }] } = await query('select count(*)::int as n from place_tables where place_type = $1 and place_id = $2', scope(req));
    const made = [];
    for (let i = 1; i <= count; i++) made.push(tableJson(await createTable(req, `Table ${n + i}`, sectionId)));
    return res.status(201).json(made);
  }
  const label = String(req.body?.label || '').trim().slice(0, 30);
  if (!label) return res.status(400).json({ error: 'Name the table, e.g. "Table 4" or "Terrace 2".' });
  res.status(201).json([tableJson(await createTable(req, label, sectionId))]);
});

router.patch('/tables/:id', guard, async (req, res) => {
  const b = req.body || {};
  const sets = []; const vals = [];
  const put = (col, v) => { vals.push(v); sets.push(`${col} = $${vals.length}`); };
  if (b.label !== undefined) put('label', String(b.label).trim().slice(0, 30));
  if (b.sectionId !== undefined) put('section_id', b.sectionId || null);
  if (b.active !== undefined) put('active', !!b.active);
  if (!sets.length) return res.status(400).json({ error: 'Nothing to change.' });
  vals.push(req.params.id, ...scope(req));
  const n = vals.length;
  const { rows: [t] } = await query(`update place_tables set ${sets.join(', ')} where id = $${n - 2} and place_type = $${n - 1} and place_id = $${n} returning *`, vals);
  return t ? res.json(tableJson(t)) : res.status(404).json({ error: 'Not found.' });
});

router.post('/tables/:id/rotate', guard, async (req, res) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const { rows: [t] } = await query(
        'update place_tables set qr_token = $1, short_code = $2 where id = $3 and place_type = $4 and place_id = $5 returning *',
        [newQrToken(), newShortCode(), req.params.id, ...scope(req)]);
      return t ? res.json(tableJson(t)) : res.status(404).json({ error: 'Not found.' });
    } catch (e) { if (e.code !== '23505') throw e; }
  }
  return res.status(500).json({ error: 'Try again.' });
});

module.exports = router;
