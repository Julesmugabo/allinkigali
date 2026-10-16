/**
 * usePageTitle.js — names the browser tab (and what Google shows) after what
 * is on screen: an article's headline, a restaurant's name. See pageTitles.js.
 */
import { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

export default function usePageTitle(title) {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    if (title) navigation.setOptions({ title });
  }, [navigation, title]);
}
