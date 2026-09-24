/**
 * AdminNavigator.js — Inzira z'ubuyobozi (admin stack).
 *
 * Sits beside the customer app rather than inside it: because this is a
 * top-level sibling of the tab navigator, admin screens take the whole
 * display and never show the customer bottom tab bar.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import NewsAdminDashboardScreen from '../screens/NewsAdminDashboardScreen';
import NewsAdminEditorScreen from '../screens/NewsAdminEditorScreen';
import AdEditorScreen from '../screens/AdEditorScreen';
import SellersAdminDashboardScreen from '../screens/SellersAdminDashboardScreen';
import FlierEditorScreen from '../screens/FlierEditorScreen';
import SalesPartnerScreen from '../screens/SalesPartnerScreen';
import SellerDashboardScreen from '../screens/SellerDashboardScreen';
import SellerPlansScreen from '../screens/SellerPlansScreen';
import BusinessDetailScreen from '../screens/BusinessDetailScreen';
import DirectorAdminDashboardScreen from '../screens/DirectorAdminDashboardScreen';

const Stack = createNativeStackNavigator();

export default function AdminNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#042C53' },
      }}
    >
      <Stack.Screen name="NewsAdminDashboard" component={NewsAdminDashboardScreen} />
      <Stack.Screen name="NewsAdminEditor" component={NewsAdminEditorScreen} />
      <Stack.Screen name="AdEditor" component={AdEditorScreen} />

      <Stack.Screen name="SellersAdminDashboard" component={SellersAdminDashboardScreen} />
      <Stack.Screen name="FlierEditor" component={FlierEditorScreen} />
      {/* These three reuse the exact screens a seller uses for their own
          business — SalesPartner/SellerDashboard/SellerPlans are registered
          under the SAME names here as in AccountStack on purpose: React
          Navigation resolves navigate() by bubbling to the nearest ancestor
          with a matching route name, so SellerDashboardScreen's own internal
          navigation calls (to edit, to plans) work correctly whether it was
          opened from a seller's own Me tab or, as here, from admin browsing
          any seller's listing — neither screen needs to know which. */}
      <Stack.Screen name="SellerDashboard" component={SellerDashboardScreen} />
      <Stack.Screen name="SalesPartner" component={SalesPartnerScreen} />
      <Stack.Screen name="SellerPlans" component={SellerPlansScreen} />
      {/* Registered here too (same name/component as ShopStack) so previewing
          a listing from admin stays inside the Admin stack — its own back
          button then returns correctly, instead of jumping out to the real
          customer app with no way back in except the password gate again. */}
      <Stack.Screen name="BusinessDetail" component={BusinessDetailScreen} />

      <Stack.Screen name="DirectorAdminDashboard" component={DirectorAdminDashboardScreen} />
    </Stack.Navigator>
  );
}
