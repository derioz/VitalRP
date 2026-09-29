import 'server-only';
import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_build_key';
    stripeInstance = new Stripe(key.trim(), {
      apiVersion: '2025-02-24.acacia' as any,
      appInfo: {
        name: 'Vital RP Merch Store',
        version: '1.0.0',
      },
    });
  }
  return stripeInstance;
}

// Lazy proxy so importing this module never throws at build time
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripe();
    const value = (instance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});
