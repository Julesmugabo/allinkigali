/**
 * ShopStack.js — Resto/Coffee Shop tab stack.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ShopScreen from '../screens/shop/ShopScreen';
import CheckoutScreen from '../screens/shop/CheckoutScreen';
import BusinessDetailScreen from '../screens/shop/BusinessDetailScreen';
import BusinessBookScreen from '../screens/shop/BusinessBookScreen';
// Wide browsers get the new list/place pages; phones keep the original screens.
import {
  RestaurantMarket, RestaurantDetail, CoffeeShopMarket, CoffeeShopDetail, WeddingMarket, WeddingDetail, OrderFood,
  OrderFoodPlace, OrderFoodDish, FoodCheckout, FoodOrderStatus,
} from '../screens/shop/browse/wideScreens';

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

      <Stack.Screen name="RestaurantMarket" component={RestaurantMarket} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetail} />

      <Stack.Screen name="CoffeeShopMarket" component={CoffeeShopMarket} />
      <Stack.Screen name="CoffeeShopDetail" component={CoffeeShopDetail} />

      <Stack.Screen name="OrderFood" component={OrderFood} />
      <Stack.Screen name="OrderFoodPlace" component={OrderFoodPlace} />
      <Stack.Screen name="OrderFoodDish" component={OrderFoodDish} />
      <Stack.Screen name="FoodCheckout" component={FoodCheckout} />
      <Stack.Screen name="FoodOrderStatus" component={FoodOrderStatus} />

      <Stack.Screen name="WeddingMarket" component={WeddingMarket} />
      <Stack.Screen name="WeddingDetail" component={WeddingDetail} />
    </Stack.Navigator>
  );
}
