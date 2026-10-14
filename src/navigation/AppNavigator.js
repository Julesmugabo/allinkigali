/**
 * AppNavigator.js — Urwego rwa hejuru rw'ingendo (top-level navigator).
 *
 * Two branches: the customer app (tabs) and the admin area. Keeping admin
 * as a sibling of the whole tab navigator — rather than a screen inside one
 * of the tabs — is what lets it take over the full screen with no tab bar,
 * and keeps the two worlds cleanly separated.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RootNavigator from './RootNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Main" component={RootNavigator} />
    </Stack.Navigator>
  );
}
