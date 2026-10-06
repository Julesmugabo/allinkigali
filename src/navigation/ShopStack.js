/**
 * ShopStack.js — Resto/Coffee Shop tab stack.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ShopScreen from '../screens/ShopScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import BusinessDetailScreen from '../screens/BusinessDetailScreen';
import BusinessBookScreen from '../screens/BusinessBookScreen';
import RestaurantMarketScreen from '../screens/RestaurantMarketScreen';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';
import CoffeeShopMarketScreen from '../screens/CoffeeShopMarketScreen';
import CoffeeShopDetailScreen from '../screens/CoffeeShopDetailScreen';

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

      <Stack.Screen name="RestaurantMarket" component={RestaurantMarketScreen} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />

      <Stack.Screen name="CoffeeShopMarket" component={CoffeeShopMarketScreen} />
      <Stack.Screen name="CoffeeShopDetail" component={CoffeeShopDetailScreen} />
    </Stack.Navigator>
  );
}
