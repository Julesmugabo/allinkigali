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
// Must be required right after express, before any routes: patches Express
// so a rejected async route handler reaches the error middleware below
// instead of escaping as an unhandled rejection — which, on Node 24+,
// crashes the whole process (this is a real bug we hit: a single bad
// request took the entire server down for every user, not just that one
// request). Express 4 doesn't catch async errors on its own; Express 5
// does, but we're not on it.
require('express-async-errors');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const businessesRoutes = require('./routes/businesses');
const bookingsRoutes = require('./routes/bookings');
const ordersRoutes = require('./routes/orders');
const adsRoutes = require('./routes/ads');
const fliersRoutes = require('./routes/fliers');
const adminRoutes    = require('./routes/admin');
const landRoutes     = require('./routes/land');
const propertiesRoutes = require('./routes/properties');
const productsRoutes = require('./routes/products');
const uploadRoutes      = require('./routes/upload');
const restaurantsRoutes   = require('./routes/restaurants');
const coffeeShopsRoutes   = require('./routes/coffeeShops');
const restoBookingsRoutes = require('./routes/restoBookings');
const notificationsRoutes = require('./routes/notifications');
const restaurantMenuRoutes = require('./routes/restaurantMenu');
const myRestaurantRoutes  = require('./routes/myRestaurant');
const pendingListingsRoutes = require('./routes/pendingListings');
const foodOrdersRoutes    = require('./routes/foodOrders');
const weddingVenuesRoutes = require('./routes/weddingVenues');
const financeRoutes       = require('./routes/finance');

const app = express();
app.use(cors({
  origin: [
    'https://allinkigali.vercel.app',
    'https://admin.allinkigali.com',
    'https://admin.allinkigali.rw',
    /\.vercel\.app$/,
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:19006',
  ],
  credentials: true,
}));
app.use(express.json());

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/news', newsRoutes);
app.use('/businesses', businessesRoutes);
app.use('/bookings', bookingsRoutes);
app.use('/orders', ordersRoutes);
app.use('/ads', adsRoutes);
app.use('/fliers', fliersRoutes);
app.use('/admin',      adminRoutes);
app.use('/land',       landRoutes);
app.use('/properties', propertiesRoutes);
app.use('/products',   productsRoutes);
app.use('/upload',       uploadRoutes);
app.use('/restaurants',    restaurantsRoutes);
app.use('/coffee-shops',  coffeeShopsRoutes);
app.use('/resto-bookings', restoBookingsRoutes);
app.use('/notifications',  notificationsRoutes);
app.use('/restaurant-menu', restaurantMenuRoutes);
app.use('/my-restaurant',  myRestaurantRoutes);
app.use('/my-coffeeshop',  myRestaurantRoutes); // same handler, getContext() routes by role
app.use('/pending-listings', pendingListingsRoutes);
app.use('/food-orders',    foodOrdersRoutes);
app.use('/wedding-venues', weddingVenuesRoutes);
app.use('/finance',        financeRoutes);

// Last-resort handler so a route bug returns JSON, not an HTML stack trace,
// to a client that only ever expects JSON.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong.' });
});

module.exports = app;
