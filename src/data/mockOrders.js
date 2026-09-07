/**
 * mockOrders.js — Ibyifuzo by'igeragezwa (seeded order history).
 * Gives the "Me" tab something to show before the user places a real order.
 */
import { ORDER_STATUS } from './orderStatus';
import { hoursAgo } from '../utils/date';

export const mockOrders = [
  {
    id: 'seed-1',
    ref: 'ORD-4KD92X',
    createdAt: hoursAgo(3),
    status: ORDER_STATUS.DISPATCHED,
    deliveryAddress: 'Kimironko, KG 11 Ave',
    phone: '0788 123 456',
    paymentMethod: null, // payment flow comes later
    items: [
      {
        productId: 'gas-12kg-refill',
        name: 'SP Gaz 12kg — Kongera gushyiramo',
        shortName: '12kg refill',
        price: 21500,
        quantity: 1,
        icon: 'gas-cylinder',
        image: null,
      },
    ],
    subtotal: 21500,
    deliveryFee: 1500,
    total: 23000,
    // Timestamps for each step reached so far — the timeline reads this.
    history: [
      { status: ORDER_STATUS.PENDING, at: hoursAgo(3) },
      { status: ORDER_STATUS.CONFIRMED, at: hoursAgo(2.5) },
      { status: ORDER_STATUS.DISPATCHED, at: hoursAgo(0.6) },
    ],
  },
  {
    id: 'seed-2',
    ref: 'ORD-7QP31M',
    createdAt: hoursAgo(72),
    status: ORDER_STATUS.DELIVERED,
    deliveryAddress: 'Nyamirambo, KN 2 St',
    phone: '0788 123 456',
    paymentMethod: null,
    items: [
      {
        productId: 'gas-6kg-refill',
        name: 'SP Gaz 6kg — Kongera gushyiramo',
        shortName: '6kg refill',
        price: 12000,
        quantity: 2,
        icon: 'gas-cylinder',
        image: null,
      },
      {
        productId: 'gas-regulator',
        name: 'Umuyoboro wa gaz + Regulator',
        shortName: 'Umuyoboro',
        price: 8500,
        quantity: 1,
        icon: 'pipe-valve',
        image: null,
      },
    ],
    subtotal: 32500,
    deliveryFee: 1500,
    total: 34000,
    history: [
      { status: ORDER_STATUS.PENDING, at: hoursAgo(72) },
      { status: ORDER_STATUS.CONFIRMED, at: hoursAgo(71) },
      { status: ORDER_STATUS.DISPATCHED, at: hoursAgo(70) },
      { status: ORDER_STATUS.DELIVERED, at: hoursAgo(69) },
    ],
  },
];

export default mockOrders;
