/**
 * RootNavigator.js — Imiterere y'ingendo muri app.
 *
 * Three tabs, opening on the news feed. The custom bar in BottomTabBar reads
 * the tabLabel / tabIcon / showsCartBadge options declared below.
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

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

export default function RootNavigator() {
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
          tabLabel: 'Access Market',
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
