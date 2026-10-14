/**
 * clients/index.js — everything under /clients: the client dashboard's own
 * API (allinclients.allinkigali.rw). One file per part.
 */
const express = require('express');

const router = express.Router();
router.use('/auth', require('./auth'));
router.use('/support', require('./support'));
router.use('/team', require('./team'));
router.use('/venue', require('./venue'));
router.use('/kumeza', require('./kumezaSetup'));
router.use('/kumeza', require('./kumezaService'));
router.use('/sales', require('./sales'));
router.use('/admin', require('./admin')); // the Staff Portal's side

module.exports = router;
