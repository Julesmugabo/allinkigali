/**
 * wideScreens.js — the wide-web list and place pages for each category
 * (plus Order Food),
 * ready to register in ShopStack (each falls back to its phone screen).
 */
import React, { useEffect } from 'react';
import wideOr from '../../../web/layout/wideOr';
import RestaurantMarketScreen from '../resto/RestaurantMarketScreen';
import RestaurantDetailScreen from '../resto/RestaurantDetailScreen';
import CoffeeShopMarketScreen from '../coffee/CoffeeShopMarketScreen';
import CoffeeShopDetailScreen from '../coffee/CoffeeShopDetailScreen';
import WeddingMarketScreen from '../wedding/WeddingMarketScreen';
import WeddingDetailScreen from '../wedding/WeddingDetailScreen';
import OrderFoodScreen from '../orderFood/OrderFoodScreen';
import SuppliersScreen from '../foodOrder/SuppliersScreen';
import SupplierScreen from '../foodOrder/SupplierScreen';
import DishScreen from '../foodOrder/DishScreen';
import FoodCheckoutScreen from '../foodOrder/FoodCheckoutScreen';
import FoodOrderStatusScreen from '../foodOrder/FoodOrderStatusScreen';
import PlaceScreen from '../place/PlaceScreen';
import BrowseScreen from './BrowseScreen';
import KINDS from './kinds';
import { ShopThemeProvider } from '../../../theme/shopThemes';

// Each category's pages get its colour theme (coffee: espresso; others: navy).
const list = (kind) => (props) => <ShopThemeProvider theme={kind.theme}><BrowseScreen kind={kind} {...props} /></ShopThemeProvider>;
const page = (kind) => (props) => <ShopThemeProvider theme={kind.theme}><PlaceScreen kind={kind} {...props} /></ShopThemeProvider>;

export const RestaurantMarket = wideOr(RestaurantMarketScreen, list(KINDS.resto));
export const RestaurantDetail = wideOr(RestaurantDetailScreen, page(KINDS.resto));
export const CoffeeShopMarket = wideOr(CoffeeShopMarketScreen, list(KINDS.coffee));
export const CoffeeShopDetail = wideOr(CoffeeShopDetailScreen, page(KINDS.coffee));
export const WeddingMarket = wideOr(WeddingMarketScreen, list(KINDS.wedding));
export const WeddingDetail = wideOr(WeddingDetailScreen, page(KINDS.wedding));
export const OrderFood = wideOr(OrderFoodScreen, SuppliersScreen);

// The website's Order Food pages have no phone version yet: on a phone the
// link falls back to the phone Order Food screen.
function ToPhoneOrderFood({ navigation }) {
  useEffect(() => { navigation.replace('OrderFood'); }, [navigation]);
  return null;
}
export const OrderFoodPlace = wideOr(ToPhoneOrderFood, SupplierScreen);
export const OrderFoodDish = wideOr(ToPhoneOrderFood, DishScreen);
export const FoodCheckout = wideOr(ToPhoneOrderFood, FoodCheckoutScreen);
export const FoodOrderStatus = wideOr(ToPhoneOrderFood, FoodOrderStatusScreen);
