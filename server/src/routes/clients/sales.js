/**
 * clients/sales.js — the client's own sales report (their money, not
 * allinkigali's): dine-in takings from closed Ku Meza tables plus delivered
 * Order Food orders, per day (Kigali time), by payment method and by staff.
 *   GET /clients/sales?days=30     owners, managers, cashiers
 */
const express = require('express');
const { query } = require('../../db');
const { requireClient } = require('../../middleware/clientAuth');

const router = express.Router();
const TZ = 'Africa/Kigali';

router.get('/', requireClient('owner', 'manager', 'cashier'), async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 366);
  const { placeType, placeId } = req.client;
  const since = `now() - interval '${days} days'`;
  const [dine, delivery, methods, staff] = await Promise.all([
    query(`select to_char(closed_at at time zone '${TZ}', 'YYYY-MM-DD') as day, sum(total)::int as total, count(*)::int as n
           from table_sessions where place_type = $1 and place_id = $2 and status = 'closed' and closed_at > ${since} group by 1`, [placeType, placeId]),
    query(`select to_char(created_at at time zone '${TZ}', 'YYYY-MM-DD') as day, sum(subtotal)::int as total, count(*)::int as n
           from food_orders where place_id = $1 and status = 'delivered' and created_at > ${since} group by 1`, [placeId]),
    query(`select coalesce(payment_method, 'cash') as method, sum(total)::int as total, count(*)::int as n
           from table_sessions where place_type = $1 and place_id = $2 and status = 'closed' and closed_at > ${since} group by 1`, [placeType, placeId]),
    query(`select closed_by as name, sum(total)::int as total, count(*)::int as n
           from table_sessions where place_type = $1 and place_id = $2 and status = 'closed' and closed_at > ${since}
           group by 1 order by 2 desc`, [placeType, placeId]),
  ]);
  const byDay = new Map();
  const row = (d) => byDay.get(d) || byDay.set(d, { date: d, dineIn: 0, tables: 0, delivery: 0, deliveryOrders: 0 }).get(d);
  dine.rows.forEach((r) => Object.assign(row(r.day), { dineIn: r.total, tables: r.n }));
  delivery.rows.forEach((r) => Object.assign(row(r.day), { delivery: r.total, deliveryOrders: r.n }));
  const list = [...byDay.values()].sort((a, b) => b.date.localeCompare(a.date));
  res.json({
    days,
    totals: {
      dineIn: list.reduce((s, d) => s + d.dineIn, 0), tables: list.reduce((s, d) => s + d.tables, 0),
      delivery: list.reduce((s, d) => s + d.delivery, 0), deliveryOrders: list.reduce((s, d) => s + d.deliveryOrders, 0),
    },
    byDay: list,
    byMethod: methods.rows.map((r) => ({ method: r.method, total: r.total, tables: r.n })),
    byStaff: staff.rows.map((r) => ({ name: r.name || '—', total: r.total, tables: r.n })),
  });
});

module.exports = router;
