/**
 * upload.js — POST /upload
 * Receives a file (multipart/form-data, field name "file") and returns { url }.
 *
 * Primary: Vercel Blob (needs BLOB_READ_WRITE_TOKEN).
 * Fallback: stores the file on disk under /uploads/ (works on Contabo/any VPS).
 */
const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { requireAuth } = require('../middleware/auth');

const router  = express.Router();
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  const ext = req.file.originalname.split('.').pop() || 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  // Try Vercel Blob first
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = require('@vercel/blob');
    const blob = await put(`listings/${filename}`, req.file.buffer, {
      access: 'public',
      contentType: req.file.mimetype,
    });
    return res.json({ url: blob.url });
  }

  // Fallback: save to disk (Contabo/VPS)
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const filePath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(filePath, req.file.buffer);

  // Build the public URL from the request
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const url = `${protocol}://${host}/uploads/${filename}`;
  res.json({ url });
});

module.exports = router;
