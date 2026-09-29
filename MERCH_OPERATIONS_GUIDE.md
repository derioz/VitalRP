# Vital RP Merchandise Store: Operations & Production Runbook

This guide contains the official operational instructions for transitioning the Vital RP merchandise store from test mode to live production, managing the Printify print-on-demand fulfillment pipeline, switching Stripe accounts, and configuring webhook automation.

---

## 1. Taking Printify Live (Official Production & Fulfillment)

When a customer pays on the storefront (`vitalrp.net/merch`), our system receives the order from Stripe and transmits it directly to the Printify API. To ensure physical products are produced and shipped automatically, configure your Printify account as follows:

### Step 1: Fund Your Printify Wallet
Printify requires a payment source on file to charge wholesale production and courier shipping costs when customer orders are received.
1. Log in to your [Printify Dashboard](https://printify.com).
2. Click your profile avatar (top right) or navigate to **Wallet / Billing** (`printify.com/app/wallet`).
3. Add a business credit/debit card, or set up an **Auto-Recharge Balance** (e.g., auto-reload $50 whenever balance drops below $20).
> **Financial Flow Note**: When a customer buys a $35 hoodie on `vitalrp.net`:
> - Stripe collects the full $35 + shipping from the customer and deposits it directly into your Stripe bank account.
> - Printify then charges your Printify Wallet the wholesale cost (e.g., ~$18) to print, package, and ship the hoodie.
> - The difference remains as your net profit.

### Step 2: Configure Order Approval Mode
1. In Printify, click your store name in the top navigation bar → **Store Settings** → **Order Settings**.
2. Under **Order Approval Settings**, choose one of the following:
   - **Automatically (after 24 hours or 1 hour)** *(Recommended)*: Gives you a buffer window to fix customer typos (such as mistyped shipping addresses) before irreversible printing starts.
   - **Immediately**: Sends the order straight into physical production the moment the payment clears.
   - **Manually**: Orders will wait under "On Hold" in your Printify dashboard until an admin clicks "Submit to Production".

### Step 3: Ensure Products Are Published & Synchronized
1. Under **My Products** in Printify, ensure each item is set to **Published** and all desired size/color variants are enabled.
2. Any time you add new products or update prices/mockups in Printify:
   - Go to [vitalrp.net/admin/merch](https://vitalrp.net/admin/merch) (or tab "Catalog Synchronization").
   - Click **"Sync Printify Catalog"** to instantly update the live Supabase catalog.

---

## 2. Switching or Changing the Stripe Account

The codebase is 100% environment-variable driven. No Stripe account IDs or credentials are hardcoded. Switching accounts only requires swapping API keys.

### Step 1: Obtain Keys from the Target Stripe Account
1. Log in to the [Stripe Dashboard](https://dashboard.stripe.com) for the account you wish to connect.
2. If launching live with real money:
   - Toggle **Test mode** OFF in the top right to enter **Live Mode**.
   - Ensure your legal business details and payout bank account are activated under **Settings → Bank accounts and scheduling**.
3. Navigate to **Developers → API keys** (`dashboard.stripe.com/apikeys`).
4. Copy:
   - **Publishable Key**: Starts with `pk_live_...` (or `pk_test_...` if using a new test account).
   - **Secret Key**: Click "Reveal key" — starts with `sk_live_...` (or `sk_test_...`).

### Step 2: Update Keys in Vercel (Production Backend)
The Next.js API routes run serverless on Vercel at `https://vital-rp.vercel.app`.
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Select the **vital-rp** project.
3. Navigate to **Settings → Environment Variables**.
4. Update or add:
   - `STRIPE_SECRET_KEY` = `<your_new_secret_key>`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `<your_new_publishable_key>`
5. Click **Save**.
6. **Redeploy**:
   - Go to the **Deployments** tab.
   - Click the three dots `...` next to the latest production deployment → Click **Redeploy**.

### Step 3: Update Local `.env.local` (Local Development)
In your local repository root file `.env.local`, update:
```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## 3. Configuring Stripe Webhooks (Automated Fulfillment)

When a customer pays on Stripe Checkout, Stripe notifies the server so the order record in Supabase is marked as `paid` and automatically forwarded to Printify for printing:

1. In your Stripe Dashboard, go to **Developers → Webhooks** (`dashboard.stripe.com/webhooks`).
2. Click **Add an endpoint** (or "Add destination").
3. Set **Endpoint URL** to:
   ```
   https://vital-rp.vercel.app/api/webhooks/stripe
   ```
4. Click **+ Select events** and select:
   - `checkout.session.completed`
5. Click **Add endpoint**.
6. Under **Signing secret**, click **Reveal** (starts with `whsec_...`).
7. Add this secret to **Vercel Project Settings → Environment Variables**:
   - Key: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_...`
8. Click **Save** and redeploy the latest Vercel deployment.

---

## 4. Architecture Overview

- **Static Frontend**: Served from GitHub Pages (`docs/` folder) on `https://vitalrp.net`.
- **API Backend**: Next.js serverless functions running on `https://vital-rp.vercel.app/api/*`.
- **Database & Auth**: Supabase PostgreSQL database storing products, variants, orders, items, and discounts.
- **POD Fulfillment**: Printify API for product catalog sync and automatic order submission.
- **Payment Gateway**: Stripe Checkout with dynamic line items, shipping address collection, and discount support.

---

## 5. Pre-Launch Verification Checklist

| Item | Requirement | Verification Method |
| :--- | :--- | :--- |
| **Printify Wallet** | Credit card or auto-recharge funded | Check Printify Wallet balance |
| **Printify Approval** | Order Approval set to 1h / 24h delay | Check Printify Store Settings |
| **Stripe Live Keys** | `sk_live_` and `pk_live_` in Vercel | Check Vercel Project Settings |
| **Stripe Webhook** | `checkout.session.completed` endpoint active | Send test ping from Stripe Webhook tab |
| **Stripe Payouts** | Bank account verified for payouts | Check Stripe Payouts dashboard |
| **Catalog Sync** | All products synced to Supabase | Check `vitalrp.net/admin/merch` |
