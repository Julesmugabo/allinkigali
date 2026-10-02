/**
 * App.js — Aho byose bitangirira.
 *
 * Provider order matters: User -> Orders -> Cart, because checkout reads all
 * three, and the tab bar reads the cart. News/Business/Booking sit inside
 * them because both the customer screens and the admin dashboards read from
 * those stores.
 */
import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import AppNavigator from './src/navigation/AppNavigator';
import InstallAppBanner from './src/components/common/InstallAppBanner';
import { UserProvider } from './src/context/UserContext';
import { OrdersProvider } from './src/context/OrdersContext';
import { CartProvider } from './src/context/CartContext';
import { BusinessProvider } from './src/context/BusinessContext';
import { BookingProvider } from './src/context/BookingContext';
import { FliersProvider } from './src/context/FliersContext';
import { NewsProvider } from './src/context/NewsContext';
import { AdsProvider } from './src/context/AdsContext';
import { PropertyProvider } from './src/context/PropertyContext';
import { LandProvider } from './src/context/LandContext';
import { navTheme, colors } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <OrdersProvider>
          <CartProvider>
            <BusinessProvider>
              <BookingProvider>
                <FliersProvider>
                  <NewsProvider>
                    <AdsProvider>
                      <PropertyProvider>
                        <LandProvider>
                        {/* Fixes a real bug: an elastic/overscroll bounce on a
                            scrollable screen briefly reveals whatever sits
                            behind it. With no background here, that was the
                            page's default white — a jarring flash, especially
                            on the dark navy screens (Shop, Me, Admin). */}
                        <View style={{ flex: 1, backgroundColor: colors.navy800 }}>
                          <StatusBar style="light" />
                          <InstallAppBanner />
                          <NavigationContainer theme={navTheme}>
                            <AppNavigator />
                          </NavigationContainer>
                        </View>
                        </LandProvider>
                      </PropertyProvider>
                    </AdsProvider>
                  </NewsProvider>
                </FliersProvider>
              </BookingProvider>
            </BusinessProvider>
          </CartProvider>
        </OrdersProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}
