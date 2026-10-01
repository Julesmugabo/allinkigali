/**
 * ShopStack.js — Inzira yo kugura (shop tab stack).
 * Shop -> Checkout (products) and Shop -> BusinessDetail -> BusinessBook
 * (services). Payment screens slot in after Checkout/BusinessBook later.
 *
 * Plus the 5 new marketplaces, reached from Shop's entry cards: Ibibanza
 * (land), Inzu zamacye + House for Sale (one PropertyMarket screen, told
 * apart by a mode param), and Allingadget + Uruhu Rwiza (one ProductMarket
 * screen, told apart by a store param).
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ShopScreen from '../screens/ShopScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import BusinessDetailScreen from '../screens/BusinessDetailScreen';
import BusinessBookScreen from '../screens/BusinessBookScreen';
import LandMarketScreen from '../screens/LandMarketScreen';
import LandDetailScreen from '../screens/LandDetailScreen';
import PropertyMarketScreen from '../screens/PropertyMarketScreen';
import PropertyDetailScreen from '../screens/PropertyDetailScreen';
import ListPropertyScreen from '../screens/ListPropertyScreen';
import ProductMarketScreen from '../screens/ProductMarketScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';

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

      <Stack.Screen name="LandMarket" component={LandMarketScreen} />
      <Stack.Screen name="LandDetail" component={LandDetailScreen} />

      <Stack.Screen name="PropertyMarket" component={PropertyMarketScreen} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
      <Stack.Screen name="ListProperty" component={ListPropertyScreen} />

      <Stack.Screen name="ProductMarket" component={ProductMarketScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </Stack.Navigator>
  );
}
