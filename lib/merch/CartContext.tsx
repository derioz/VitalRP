'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  printify_product_id: string;
  printify_variant_id: number;
  product_id?: string;
  title: string;
  variant_title: string;
  size?: string;
  color?: string;
  price_cents: number;
  quantity: number;
  image_url?: string;
  slug?: string;
}

export interface AppliedDiscount {
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  discount_amount_cents: number;
  description?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totalItems: number;
  subtotalCents: number;
  discount: AppliedDiscount | null;
  applyDiscount: (code: string) => Promise<{ success: boolean; error?: string }>;
  removeDiscount: () => void;
  isCheckingOut: boolean;
  initiateCheckout: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_STORAGE_KEY = 'vital_merch_cart_v1';
const DISCOUNT_STORAGE_KEY = 'vital_merch_discount_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<AppliedDiscount | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
      const storedDiscount = localStorage.getItem(DISCOUNT_STORAGE_KEY);
      if (storedDiscount) {
        setDiscount(JSON.parse(storedDiscount));
      }
    } catch (err) {
      console.warn('Failed to parse cart storage:', err);
    } finally {
      setHasLoaded(true);
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (!hasLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      if (discount) {
        localStorage.setItem(DISCOUNT_STORAGE_KEY, JSON.stringify(discount));
      } else {
        localStorage.removeItem(DISCOUNT_STORAGE_KEY);
      }
    } catch (err) {
      console.warn('Failed to persist cart:', err);
    }
  }, [items, discount, hasLoaded]);

  const addItem = (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.printify_variant_id === item.printify_variant_id
      );

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      }

      return [...prev, { ...item, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeItem = (variantId: number) => {
    setItems((prev) => prev.filter((i) => i.printify_variant_id !== variantId));
  };

  const updateQuantity = (variantId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.printify_variant_id === variantId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    setDiscount(null);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(DISCOUNT_STORAGE_KEY);
    } catch {}
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.price_cents * item.quantity,
    0
  );

  const applyDiscount = async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/merch/discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal_cents: subtotalCents }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return { success: false, error: 'Discount service temporarily unavailable' };
      }
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid code' };
      }
      setDiscount(data);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Validation failed' };
    }
  };

  const removeDiscount = () => {
    setDiscount(null);
  };

  const initiateCheckout = async () => {
    if (items.length === 0) return;
    setIsCheckingOut(true);
    try {
      const res = await fetch('/api/merch/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          discountCode: discount?.code,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Checkout service is currently initializing on the server. Please try again in a few moments.');
      }

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to initialize checkout session');
      }

      window.location.href = data.url;
    } catch (err: any) {
      alert(`Checkout Error: ${err.message}`);
      setIsCheckingOut(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        totalItems,
        subtotalCents,
        discount,
        applyDiscount,
        removeDiscount,
        isCheckingOut,
        initiateCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
