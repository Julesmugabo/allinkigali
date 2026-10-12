const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /notifications — user's notifications, newest first
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,
    [req.user.sub]
  );
  res.json(rows);
});

// GET /notifications/unread-count
router.get('/unread-count', requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT COUNT(*) as count FROM notifications WHERE user_id=$1 AND is_read=false`,
    [req.user.sub]
  );
  res.json({ count: parseInt(rows[0].count, 10) });
});

// PUT /notifications/:id/read
router.put('/:id/read', requireAuth, async (req, res) => {
  await query(
    `UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2`,
    [req.params.id, req.user.sub]
  );
  res.json({ ok: true });
});

// PUT /notifications/read-all
router.put('/read-all', requireAuth, async (req, res) => {
  await query(
    `UPDATE notifications SET is_read=true WHERE user_id=$1`,
    [req.user.sub]
  );
  res.json({ ok: true });
});

module.exports = router;
