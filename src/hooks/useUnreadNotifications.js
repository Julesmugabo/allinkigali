/**
 * useUnreadNotifications.js — how many unread notifications the signed-in
 * person has, for the bell's dot. Re-checks right after they send something
 * (see notificationsBus) and every minute, so answers from a restaurant
 * show up without reloading.
 */
import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { apiFetch } from '../services/apiClient';
import { onNotificationsChanged } from '../services/notificationsBus';

const EVERY_MINUTE = 60 * 1000;

export default function useUnreadNotifications() {
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return undefined;
    }
    const check = () =>
      apiFetch('/notifications/unread-count')
        .then((d) => setUnreadCount(d?.count || 0))
        .catch(() => {});
    check();
    const stop = onNotificationsChanged(check);
    const timer = setInterval(check, EVERY_MINUTE);
    return () => { stop(); clearInterval(timer); };
  }, [user]);

  return unreadCount;
}
