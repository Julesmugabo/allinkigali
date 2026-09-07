/**
 * AccountStack.js — Inzira ya konti (account tab stack).
 * Account -> Orders -> OrderDetail. Checkout also jumps straight to
 * OrderDetail once an order is placed.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AccountScreen from '../screens/AccountScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import SalesPartnerScreen from '../screens/SalesPartnerScreen';
import SellerDashboardScreen from '../screens/SellerDashboardScreen';
import SellerPlansScreen from '../screens/SellerPlansScreen';

const Stack = createNativeStackNavigator();
const darkScreenOptions = { contentStyle: { backgroundColor: '#042C53' } };

export default function AccountStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#F2F4F7' },
      }}
    >
      <Stack.Screen name="Account" component={AccountScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="SalesPartner" component={SalesPartnerScreen} options={darkScreenOptions} />
      <Stack.Screen name="SellerDashboard" component={SellerDashboardScreen} options={darkScreenOptions} />
      <Stack.Screen name="SellerPlans" component={SellerPlansScreen} options={darkScreenOptions} />
    </Stack.Navigator>
  );
}
