/**
 * pushNotifications.js — sends push notifications via Expo's free push service.
 * No API key needed: Expo Push API is open for Expo push tokens.
 */
const { query } = require('./db');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function sendPush(messages) {
  if (!messages.length) return [];
  const chunks = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }
  const results = [];
  for (const chunk of chunks) {
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk),
      });
      const data = await res.json();
      results.push(...(data.data || []));
    } catch (err) {
      console.error('Push send error:', err.message);
    }
  }
  return results;
}

async function getTokensForUser(userId) {
  const { rows } = await query('SELECT token FROM push_tokens WHERE user_id = $1', [userId]);
  return rows.map(r => r.token).filter(t => t.startsWith('ExponentPushToken['));
}

async function getTokensForUsers(userIds) {
  if (!userIds.length) return [];
  const placeholders = userIds.map((_, i) => `$${i + 1}`).join(',');
  const { rows } = await query(`SELECT user_id, token FROM push_tokens WHERE user_id IN (${placeholders})`, userIds);
  return rows.filter(r => r.token.startsWith('ExponentPushToken['));
}

async function getAllTokens() {
  const { rows } = await query('SELECT DISTINCT token FROM push_tokens');
  return rows.map(r => r.token).filter(t => t.startsWith('ExponentPushToken['));
}

async function removeInvalidTokens(tokens) {
  if (!tokens.length) return;
  const placeholders = tokens.map((_, i) => `$${i + 1}`).join(',');
  await query(`DELETE FROM push_tokens WHERE token IN (${placeholders})`, tokens);
}

async function notifyUser(userId, { title, body, data = {} }) {
  // Always keep the in-app notification — previously it was only saved when
  // the user had a push token, so web users (and anyone who declined push)
  // never saw booking/order/approval notifications at all.
  await saveNotification(userId, title, body, data);
  const tokens = await getTokensForUser(userId);
  if (!tokens.length) return;
  const messages = tokens.map(token => ({
    to: token, title, body, data, sound: 'default',
  }));
  const results = await sendPush(messages);
  const invalid = [];
  results.forEach((r, i) => {
    if (r.status === 'error' && r.details?.error === 'DeviceNotRegistered') {
      invalid.push(tokens[i]);
    }
  });
  if (invalid.length) await removeInvalidTokens(invalid);
}

async function notifyUsers(userIds, { title, body, data = {} }) {
  for (const uid of userIds) {
    await notifyUser(uid, { title, body, data });
  }
}

async function notifyAll({ title, body, data = {} }) {
  const tokens = await getAllTokens();
  if (!tokens.length) return;
  const messages = tokens.map(token => ({
    to: token, title, body, data, sound: 'default',
  }));
  const results = await sendPush(messages);
  const invalid = [];
  results.forEach((r, i) => {
    if (r.status === 'error' && r.details?.error === 'DeviceNotRegistered') {
      invalid.push(tokens[i]);
    }
  });
  if (invalid.length) await removeInvalidTokens(invalid);
}

async function saveNotification(userId, title, body, data = {}) {
  const type = data.type || 'general';
  await query(
    `INSERT INTO notifications (user_id, title, body, type, data) VALUES ($1, $2, $3, $4, $5)`,
    [userId, title, body, type, JSON.stringify(data)]
  );
}

module.exports = {
  notifyUser,
  notifyUsers,
  notifyAll,
  sendPush,
  getTokensForUser,
  getAllTokens,
  saveNotification,
};
