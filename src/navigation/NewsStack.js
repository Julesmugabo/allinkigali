/**
 * NewsStack.js — Inzira y'amakuru (News tab stack).
 * News -> ArticleDetail, same shape as ShopStack's Shop -> BusinessDetail.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import NewsScreen from '../screens/NewsScreen';
import ArticleDetailScreen from '../screens/ArticleDetailScreen';
import StoryScreen from '../screens/StoryScreen';

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
      <Stack.Screen name="News" component={NewsScreen} />
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
      <Stack.Screen name="Story" component={StoryScreen} />
    </Stack.Navigator>
  );
}
