/**
 * emailCodes.js — 6-digit codes sent by email, to confirm an address
 * ('verify') or reset a forgotten password ('reset'). Only a hash is stored;
 * a code works for 15 minutes, once, with at most 5 wrong tries; asking for a
 * new one is limited to one a minute and five an hour per account.
 */
const crypto = require('crypto');
const { query } = require('../db');
const { sendMail, codeEmail } = require('./mailer');

const TTL_MIN = 15;
const MAX_TRIES = 5;
const hash = (code) => crypto.createHash('sha256').update(String(code)).digest('hex');

async function sendCode(user, purpose) {
  const { rows: [recent] } = await query(
    `select count(*) filter (where created_at > now() - interval '1 minute')::int as minute,
            count(*) filter (where created_at > now() - interval '1 hour')::int as hour
     from email_codes where user_id = $1 and purpose = $2`, [user.id, purpose]);
  if (recent.minute >= 1) throw Object.assign(new Error('A code was just sent. Wait a minute before asking again.'), { status: 429 });
  if (recent.hour >= 5) throw Object.assign(new Error('Too many codes asked for. Try again in an hour.'), { status: 429 });

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  await query(
    `insert into email_codes (user_id, purpose, code_hash, expires_at) values ($1, $2, $3, now() + interval '${TTL_MIN} minutes')`,
    [user.id, purpose, hash(code)]);
  await sendMail({ to: user.email, ...codeEmail({ firstName: user.first_name, code, purpose }) });
}

// true when the code is right (and uses it up); a wrong code counts a try.
async function checkCode(userId, purpose, code) {
  const { rows: [c] } = await query(
    `select * from email_codes where user_id = $1 and purpose = $2 and used_at is null and expires_at > now()
     order by created_at desc limit 1`, [userId, purpose]);
  if (!c || c.attempts >= MAX_TRIES) return { ok: false, reason: 'expired' };
  if (c.code_hash !== hash(String(code || '').trim())) {
    await query('update email_codes set attempts = attempts + 1 where id = $1', [c.id]);
    return { ok: false, reason: c.attempts + 1 >= MAX_TRIES ? 'expired' : 'wrong' };
  }
  await query('update email_codes set used_at = now() where id = $1', [c.id]);
  return { ok: true };
}

module.exports = { sendCode, checkCode };
