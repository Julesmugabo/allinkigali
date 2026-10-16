/**
 * pageTitles.js — the browser tab's name on the website, which is also what
 * Google shows in search results. Articles and places set their own name
 * (see usePageTitle); other screens use the names below. Without this the
 * tab showed internal screen names like "ArticleDetail".
 */
export const HOME_TITLE = 'allinkigali — Amakuru yo mu mahanga, hafi yawe';

const NAMES = {
  AllArticles: 'All news',
  Notifications: 'Notifications',
  Shop: 'Restaurants & Cafés',
  RestaurantMarket: 'Restaurants in Kigali',
  CoffeeShopMarket: 'Cafés in Kigali',
  OrderFood: 'Order food',
  OrderFoodPlace: 'Order food',
  OrderFoodDish: 'Order food',
  FoodCheckout: 'Checkout',
  FoodOrderStatus: 'Your order',
  WeddingMarket: 'Wedding venues',
  Account: 'Me',
  Login: 'Log in',
  SignUp: 'Create an account',
  VerifyEmail: 'Confirm your email',
  ForgotPassword: 'Forgot password',
  EditProfile: 'Edit profile',
  ChangePassword: 'Change password',
  MyBookings: 'My bookings',
  Orders: 'My orders',
  RegisterListing: 'Register your business',
  AboutUs: 'About us',
};

export function pageTitle(options, route) {
  if (options?.title) return `${options.title} · allinkigali`;
  const name = NAMES[route?.name];
  return name ? `${name} · allinkigali` : HOME_TITLE;
}
