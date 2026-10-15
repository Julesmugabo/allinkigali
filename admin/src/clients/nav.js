/**
 * nav.js — the client dashboard's sidebar, per kind of place and role.
 * Related pages sit nested under one parent (e.g. Ku Meza › Waiter board).
 *   owner / manager — everything for their place
 *   waiter          — the waiter board
 *   cashier         — the waiter board (bills) and the sales report
 *   kitchen         — the kitchen screen only
 * An item is { to, label, icon } or a group { label, icon, children }.
 */
import {
  LayoutDashboard, Bike, ConciergeBell, CalendarCheck, BookOpen, Wallet, Users, Star, Settings, CalendarHeart, Building2,
} from 'lucide-react';

const dining = (isCafe, role) => {
  if (role === 'kitchen') return [{ to: '/kumeza/kitchen', label: 'Kitchen screen', icon: ConciergeBell }];
  if (role === 'waiter') return [{ to: '/kumeza/board', label: 'Waiter board', icon: ConciergeBell }];
  if (role === 'cashier') {
    return [
      { to: '/kumeza/board', label: 'Waiter board', icon: ConciergeBell },
      { to: '/sales', label: 'Sales report', icon: Wallet },
    ];
  }
  return [
    { to: '/place', label: 'Today', icon: LayoutDashboard },
    { label: 'Ku Meza', icon: ConciergeBell, children: [
      { to: '/kumeza/board', label: 'Waiter board' },
      { to: '/kumeza/kitchen', label: 'Kitchen screen' },
      { to: '/kumeza/tables', label: 'Tables & QR codes' },
    ] },
    { label: 'Order Food', icon: Bike, children: [
      { to: '/place/orders', label: 'Delivery orders' },
      { to: '/place/finance', label: 'Delivery earnings' },
    ] },
    { to: '/place/bookings', label: 'Table bookings', icon: CalendarCheck },
    { to: '/place/menu', label: 'Menu', icon: BookOpen },
    { to: '/sales', label: 'Sales report', icon: Wallet },
    { label: 'Team', icon: Users, children: [
      { to: '/team/staff', label: 'Staff' },
      { to: '/team/tablets', label: 'Tablets' },
    ] },
    { label: 'Reviews & insights', icon: Star, children: [
      { to: '/place/reviews', label: 'Reviews' },
      { to: '/place/insights', label: 'Insights' },
      { to: '/place/reports', label: 'Reports' },
      ...(isCafe ? [{ to: '/place/intents', label: 'Visitor intents' }] : []),
    ] },
    { label: 'Settings', icon: Settings, children: [
      { to: '/place/settings', label: 'Profile & settings' },
      { to: '/activity', label: 'allinkigali activity' },
    ] },
  ];
};

const venue = [
  { to: '/venue', label: 'Today', icon: LayoutDashboard },
  { to: '/venue/visits', label: 'Visit requests', icon: CalendarHeart },
  { to: '/venue/profile', label: 'Venue profile', icon: Building2 },
  { to: '/venue/reviews', label: 'Reviews', icon: Star },
  { label: 'Settings', icon: Settings, children: [{ to: '/activity', label: 'allinkigali activity' }] },
];

export function navFor(me) {
  return me.place.type === 'wedding' ? venue : dining(me.place.type === 'coffeeshop', me.role);
}

// Where each person lands after signing in.
export function homeFor(me) {
  if (me.place.type === 'wedding') return '/venue';
  return { kitchen: '/kumeza/kitchen', waiter: '/kumeza/board', cashier: '/kumeza/board' }[me.role] || '/place';
}
