/**
 * OrdersContext.js — Ibyifuzo n'aho bigeze (orders + tracking).
 *
 * placeOrder() turns the cart into an order. advanceStatus() is a development
 * helper that walks an order forward one step so you can see the tracking
 * timeline without a backend — delete it once real status updates arrive.
 */
import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import mockOrders from '../data/mockOrders';
import { ORDER_STATUS, STATUS_FLOW, statusIndex, canCancel } from '../data/orderStatus';
import { makeOrderRef } from '../utils/format';

const OrdersContext = createContext(null);

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState(mockOrders);

  /**
   * Create an order from cart items. Returns the new order object so the
   * checkout screen can navigate straight to its tracking page.
   */
  const placeOrder = useCallback(({ items, subtotal, deliveryFee, total, deliveryAddress, phone, note }) => {
    const now = new Date().toISOString();
    const order = {
      id: `order-${Date.now()}`,
      ref: makeOrderRef(),
      createdAt: now,
      status: ORDER_STATUS.PENDING,
      deliveryAddress: deliveryAddress || '',
      phone: phone || '',
      note: note || '',
      paymentMethod: null, // filled in once the payment step is built
      items: items.map((i) => ({
        productId: i.productId,
        name: i.name,
        shortName: i.shortName,
        price: i.price,
        quantity: i.quantity,
        icon: i.icon,
        image: i.image,
      })),
      subtotal,
      deliveryFee,
      total,
      history: [{ status: ORDER_STATUS.PENDING, at: now }],
    };

    setOrders((current) => [order, ...current]);
    return order;
  }, []);

  const getOrderById = useCallback(
    (id) => orders.find((o) => o.id === id) || null,
    [orders]
  );

  const cancelOrder = useCallback((id) => {
    setOrders((current) =>
      current.map((o) =>
        o.id === id && canCancel(o.status)
          ? {
              ...o,
              status: ORDER_STATUS.CANCELLED,
              history: [...o.history, { status: ORDER_STATUS.CANCELLED, at: new Date().toISOString() }],
            }
          : o
      )
    );
  }, []);

  /**
   * DEV ONLY — push an order to the next step in the flow.
   */
  const advanceStatus = useCallback((id) => {
    setOrders((current) =>
      current.map((o) => {
        if (o.id !== id) return o;
        const next = STATUS_FLOW[statusIndex(o.status) + 1];
        if (!next) return o;
        return {
          ...o,
          status: next,
          history: [...o.history, { status: next, at: new Date().toISOString() }],
        };
      })
    );
  }, []);

  const activeOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.status !== ORDER_STATUS.DELIVERED && o.status !== ORDER_STATUS.CANCELLED
      ),
    [orders]
  );

  const pastOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.status === ORDER_STATUS.DELIVERED || o.status === ORDER_STATUS.CANCELLED
      ),
    [orders]
  );

  const value = useMemo(
    () => ({
      orders,
      activeOrders,
      pastOrders,
      placeOrder,
      getOrderById,
      cancelOrder,
      advanceStatus,
    }),
    [orders, activeOrders, pastOrders, placeOrder, getOrderById, cancelOrder, advanceStatus]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used inside <OrdersProvider>.');
  }
  return context;
}

export default OrdersContext;
