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
import RestaurantOwnerDashboardScreen from '../screens/admin/RestaurantOwnerDashboardScreen';
import NotificationsScreen from '../screens/account/NotificationsScreen';
import MyBookingsScreen from '../screens/account/MyBookingsScreen';
import RegisterListingScreen from '../screens/account/RegisterListingScreen';
import NewsAdminDashboardScreen from '../screens/news/NewsAdminDashboardScreen';
import NewsAdminEditorScreen from '../screens/news/NewsAdminEditorScreen';
import AdEditorScreen from '../screens/news/AdEditorScreen';
import SellersAdminDashboardScreen from '../screens/admin/SellersAdminDashboardScreen';
import FlierEditorScreen from '../screens/admin/FlierEditorScreen';
import DirectorAdminDashboardScreen from '../screens/admin/DirectorAdminDashboardScreen';
import RestaurantAdminDashboardScreen from '../screens/admin/RestaurantAdminDashboardScreen';
import CoffeeShopAdminDashboardScreen from '../screens/admin/CoffeeShopAdminDashboardScreen';
import BusinessDetailScreen from '../screens/shop/BusinessDetailScreen';
import AboutUsScreen from '../screens/account/AboutUsScreen';
import FinanceDashboardScreen from '../screens/admin/finance/FinanceDashboardScreen';

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
      <Stack.Screen name="RestaurantOwnerDashboard" component={RestaurantOwnerDashboardScreen} options={darkScreenOptions} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
      <Stack.Screen name="RegisterListing" component={RegisterListingScreen} />

      {/* Admin dashboards — inside account tab so bottom bar stays visible */}
      <Stack.Screen name="NewsAdminDashboard" component={NewsAdminDashboardScreen} options={darkScreenOptions} />
      <Stack.Screen name="NewsAdminEditor" component={NewsAdminEditorScreen} options={darkScreenOptions} />
      <Stack.Screen name="AdEditor" component={AdEditorScreen} options={darkScreenOptions} />
      <Stack.Screen name="SellersAdminDashboard" component={SellersAdminDashboardScreen} options={darkScreenOptions} />
      <Stack.Screen name="FlierEditor" component={FlierEditorScreen} options={darkScreenOptions} />
      <Stack.Screen name="DirectorAdminDashboard" component={DirectorAdminDashboardScreen} options={darkScreenOptions} />
      <Stack.Screen name="RestaurantAdminDashboard" component={RestaurantAdminDashboardScreen} options={darkScreenOptions} />
      <Stack.Screen name="CoffeeShopAdminDashboard" component={CoffeeShopAdminDashboardScreen} options={darkScreenOptions} />
      <Stack.Screen name="BusinessDetail" component={BusinessDetailScreen} options={darkScreenOptions} />
      <Stack.Screen name="AboutUs" component={AboutUsScreen} options={darkScreenOptions} />
      <Stack.Screen name="FinanceDashboard" component={FinanceDashboardScreen} options={darkScreenOptions} />
    </Stack.Navigator>
  );
}
