const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { linkOwner } = require('../clients/placeOwners');

const router = express.Router();

// GET /wedding-venues — public list
router.get('/', async (_req, res) => {
  try {
    const { rows } = await query('SELECT * FROM wedding_venues ORDER BY rating DESC, name');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /wedding-venues/:id — public single
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM wedding_venues WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /wedding-venues/:id — admin: update open_status, owner_user_id
router.patch('/:id', requireAuth, requireRole('director', 'sellers'), async (req, res) => {
  const { openStatus, ownerUserId } = req.body;
  try {
    const sets = ['updated_at=NOW()'];
    const params = [];
    if (openStatus !== undefined) { params.push(openStatus); sets.push(`open_status=$${params.length}`); }
    if (ownerUserId !== undefined) { params.push(ownerUserId); sets.push(`owner_user_id=$${params.length}`); }
    params.push(req.params.id);
    await query(`UPDATE wedding_venues SET ${sets.join(',')} WHERE id=$${params.length}`, params);
    // The venue's owner signs in at the client dashboard with that account.
    if (ownerUserId) await linkOwner('wedding', req.params.id, ownerUserId, 'allinkigali');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
