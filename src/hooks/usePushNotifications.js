import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { apiFetch } from '../services/apiClient';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotifications() {
  if (Platform.OS === 'web') return null;
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  return token;
}

export default function usePushNotifications(user, navigationRef) {
  const tokenRef = useRef(null);
  const responseListener = useRef();

  useEffect(() => {
    if (!user) return;

    registerForPushNotifications().then(async (token) => {
      if (!token) return;
      tokenRef.current = token;
      try {
        await apiFetch('/notifications/push-token', {
          method: 'POST',
          body: { token, platform: Platform.OS },
        });
      } catch {}
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (!data || !navigationRef?.current) return;

      if (data.type === 'article' || data.type === 'breaking') {
        navigationRef.current.navigate('NewsTab', {
          screen: 'ArticleDetail',
          params: { id: data.articleId },
        });
      } else if (data.type?.startsWith('booking_') || data.type === 'new_booking') {
        navigationRef.current.navigate('AccountTab', {
          screen: 'MyBookings',
        });
      } else if (data.type === 'order_update' || data.type === 'new_order') {
        navigationRef.current.navigate('AccountTab', {
          screen: 'Orders',
        });
      } else {
        navigationRef.current.navigate('AccountTab', {
          screen: 'Notifications',
        });
      }
    });

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user, navigationRef]);

  useEffect(() => {
    if (user || !tokenRef.current) return;
    apiFetch('/notifications/push-token', {
      method: 'DELETE',
      body: { token: tokenRef.current },
    }).catch(() => {});
    tokenRef.current = null;
  }, [user]);
}
