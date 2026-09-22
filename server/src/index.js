/**
 * index.js — the Express app entry point. Every route file mounts here;
 * nothing outside this file decides what's exposed at the top level.
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

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`allinkigali-server listening on http://localhost:${port}`));
