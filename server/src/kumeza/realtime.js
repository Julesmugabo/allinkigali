/**
 * realtime.js — live alerts for the waiter board and the kitchen screen,
 * over Server-Sent Events (one connection per open screen).
 *
 * Events only say "something changed at this place" (plus what, for the
 * sound and the banner); the screens then fetch the current state from the
 * server. So a dropped connection never loses or double-shows an order —
 * on reconnect the screen simply reloads (the doc's delivery guarantee).
 * The API runs as a single process, so an in-memory list is enough.
 */
const subscribers = new Map(); // "type:id" → Set<res>

function subscribe(placeKey, res) {
  if (!subscribers.has(placeKey)) subscribers.set(placeKey, new Set());
  subscribers.get(placeKey).add(res);
  return () => {
    const set = subscribers.get(placeKey);
    if (!set) return;
    set.delete(res);
    if (!set.size) subscribers.delete(placeKey);
  };
}

function publish(placeKey, event) {
  const set = subscribers.get(placeKey);
  if (!set) return;
  const line = `event: change\ndata: ${JSON.stringify({ ...event, at: Date.now() })}\n\n`;
  set.forEach((res) => { try { res.write(line); } catch { /* closed; cleaned up on 'close' */ } });
}

// Opens an SSE response and keeps it alive through proxies.
function openStream(req, res, placeKey) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // nginx: don't hold events back
  });
  res.write('event: ready\ndata: {}\n\n');
  const stop = subscribe(placeKey, res);
  const ping = setInterval(() => res.write(': ping\n\n'), 25_000);
  req.on('close', () => { clearInterval(ping); stop(); });
}

module.exports = { publish, openStream };
