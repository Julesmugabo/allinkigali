/**
 * RootNavigator.js — Imiterere y'ingendo muri app.
 *
 * Three tabs, opening on the news feed. The custom bar in BottomTabBar reads
 * the tabLabel / tabIcon / showsCartBadge options declared below.
 */
import React, { useRef, useCallback } from 'react';
import { BackHandler, ToastAndroid, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute, useFocusEffect } from '@react-navigation/native';

import NewsStack from './NewsStack';
import ShopStack from './ShopStack';
import AccountStack from './AccountStack';
import BottomTabBar from './BottomTabBar';

const Tab = createBottomTabNavigator();

// Screens that take over the whole display and shouldn't show the tab bar.
const FULLSCREEN_ROUTES = ['Checkout', 'BusinessBook'];

function hideTabBarOn(route) {
  const focused = getFocusedRouteNameFromRoute(route);
  return FULLSCREEN_ROUTES.includes(focused);
}

// On Android, prevent the first back press from immediately exiting the app.
// If the user presses back again within 2 seconds, the app exits normally.
function useExitGuard() {
  const lastBackPress = useRef(0);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;

      const onBack = () => {
        const now = Date.now();
        if (now - lastBackPress.current < 2000) return false; // allow exit
        lastBackPress.current = now;
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
        return true; // block first press
      };

      BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBack);
    }, [])
  );
}

export default function RootNavigator() {
  useExitGuard();

  return (
    <Tab.Navigator
      initialRouteName="NewsTab"
      backBehavior="initialRoute"
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="NewsTab"
        component={NewsStack}
        options={{
          tabLabel: 'News',
          tabIcon: 'newspaper-variant-outline',
          tabIconActive: 'newspaper-variant',
        }}
      />

      <Tab.Screen
        name="ShopTab"
        component={ShopStack}
        options={({ route }) => ({
          tabLabel: 'Service Market',
          tabIcon: 'shopping-outline',
          tabIconActive: 'shopping',
          showsCartBadge: true,
          tabBarHidden: hideTabBarOn(route),
        })}
      />

      <Tab.Screen
        name="AccountTab"
        component={AccountStack}
        options={{
          tabLabel: 'Me',
          tabIcon: 'account-outline',
          tabIconActive: 'account',
        }}
      />
    </Tab.Navigator>
  );
}
