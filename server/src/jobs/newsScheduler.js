/**
 * newsScheduler.js — background newsroom chores, run inside the long-lived
 * server process (index.js; not on Vercel's serverless copy):
 *   - publish drafts whose scheduled time (publish_at) has passed
 *   - drop the Breaking flag once breaking_expires_at has passed
 * The interval comes from news_workflow_settings.scheduled_check_interval
 * (minutes), re-read every run so a change in the dashboard applies
 * without a restart.
 */
const { query } = require('../db');

const DEFAULT_MINUTES = 5;

async function runOnce() {
  const published = await query(
    `update news_articles set status = 'published', published_at = now()
     where status = 'draft' and publish_at is not null and publish_at <= now()
     returning id, title`
  );
  const expired = await query(
    `update news_articles set is_breaking = false
     where is_breaking and breaking_expires_at is not null and breaking_expires_at <= now()
     returning id`
  );
  if (published.rowCount || expired.rowCount) {
    console.log(`[newsScheduler] published ${published.rowCount} scheduled, expired ${expired.rowCount} breaking`);
  }
}

async function intervalMinutes() {
  try {
    const { rows } = await query('select scheduled_check_interval from news_workflow_settings where id = 1');
    const m = Number(rows[0]?.scheduled_check_interval);
    return m >= 1 ? m : DEFAULT_MINUTES;
  } catch {
    return DEFAULT_MINUTES;
  }
}

function start() {
  const tick = async () => {
    try { await runOnce(); } catch (e) { console.error('[newsScheduler]', e.message); }
    setTimeout(tick, (await intervalMinutes()) * 60 * 1000);
  };
  setTimeout(tick, 15 * 1000); // first run shortly after boot
}

module.exports = { start, runOnce };
