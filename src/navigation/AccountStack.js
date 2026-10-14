/**
 * AccountStack.js — Inzira ya konti (account tab stack).
 * Account -> Orders -> OrderDetail. Checkout also jumps straight to
 * OrderDetail once an order is placed.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AccountScreen from '../screens/account/AccountScreen';
import OrdersScreen from '../screens/account/OrdersScreen';
import OrderDetailScreen from '../screens/account/OrderDetailScreen';
import SalesPartnerScreen from '../screens/account/SalesPartnerScreen';
import SellerDashboardScreen from '../screens/account/SellerDashboardScreen';
import SellerPlansScreen from '../screens/account/SellerPlansScreen';
import EditProfileScreen from '../screens/account/EditProfileScreen';
import ChangePasswordScreen from '../screens/account/ChangePasswordScreen';
import InfoScreen from '../screens/account/InfoScreen';
import LoginScreen from '../screens/account/LoginScreen';
import SignUpScreen from '../screens/account/SignUpScreen';
import NotificationsScreen from '../screens/account/NotificationsScreen';
import MyBookingsScreen from '../screens/account/MyBookingsScreen';
import RegisterListingScreen from '../screens/account/RegisterListingScreen';
import BusinessDetailScreen from '../screens/shop/BusinessDetailScreen';
import AboutUsScreen from '../screens/account/AboutUsScreen';

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
      <Stack.Screen name="Account" component={AccountScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="SalesPartner" component={SalesPartnerScreen} options={darkScreenOptions} />
      <Stack.Screen name="SellerDashboard" component={SellerDashboardScreen} options={darkScreenOptions} />
      <Stack.Screen name="SellerPlans" component={SellerPlansScreen} options={darkScreenOptions} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={darkScreenOptions} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={darkScreenOptions} />
      <Stack.Screen name="Info" component={InfoScreen} options={darkScreenOptions} />
      <Stack.Screen name="Login" component={LoginScreen} options={darkScreenOptions} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={darkScreenOptions} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
      <Stack.Screen name="RegisterListing" component={RegisterListingScreen} />

      <Stack.Screen name="BusinessDetail" component={BusinessDetailScreen} options={darkScreenOptions} />
      <Stack.Screen name="AboutUs" component={AboutUsScreen} options={darkScreenOptions} />
    </Stack.Navigator>
  );
}
