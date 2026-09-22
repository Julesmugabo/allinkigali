/**
 * index.js — local dev entry point only. Starts a real listening server
 * around app.js. Vercel's deployment uses api/index.js instead, which
 * exports the same app.js directly without calling .listen() (Vercel
 * manages the listening/routing itself).
 */
const app = require('./app');

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`allinkigali-server listening on http://localhost:${port}`));
