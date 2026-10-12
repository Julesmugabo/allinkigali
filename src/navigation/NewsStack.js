/**
 * NewsStack.js — Inzira y'amakuru (News tab stack).
 * News -> ArticleDetail, same shape as ShopStack's Shop -> BusinessDetail.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import NewsScreen from '../screens/news/NewsScreen';
import ArticleDetailScreen from '../screens/news/ArticleDetailScreen';
import AllArticlesScreen from '../screens/news/AllArticlesScreen';
import StoryScreen from '../screens/news/StoryScreen';
import NotificationsScreen from '../screens/account/NotificationsScreen';

const Stack = createNativeStackNavigator();

export default function NewsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#042C53' },
      }}
    >
      <Stack.Screen name="News" component={NewsScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
      <Stack.Screen name="AllArticles" component={AllArticlesScreen} />
      <Stack.Screen name="Story" component={StoryScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
