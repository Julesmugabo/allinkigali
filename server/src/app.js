/**
 * app.js — the Express app itself, separate from anything that starts a
 * server. Every route file mounts here; nothing outside this file decides
 * what's exposed at the top level. Split out from index.js so the exact
 * same app can be used both for local dev (a real .listen()) and Vercel's
 * serverless functions (which just need the request handler, not a
 * listening server).
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/news', newsRoutes);

// Last-resort handler so a route bug returns JSON, not an HTML stack trace,
// to a client that only ever expects JSON.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong.' });
});

module.exports = app;
