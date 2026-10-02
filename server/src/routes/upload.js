/**
 * upload.js — POST /upload
 * Receives a file (multipart/form-data, field name "file"), stores it in
 * Vercel Blob, and returns { url } — a permanent public URL ready to paste
 * into the photos JSONB array on any listing.
 *
 * Requires BLOB_READ_WRITE_TOKEN in the environment (set it in the Vercel
 * dashboard under the server project → Settings → Environment Variables).
 */
const express = require('express');
const multer  = require('multer');
const { put } = require('@vercel/blob');
const { requireAuth } = require('../middleware/auth');

const router  = express.Router();
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  const ext      = req.file.originalname.split('.').pop() || 'jpg';
  const filename = `listings/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const blob = await put(filename, req.file.buffer, {
    access: 'public',
    contentType: req.file.mimetype,
  });

  res.json({ url: blob.url });
});

module.exports = router;
