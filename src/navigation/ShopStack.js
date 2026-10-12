/**
 * ShopStack.js — Resto/Coffee Shop tab stack.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ShopScreen from '../screens/shop/ShopScreen';
import CheckoutScreen from '../screens/shop/CheckoutScreen';
import BusinessDetailScreen from '../screens/shop/BusinessDetailScreen';
import BusinessBookScreen from '../screens/shop/BusinessBookScreen';
import RestaurantMarketScreen from '../screens/shop/RestaurantMarketScreen';
import RestaurantDetailScreen from '../screens/shop/RestaurantDetailScreen';
import CoffeeShopMarketScreen from '../screens/shop/CoffeeShopMarketScreen';
import CoffeeShopDetailScreen from '../screens/shop/CoffeeShopDetailScreen';
import OrderFoodScreen from '../screens/shop/OrderFoodScreen';
import WeddingMarketScreen from '../screens/shop/WeddingMarketScreen';
import WeddingDetailScreen from '../screens/shop/WeddingDetailScreen';

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
      <Stack.Screen name="Shop" component={ShopScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="BusinessDetail" component={BusinessDetailScreen} />
      <Stack.Screen name="BusinessBook" component={BusinessBookScreen} />

      <Stack.Screen name="RestaurantMarket" component={RestaurantMarketScreen} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />

      <Stack.Screen name="CoffeeShopMarket" component={CoffeeShopMarketScreen} />
      <Stack.Screen name="CoffeeShopDetail" component={CoffeeShopDetailScreen} />

      <Stack.Screen name="OrderFood" component={OrderFoodScreen} />

      <Stack.Screen name="WeddingMarket" component={WeddingMarketScreen} />
      <Stack.Screen name="WeddingDetail" component={WeddingDetailScreen} />
    </Stack.Navigator>
  );
}
