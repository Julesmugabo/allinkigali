/**
 * App.js — Aho byose bitangirira.
 *
 * Provider order matters: User -> Orders -> Cart, because checkout reads all
 * three, and the tab bar reads the cart. News/Business/Booking sit inside
 * them because both the customer screens and the admin dashboards read from
 * those stores.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';

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
import { navTheme, colors } from './src/theme';
import { useUser } from './src/context/UserContext';
import usePushNotifications from './src/hooks/usePushNotifications';

const navigationRef = createNavigationContainerRef();

function PushNotificationSetup() {
  const { user } = useUser();
  usePushNotifications(user, navigationRef);
  return null;
}

const linking = {
  prefixes: [],
  config: {
    screens: {
      Main: {
        path: '',
        screens: {
          NewsTab: {
            path: 'news',
            screens: {
              News: '',
              ArticleDetail: 'article/:id',
              AllArticles: 'articles',
              Story: 'story/:id',
              Notifications: 'notifications',
            },
          },
          ShopTab: {
            path: 'shop',
            screens: {
              Shop: '',
              RestaurantMarket: 'restaurants',
              RestaurantDetail: 'restaurant/:id',
              CoffeeShopMarket: 'coffee-shops',
              CoffeeShopDetail: 'coffee-shop/:id',
              OrderFood: 'order-food',
              WeddingMarket: 'wedding-venues',
              WeddingDetail: 'wedding-venue/:id',
              Checkout: 'checkout',
              BusinessDetail: 'business/:id',
              BusinessBook: 'book/:id',
            },
          },
          AccountTab: {
            path: 'me',
            screens: {
              Account: '',
              Orders: 'orders',
              OrderDetail: 'order/:id',
              Login: 'login',
              SignUp: 'signup',
              EditProfile: 'edit-profile',
              ChangePassword: 'change-password',
              SellerDashboard: 'seller',
              SellerPlans: 'seller-plans',
              SalesPartner: 'sales-partner',
              Info: 'info',
              RestaurantOwnerDashboard: 'restaurant-owner',
              Notifications: 'my-notifications',
              MyBookings: 'my-bookings',
              RegisterListing: 'register-listing',
              NewsAdminDashboard: 'admin-news',
              NewsAdminEditor: 'admin-news-editor',
              AdEditor: 'admin-ad-editor',
              SellersAdminDashboard: 'admin-sellers',
              FlierEditor: 'admin-flier-editor',
              DirectorAdminDashboard: 'admin-director',
              RestaurantAdminDashboard: 'admin-restaurants',
              CoffeeShopAdminDashboard: 'admin-coffee-shops',
              BusinessDetail: 'business/:id',
              AboutUs: 'about',
              FinanceDashboard: 'admin-finance',
            },
          },
        },
      },
    },
  },
};

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        input, textarea {
          outline: none !important;
          background-color: transparent !important;
          box-shadow: none !important;
        }
        html, body, #root {
          height: 100%;
          background-color: ${colors.navy900};
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

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
                      {/* Fixes a real bug: an elastic/overscroll bounce on a
                          scrollable screen briefly reveals whatever sits
                          behind it. With no background here, that was the
                          page's default white — a jarring flash, especially
                          on the dark navy screens (Shop, Me, Admin). */}
                      <View style={{ flex: 1, backgroundColor: colors.navy800 }}>
                        <StatusBar style="light" />
                        <InstallAppBanner />
                        <PushNotificationSetup />
                        <NavigationContainer ref={navigationRef} theme={navTheme} linking={linking}>
                          <AppNavigator />
                        </NavigationContainer>
                      </View>
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
