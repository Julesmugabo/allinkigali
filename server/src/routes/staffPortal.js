/**
 * staffPortal.js — Staff Portal API routes
 *
 * Announcements  GET /staff/announcements          all staff
 *                POST /staff/announcements          director only
 *                PATCH /staff/announcements/:id     director only
 *                DELETE /staff/announcements/:id    director only
 *                POST /staff/announcements/:id/read mark as read
 *
 * Documents      GET /staff/documents              all staff (filtered by role)
 *                POST /staff/documents              director only
 *                DELETE /staff/documents/:id        director only
 *
 * Contracts      GET /staff/contracts              own contracts (director: all)
 *                POST /staff/contracts              director only
 *                DELETE /staff/contracts/:id        director only
 *
 * Home           GET /staff/home                   combined summary for the portal home
 */
const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// ─── helpers ────────────────────────────────────────────────────────────────

function annToJson(row) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    visibleTo: row.visible_to || null,
    pinned: row.pinned,
    createdBy: row.created_by,
    createdByName: row.created_by_name || null,
    createdAt: row.created_at,
    isRead: row.is_read || false,
  };
}

function docToJson(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    fileUrl: row.file_url,
    fileType: row.file_type || 'link',
    visibleTo: row.visible_to || null,
    createdBy: row.created_by,
    createdByName: row.created_by_name || null,
    createdAt: row.created_at,
  };
}

function contractToJson(row) {
  return {
    id: row.id,
    userId: row.user_id,
    staffName: row.staff_name || null,
    staffEmail: row.staff_email || null,
    title: row.title,
    description: row.description || '',
    fileUrl: row.file_url,
    validFrom: row.valid_from || null,
    validUntil: row.valid_until || null,
    signedAt: row.signed_at || null,
    createdAt: row.created_at,
  };
}

// ─── announcements ──────────────────────────────────────────────────────────

router.get('/announcements', requireAuth, async (req, res) => {
  const { role, sub: userId } = req.user;

  // Fetch all announcements visible to this user's role (or null = all staff)
  const { rows } = await query(
    `select a.*,
            u.first_name || ' ' || u.last_name as created_by_name,
            (r.user_id is not null) as is_read
     from staff_announcements a
     join users u on u.id = a.created_by
     left join staff_announcement_reads r
       on r.announcement_id = a.id and r.user_id = $1
     where a.visible_to is null or $2 = any(a.visible_to)
     order by a.pinned desc, a.created_at desc`,
    [userId, role]
  );
  res.json(rows.map(annToJson));
});

router.post('/announcements', requireAuth, requireRole('director'), async (req, res) => {
  const { title, body, visibleTo, pinned } = req.body || {};
  if (!title?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'title and body are required.' });
  }
  const { rows } = await query(
    `insert into staff_announcements (title, body, visible_to, pinned, created_by)
     values ($1, $2, $3, $4, $5)
     returning *`,
    [title.trim(), body.trim(), visibleTo || null, !!pinned, req.user.sub]
  );
  res.status(201).json(annToJson(rows[0]));
});

router.patch('/announcements/:id', requireAuth, requireRole('director'), async (req, res) => {
  const { title, body, visibleTo, pinned } = req.body || {};
  const { rows } = await query(
    `update staff_announcements
     set title = coalesce($1, title),
         body = coalesce($2, body),
         visible_to = $3,
         pinned = coalesce($4, pinned)
     where id = $5
     returning *`,
    [title?.trim() || null, body?.trim() || null, visibleTo || null, pinned ?? null, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found.' });
  res.json(annToJson(rows[0]));
});

router.delete('/announcements/:id', requireAuth, requireRole('director'), async (req, res) => {
  await query('delete from staff_announcements where id = $1', [req.params.id]);
  res.status(204).end();
});

router.post('/announcements/:id/read', requireAuth, async (req, res) => {
  await query(
    `insert into staff_announcement_reads (user_id, announcement_id)
     values ($1, $2) on conflict do nothing`,
    [req.user.sub, req.params.id]
  );
  res.status(204).end();
});

// ─── documents ──────────────────────────────────────────────────────────────

router.get('/documents', requireAuth, async (req, res) => {
  const { role } = req.user;
  const { rows } = await query(
    `select d.*, u.first_name || ' ' || u.last_name as created_by_name
     from staff_documents d
     join users u on u.id = d.created_by
     where d.visible_to is null or $1 = any(d.visible_to)
     order by d.created_at desc`,
    [role]
  );
  res.json(rows.map(docToJson));
});

router.post('/documents', requireAuth, requireRole('director'), async (req, res) => {
  const { title, description, fileUrl, fileType, visibleTo } = req.body || {};
  if (!title?.trim() || !fileUrl?.trim()) {
    return res.status(400).json({ error: 'title and fileUrl are required.' });
  }
  const { rows } = await query(
    `insert into staff_documents (title, description, file_url, file_type, visible_to, created_by)
     values ($1, $2, $3, $4, $5, $6)
     returning *`,
    [title.trim(), (description || '').trim(), fileUrl.trim(), fileType || 'link', visibleTo || null, req.user.sub]
  );
  res.status(201).json(docToJson(rows[0]));
});

router.delete('/documents/:id', requireAuth, requireRole('director'), async (req, res) => {
  await query('delete from staff_documents where id = $1', [req.params.id]);
  res.status(204).end();
});

// ─── contracts ──────────────────────────────────────────────────────────────

router.get('/contracts', requireAuth, async (req, res) => {
  const { role, sub: userId } = req.user;
  // Director sees all contracts; others see only their own
  const { rows } = role === 'director'
    ? await query(
        `select c.*,
                u.first_name || ' ' || u.last_name as staff_name,
                u.email as staff_email
         from staff_contracts c
         join users u on u.id = c.user_id
         order by c.created_at desc`
      )
    : await query(
        `select c.*,
                u.first_name || ' ' || u.last_name as staff_name,
                u.email as staff_email
         from staff_contracts c
         join users u on u.id = c.user_id
         where c.user_id = $1
         order by c.created_at desc`,
        [userId]
      );
  res.json(rows.map(contractToJson));
});

router.post('/contracts', requireAuth, requireRole('director'), async (req, res) => {
  const { userId, title, description, fileUrl, validFrom, validUntil } = req.body || {};
  if (!userId || !title?.trim() || !fileUrl?.trim()) {
    return res.status(400).json({ error: 'userId, title and fileUrl are required.' });
  }
  const { rows } = await query(
    `insert into staff_contracts (user_id, title, description, file_url, valid_from, valid_until, created_by)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning *`,
    [userId, title.trim(), (description || '').trim(), fileUrl.trim(), validFrom || null, validUntil || null, req.user.sub]
  );
  res.status(201).json(contractToJson(rows[0]));
});

router.delete('/contracts/:id', requireAuth, requireRole('director'), async (req, res) => {
  await query('delete from staff_contracts where id = $1', [req.params.id]);
  res.status(204).end();
});

// ─── home summary ────────────────────────────────────────────────────────────

router.get('/home', requireAuth, async (req, res) => {
  const { role, sub: userId } = req.user;

  const [annRows, unreadRow, docRows, contractRows] = await Promise.all([
    // Latest 3 announcements visible to this role
    query(
      `select a.id, a.title, a.body, a.pinned, a.created_at,
              u.first_name || ' ' || u.last_name as created_by_name,
              (r.user_id is not null) as is_read
       from staff_announcements a
       join users u on u.id = a.created_by
       left join staff_announcement_reads r
         on r.announcement_id = a.id and r.user_id = $1
       where a.visible_to is null or $2 = any(a.visible_to)
       order by a.pinned desc, a.created_at desc
       limit 3`,
      [userId, role]
    ),
    // Unread count
    query(
      `select count(*) as total
       from staff_announcements a
       where (a.visible_to is null or $2 = any(a.visible_to))
         and not exists (
           select 1 from staff_announcement_reads r
           where r.announcement_id = a.id and r.user_id = $1
         )`,
      [userId, role]
    ),
    // Document count
    query(
      `select count(*) as total from staff_documents
       where visible_to is null or $1 = any(visible_to)`,
      [role]
    ),
    // Contract count
    role === 'director'
      ? query('select count(*) as total from staff_contracts')
      : query('select count(*) as total from staff_contracts where user_id = $1', [userId]),
  ]);

  res.json({
    announcements: annRows.rows.map(annToJson),
    unreadAnnouncements: parseInt(unreadRow.rows[0].total, 10),
    documentCount: parseInt(docRows.rows[0].total, 10),
    contractCount: parseInt(contractRows.rows[0].total, 10),
  });
});

module.exports = router;
