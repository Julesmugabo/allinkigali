# allinkigali — React Native app

News, shopping and account in one app. Opens on the news feed.

---

## 1. Setup

The code targets **Expo** — it's the right choice here: you get iOS and Android
from one machine, no Xcode or Android Studio needed to start, and you test on
your own phone by scanning a QR code.

```bash
# create the project shell
npx create-expo-app@latest allinkigali --template blank
cd allinkigali

# native-side packages (expo install picks versions that match your SDK)
npx expo install react-native-screens react-native-safe-area-context \
  react-native-svg expo-linear-gradient expo-status-bar

# navigation
npm install @react-navigation/native @react-navigation/bottom-tabs \
  @react-navigation/native-stack

# start
npx expo start
```

Then copy `App.js`, `src/` and `assets/` from this folder over the generated
ones. `package.json` here lists the same dependencies if you prefer to compare.

---

## 2. What's built

**Amakuru (news)** — the default tab. Your mockup rebuilt in React Native:
navy header, wordmark, search field, scrolling category strip, hero story,
"most read" rail, and the feed. Pull down to refresh. Category tabs filter the
whole feed.

**Ubucuruzi (shop)** — deep blue gradient, search bar at the top. Nothing is
listed until you search; typing `gaz` reveals six cylinder options, each with
add-to-cart and a quantity stepper. A floating cart bar appears once something
is in the basket and leads to checkout: basket review, delivery address, phone,
note, totals, and **Ohereza icyifuzo**.

**Jyewe (account)** — signed out shows the sign-up form (first name, last name,
email, optional phone) plus **Komeza na Google**. Signed in shows the profile,
order counts, and menus. Order tracking lives here, as you asked: a list split
into "still coming" and "finished", and a detail screen with a four-stage
timeline (Byakiriwe → Byemejwe → Biri mu nzira → Byatanzwe).

---

## 3. Where things live

```
App.js                      providers + navigation container

src/theme/                  every colour, size and shadow in the app
  colors.js                 the blue ramp, category accents, gradients
  typography.js             one type scale, roles not raw sizes
  layout.js                 spacing, radii, shadows, tab bar height
  index.js                  re-exports + React Navigation theme

src/data/                   mock data — swap for your API, keep the shapes
  mockNews.js               articles + getFeed(category)
  mockProducts.js           gas catalogue + searchProducts()
  orderStatus.js            the order lifecycle, single source of truth
  mockOrders.js             seeded order history

src/context/                app state
  UserContext.js            sign up, Google sign-in, sign out
  CartContext.js            add / quantity / remove, totals, delivery fee
  OrdersContext.js          placeOrder, cancel, status tracking

src/navigation/
  RootNavigator.js          the three tabs, opening on news
  BottomTabBar.js           the custom bar (pill active state, cart badge)
  ShopStack.js              Shop → Checkout
  AccountStack.js           Account → Orders → OrderDetail

src/components/common/      Badge, EmptyState, GradientBackground,
                            PrimaryButton, SectionLabel, TextField
src/components/news/        BrandLogo, NewsHeader, CategoryTabs,
                            HeroCard, TrendingRail, NewsListItem
src/components/shop/        ShopSearchBar, ProductCard, QuantityStepper, CartBar
src/components/account/     AuthForm, GoogleButton, ProfileHeader,
                            MenuRow, OrderCard, OrderTimeline

src/screens/                NewsScreen, ShopScreen, CheckoutScreen,
                            AccountScreen, OrdersScreen, OrderDetailScreen
src/utils/                  date.js (Kinyarwanda dates), format.js (RWF, validation)
```

Files are split by responsibility rather than by length, so when something
breaks you know which file to open: a colour problem is `theme/colors.js`, a
cart total is `context/CartContext.js`, a product row is `shop/ProductCard.js`.

---

## 4. Adding your gas photos

See `assets/products/README.md`. Short version: drop the image in that folder,
then set `image: require('../../assets/products/gas-12kg-refill.png')` on the
product in `src/data/mockProducts.js`. Cards show an icon placeholder until you
do, so nothing looks broken in the meantime.

---

## 5. What's deliberately left for later

**Payment.** Checkout creates the order with `paymentMethod: null` and status
"Byakiriwe" so the tracking flow works end to end. The insertion point is
marked in `CheckoutScreen.js` — put the MoMo call between validation and
`placeOrder()`.

**Real Google OAuth.** `UserContext.signInWithGoogle` returns a fake profile
after a short delay. Install `expo-auth-session` and `expo-web-browser`, then
replace that function's body — it already returns the exact user shape the rest
of the app expects.

**News API.** `getFeed()` in `mockNews.js` is the only thing to replace. Keep
the field names and no component needs touching.

**Persistence.** State resets when the app restarts. Add
`@react-native-async-storage/async-storage` and hydrate the three contexts.

---

## 6. Two development helpers

- Order detail has a **DEV: intambwe ikurikira** button (only visible in dev)
  that pushes an order to the next stage, so you can watch the timeline fill in
  without a backend. Delete it once real status updates arrive.
- `gas-25kg-refill` is marked out of stock on purpose, so you can see that
  state on a real card.
