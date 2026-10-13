# allinkigali

A Kinyarwanda news + local marketplace app for Kigali, built with Expo (React
Native, targets iOS, Android and web from one codebase) and a custom
Express + PostgreSQL backend (hosted on Vercel + Neon). A separate React +
Vite admin backoffice (`admin/`) runs at a different domain for staff who
don't need the mobile app.

---

## 1. Repo layout

```
allinkigali/                  the Expo app (this folder)
  App.js                      providers + navigation container + push notification setup
  app.json                    Expo config (icons, splash, notifications plugin)
  src/
    screens/
      news/                   article feed, article detail, live story grouping
        dashboard/            news admin dashboard tabs (articles, ads, authors, ...)
      shop/                   customer-facing marketplace screens
        resto/                restaurant browse + detail
        coffee/               coffee shop browse + detail
        orderFood/            food delivery (cart-based ordering)
        wedding/              wedding venue browse + detail
        ShopScreen.js         Shop tab landing (generic sellers via ServicesPanel)
        BusinessDetailScreen.js / BusinessBookScreen.js
                              generic seller detail + booking (gas, gyms, rides, ...)
        CheckoutScreen.js     cart checkout (used by food ordering)
      clientsDashboards/      owner-facing dashboards, one folder per business type
        resto/                restaurant owner dashboard (bookings, orders, menu, finance, ...)
        coffee/                coffee shop owner dashboard (same shape as resto)
        orderFood/             (not built yet)
        wedding/               (not built yet)
      admin/                  staff/director dashboards (news, sellers, restaurants,
                               coffee shops, finance, director overview, flier editor)
      account/                sign up/in, profile, orders, bookings, notifications,
                               seller dashboard + plans, sales partner, info/about
    context/                  app-wide state: UserContext, CartContext, OrdersContext,
                               BusinessContext, BookingContext, NewsContext, AdsContext,
                               FliersContext
    navigation/                RootNavigator, BottomTabBar, ShopStack, AccountStack
    components/                shared building blocks, grouped by area (common, news,
                               shop, account, admin, map, booking)
    services/                 apiClient.js (the one fetch wrapper, JWT bearer auth)
    hooks/                    usePushNotifications.js (Expo push registration + routing)
    theme/                    colors, typography, spacing/radius/shadows
    utils/                    date/format helpers, photo upload

server/                       Express + PostgreSQL API (deployed on Vercel, Neon DB)
  src/
    routes/                   one file per resource: auth, news, restaurants,
                               coffeeShops, restoBookings, foodOrders, restaurantMenu,
                               weddingVenues, businesses, bookings, products, properties,
                               land, pendingListings, ads, fliers, finance, admin,
                               notifications, myRestaurant, upload
    middleware/                requireAuth, requireRole (director bypasses all role checks)
    pushNotifications.js       Expo Push API sender + in-app notification writer
    db.js                      pg Pool connection
    migrate.js                 runs every migrations/*.sql in order, tracked in _migrations
  migrations/                 numbered .sql files, one per schema change

admin/                        standalone React + Vite backoffice app (admin.allinkigali.rw)
```

---

## 2. What's built

**Amakuru (news)** — default tab. Feed with category filtering, admin-curated
hero article, live-story grouping for developing coverage, article detail
screen, in-app + push notifications on publish and breaking news.

**Ubucuruzi (shop)** — the marketplace tab, split by business type:
- **Resto** and **Coffee Shop** — browse with map + sidebar filters, detail
  screens with booking (reservation), and a dedicated owner dashboard each
  (bookings, delivery orders, menu management, finance, reviews, insights,
  settings).
- **Order Food** — delivery ordering from restaurants/coffee shops with
  delivery enabled; cart-based, goes through `CheckoutScreen`.
- **Wedding venues** — browse + detail with appointment-style booking.
- **Generic sellers** (gas, gyms, rides, etc.) — registered via the seller
  dashboard, discovered through `ShopScreen` → `BusinessDetailScreen` →
  `BusinessBookScreen`. No owner dashboard per vertical here; sellers manage
  listings through the general Seller Dashboard.
- Auto-scrolling flier/ad strip on the Shop tab, curated from the admin
  Sales Partners dashboard.

**Jyewe (account)** — sign up / sign in (incl. Google), profile, order and
booking history with status tracking, change password. An admin role on the
account surfaces an **Ubuyobozi** (admin) row leading to the relevant staff
dashboard — no separate admin login.

**Staff / owner dashboards**
- **Director** — top-level dashboard with access to every other admin area.
- **News admin** — articles, ads, authors, performance, settings.
- **Sellers admin** — approves/manages generic seller listings and plans.
- **Restaurant / Coffee Shop admin** — platform-level oversight of those
  verticals (separate from the owner's own dashboard).
- **Finance** — transaction tracking (`txn_type`, `txn_date`, `description`,
  `amount`).
- **Restaurant / Coffee Shop owner dashboards** (`clientsDashboards/`) —
  self-service: bookings, delivery orders, menu CRUD with photo upload,
  reviews, insights, finance, reports, settings. Responsive: sidebar sits
  beside content on wide screens, overlays on mobile.

**Push notifications** — free, via Expo's Push API (no SMS, no API key).
Tokens are registered on sign-in and cleared on sign-out
(`src/hooks/usePushNotifications.js`, `server/src/pushNotifications.js`).
Triggers: article publish/breaking news, booking confirmed/rejected/cancelled,
food order status changes, new orders/bookings to the owner. Tapping a push
routes to the relevant screen (article, bookings, orders).

**Admin backoffice (`admin/`)** — standalone React + Vite app for staff who
don't need the mobile app, deployed separately to admin.allinkigali.rw.

---

## 3. Backend

Express + PostgreSQL (Neon), deployed on Vercel. JWT auth with role-based
access (`director`, `news`, `restaurant`, `coffeeshop`, and other staff
roles) — `director` bypasses every role check. Migrations run automatically
on deploy (`vercel.json`'s `buildCommand`: `node src/migrate.js`), so a new
`migrations/0NN_*.sql` file just needs to be committed and pushed.

`src/services/apiClient.js` is the single entry point the app uses to talk to
the backend: attaches the bearer token, JSON in/out, throws on non-2xx so
callers just try/catch.

---

## 4. Running it locally

```bash
npm install
npx expo start          # app — scan the QR code, or press w for web

cd server
npm install
npm run migrate         # applies any pending migrations to DATABASE_URL
npm start                # API, defaults to port 3000

cd admin
npm install
npm run dev              # backoffice, defaults to port 5173
```

Set `EXPO_PUBLIC_API_URL` (app) and `DATABASE_URL` (server) in your `.env`
files — see `.env.example` if present, or ask for the current values.

---

## 5. What's deliberately left for later

- **Payment.** Checkout and bookings record `paymentMethod: null` so the
  tracking flow works end to end; the MoMo/card step slots in before the
  final "place order"/"confirm" call.
- **Order Food and Wedding owner dashboards** — not built yet
  (`src/screens/clientsDashboards/orderFood/` and `wedding/` are placeholders).
- **Postgres migration off Neon** — plan is to move the database onto the
  Contabo VPS alongside the API.
