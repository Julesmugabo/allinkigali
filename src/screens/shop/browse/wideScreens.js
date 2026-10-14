/**
 * wideScreens.js — the wide-web list and place pages for each category
 * (plus Order Food),
 * ready to register in ShopStack (each falls back to its phone screen).
 */
import React from 'react';
import wideOr from '../../../web/layout/wideOr';
import RestaurantMarketScreen from '../resto/RestaurantMarketScreen';
import RestaurantDetailScreen from '../resto/RestaurantDetailScreen';
import CoffeeShopMarketScreen from '../coffee/CoffeeShopMarketScreen';
import CoffeeShopDetailScreen from '../coffee/CoffeeShopDetailScreen';
import WeddingMarketScreen from '../wedding/WeddingMarketScreen';
import WeddingDetailScreen from '../wedding/WeddingDetailScreen';
import OrderFoodScreen from '../orderFood/OrderFoodScreen';
import OrderFoodWide from '../orderFood/OrderFoodWide';
import PlaceScreen from '../place/PlaceScreen';
import BrowseScreen from './BrowseScreen';
import KINDS from './kinds';

const list = (kind) => (props) => <BrowseScreen kind={kind} {...props} />;
const page = (kind) => (props) => <PlaceScreen kind={kind} {...props} />;

export const RestaurantMarket = wideOr(RestaurantMarketScreen, list(KINDS.resto));
export const RestaurantDetail = wideOr(RestaurantDetailScreen, page(KINDS.resto));
export const CoffeeShopMarket = wideOr(CoffeeShopMarketScreen, list(KINDS.coffee));
export const CoffeeShopDetail = wideOr(CoffeeShopDetailScreen, page(KINDS.coffee));
export const WeddingMarket = wideOr(WeddingMarketScreen, list(KINDS.wedding));
export const WeddingDetail = wideOr(WeddingDetailScreen, page(KINDS.wedding));
export const OrderFood = wideOr(OrderFoodScreen, OrderFoodWide);
