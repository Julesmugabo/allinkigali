/**
 * notificationsBus.js — tells every bell to re-check its unread count right
 * away. apiClient rings it after anything the person sends (a booking, an
 * order, an application…), since the server may have just added a
 * notification for them.
 */
const listeners = new Set();

export function onNotificationsChanged(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notificationsChanged() {
  listeners.forEach((fn) => fn());
}
