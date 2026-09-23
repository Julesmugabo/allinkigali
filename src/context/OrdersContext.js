/**
 * OrdersContext.js — Ibyifuzo n'aho bigeze (orders + tracking).
 *
 * Talks to our own Express + Postgres backend now (server/src/routes/orders.js),
 * not in-memory state — every screen still only ever calls useOrders().
 *
 * advanceStatus() is a development helper that walks an order forward one
 * step so you can see the tracking timeline without a real dispatch system —
 * delete it once real status updates arrive from wherever those come from.
 */
import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../services/apiClient';
import { ORDER_STATUS, STATUS_FLOW, statusIndex, canCancel } from '../data/orderStatus';
import { makeOrderRef } from '../utils/format';

const OrdersContext = createContext(null);

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshOrders = useCallback(async () => {
    try {
      const data = await apiFetch('/orders');
      setOrders(data || []);
    } catch {
      // Leave whatever was already loaded rather than blanking the list
      // over a transient network hiccup.
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshOrders();
      setIsLoading(false);
    })();
  }, [refreshOrders]);

  /**
   * Create an order from cart items. Returns the new order object so the
   * checkout screen can navigate straight to its tracking page, or null on
   * failure so the screen can show a real error instead of faking success.
   */
  const placeOrder = useCallback(async ({ items, subtotal, deliveryFee, total, deliveryAddress, phone, note }) => {
    const payload = {
      ref: makeOrderRef(),
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
      deliveryAddress: deliveryAddress || '',
      phone: phone || '',
      note: note || '',
    };

    try {
      const order = await apiFetch('/orders', { method: 'POST', body: payload });
      setOrders((current) => [order, ...current]);
      return order;
    } catch {
      return null;
    }
  }, []);

  const getOrderById = useCallback(
    (id) => orders.find((o) => o.id === id) || null,
    [orders]
  );

  const cancelOrder = useCallback(async (id) => {
    try {
      const updated = await apiFetch(`/orders/${id}/status`, {
        method: 'PATCH',
        body: { status: ORDER_STATUS.CANCELLED },
      });
      setOrders((current) => current.map((o) => (o.id === id ? updated : o)));
    } catch {
      // no-op — status stays as it was
    }
  }, []);

  /**
   * DEV ONLY — push an order to the next step in the flow.
   */
  const advanceStatus = useCallback(async (id) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    const next = STATUS_FLOW[statusIndex(order.status) + 1];
    if (!next) return;

    try {
      const updated = await apiFetch(`/orders/${id}/status`, { method: 'PATCH', body: { status: next } });
      setOrders((current) => current.map((o) => (o.id === id ? updated : o)));
    } catch {
      // no-op
    }
  }, [orders]);

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
      isLoading,
      activeOrders,
      pastOrders,
      refreshOrders,
      placeOrder,
      getOrderById,
      cancelOrder,
      advanceStatus,
    }),
    [orders, isLoading, activeOrders, pastOrders, refreshOrders, placeOrder, getOrderById, cancelOrder, advanceStatus]
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
