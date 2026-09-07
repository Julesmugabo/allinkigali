/**
 * CartContext.js — Agatebo (the shopping cart).
 *
 * Add / remove / change quantity, plus the running totals. Kept deliberately
 * small: it knows about line items and money, nothing about screens.
 */
import React, { createContext, useContext, useMemo, useReducer, useCallback } from 'react';

const CartContext = createContext(null);

// Flat delivery fee inside Kigali. Move this to your API config later.
export const DELIVERY_FEE = 1500;
export const FREE_DELIVERY_FROM = 50000;

const initialState = { items: [] };

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const { product, quantity } = action;
      const existing = state.items.find((i) => i.productId === product.id);

      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i
          ),
        };
      }

      return {
        ...state,
        items: [
          ...state.items,
          {
            productId: product.id,
            name: product.name,
            shortName: product.shortName,
            price: product.price,
            icon: product.icon,
            image: product.image,
            size: product.size,
            brand: product.brand,
            quantity,
          },
        ],
      };
    }

    case 'SET_QUANTITY': {
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.productId !== action.productId) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, quantity: action.quantity } : i
        ),
      };
    }

    case 'ADD_ONE':
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, quantity: i.quantity + 1 } : i
        ),
      };

    case 'REMOVE':
      return { ...state, items: state.items.filter((i) => i.productId !== action.productId) };

    case 'CLEAR':
      return initialState;

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = useCallback((product, quantity = 1) => {
    dispatch({ type: 'ADD', product, quantity });
  }, []);

  const setQuantity = useCallback((productId, quantity) => {
    dispatch({ type: 'SET_QUANTITY', productId, quantity });
  }, []);

  const increment = useCallback((productId) => {
    dispatch({ type: 'ADD_ONE', productId });
  }, []);

  const removeItem = useCallback((productId) => {
    dispatch({ type: 'REMOVE', productId });
  }, []);

  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  const getQuantity = useCallback(
    (productId) => {
      const line = state.items.find((i) => i.productId === productId);
      return line ? line.quantity : 0;
    },
    [state.items]
  );

  const totals = useMemo(() => {
    const count = state.items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const deliveryFee = subtotal === 0 || subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
    return {
      count,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      isEmpty: count === 0,
    };
  }, [state.items]);

  const value = useMemo(
    () => ({
      items: state.items,
      ...totals,
      addItem,
      setQuantity,
      increment,
      removeItem,
      clearCart,
      getQuantity,
    }),
    [state.items, totals, addItem, setQuantity, increment, removeItem, clearCart, getQuantity]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside <CartProvider>.');
  }
  return context;
}

export default CartContext;
