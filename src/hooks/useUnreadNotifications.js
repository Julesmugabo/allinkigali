import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { apiFetch } from '../services/apiClient';

export default function useUnreadNotifications() {
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    apiFetch('/notifications/unread-count')
      .then((d) => setUnreadCount(d?.count || 0))
      .catch(() => {});
  }, [user]);

  return unreadCount;
}
