import 'server-only';
import Stripe from 'stripe';

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured in server environment variables.');
  }
  return key.trim();
}

export const stripe = new Stripe(getStripeSecretKey(), {
  apiVersion: '2025-02-24.acacia' as any,
  appInfo: {
    name: 'Vital RP Merch Store',
    version: '1.0.0',
  },
});
