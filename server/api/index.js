/**
 * api/index.js — the Vercel serverless entry point. Just re-exports the
 * same Express app every local request already goes through (src/app.js);
 * Vercel's Node runtime treats an exported Express app as a request
 * handler directly, no .listen() needed or wanted here.
 */
module.exports = require('../src/app');
