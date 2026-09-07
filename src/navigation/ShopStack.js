/**
 * ShopStack.js — Inzira yo kugura (shop tab stack).
 * Shop -> Checkout (products) and Shop -> BusinessDetail -> BusinessBook
 * (services). Payment screens slot in after Checkout/BusinessBook later.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ShopScreen from '../screens/ShopScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import BusinessDetailScreen from '../screens/BusinessDetailScreen';
import BusinessBookScreen from '../screens/BusinessBookScreen';

const Stack = createNativeStackNavigator();

export default function ShopStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#042C53' },
      }}
    >
      <Stack.Screen name="Shop" component={ShopScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="BusinessDetail" component={BusinessDetailScreen} />
      <Stack.Screen name="BusinessBook" component={BusinessBookScreen} />
    </Stack.Navigator>
  );
}
