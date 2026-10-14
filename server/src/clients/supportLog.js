/**
 * supportLog.js — records what the allinkigali team did inside a client's
 * dashboard (viewed it, switched on changes, changed something). The client
 * sees this list in their Settings.
 */
const { query } = require('../db');

function logSupport(token, action, detail = null) {
  const s = token.support || {};
  return query(
    `insert into support_access_log (place_type, place_id, staff_user_id, staff_name, staff_role, action, detail)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [token.place.type, token.place.id, s.by || null, s.name || null, s.staffRole || null, action, detail],
  ).catch(() => {});
}

module.exports = { logSupport };
