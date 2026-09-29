import 'server-only';

const PRINTIFY_BASE_URL = 'https://api.printify.com/v1';

export function getPrintifyToken(): string {
  const token = process.env.PRINTIFY_API_TOKEN;
  if (!token) {
    throw new Error('PRINTIFY_API_TOKEN is not configured in server environment variables.');
  }
  return token.trim();
}

export function getPrintifyShopId(): string {
  const shopId = process.env.PRINTIFY_SHOP_ID;
  if (!shopId) {
    throw new Error('PRINTIFY_SHOP_ID is not configured in server environment variables.');
  }
  return shopId.trim();
}

async function printifyFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getPrintifyToken();
  const url = `${PRINTIFY_BASE_URL}${endpoint}`;

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'VitalRP-Merch/1.0',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetails = '';
    try {
      const errorJson = await response.json();
      errorDetails = JSON.stringify(errorJson);
    } catch {
      errorDetails = await response.text();
    }
    throw new Error(`Printify API Error [${response.status} ${response.statusText}]: ${errorDetails}`);
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export interface PrintifyShop {
  id: number;
  title: string;
  sales_channel: string;
}

export interface PrintifyVariantOption {
  color?: string;
  size?: string;
}

export interface PrintifyVariant {
  id: number;
  title: string;
  options: (string | number)[];
  sku: string;
  price: number; // in cents
  cost: number;  // in cents
  is_enabled: boolean;
  is_default: boolean;
  is_available: boolean;
  grams: number;
}

export interface PrintifyImage {
  src: string;
  variant_ids: number[];
  position: string;
  is_default: boolean;
  is_selected_for_publishing?: boolean;
}

export interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  tags: string[];
  options: Array<{
    name: string;
    type: string;
    values: Array<{ id: number | string; title: string }>;
  }>;
  variants: PrintifyVariant[];
  images: PrintifyImage[];
  created_at: string;
  updated_at: string;
  visible: boolean;
  is_locked: boolean;
  blueprint_id: number;
  user_id: number;
  shop_id: number;
  print_provider_id: number;
  print_areas: Array<{
    variant_ids: number[];
    placeholders: Array<{
      position: string;
      images: Array<{
        id: string;
        name: string;
        type: string;
        src: string;
      }>;
    }>;
  }>;
}

export interface PrintifyAddress {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  country: string;
  region?: string;
  address1: string;
  address2?: string;
  city: string;
  zip: string;
}

export interface PrintifyShippingCalculationItem {
  product_id: string;
  variant_id: number;
  quantity: number;
}

export interface PrintifyShippingCalculationResponse {
  standard: number; // in cents
  express?: number; // in cents
  priority?: number;
  printify_express?: number;
  economy?: number;
}

export interface PrintifyOrderItemPayload {
  product_id: string;
  variant_id: number;
  quantity: number;
}

export interface PrintifyOrderPayload {
  external_id: string; // e.g. Vital Order Number "VRP-1001"
  label?: string;
  line_items: PrintifyOrderItemPayload[];
  shipping_method: number; // 1 = Standard
  send_shipping_notification: boolean;
  address_to: PrintifyAddress;
}

export interface PrintifyOrderResponse {
  id: string;
  address_to: PrintifyAddress;
  line_items: Array<{
    id: string;
    product_id: string;
    variant_id: number;
    quantity: number;
    status: string;
    metadata: {
      title: string;
      price: number;
      cost: number;
      sku: string;
    };
  }>;
  metadata: {
    order_type: string;
    shop_order_id: string;
    shop_order_label: string;
  };
  total_price: number;
  total_shipping: number;
  total_tax: number;
  status: string; // 'pending', 'on-hold', 'payment-not-received', 'sent-to-production', 'fulfilled', 'canceled'
  shipping_method: number;
  shipments?: Array<{
    carrier: string;
    number: string;
    url: string;
    delivered_at?: string;
  }>;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Service Methods
// ---------------------------------------------------------------------------

/**
 * Retrieve all stores linked to the API token.
 */
export async function getPrintifyShops(): Promise<PrintifyShop[]> {
  return printifyFetch<PrintifyShop[]>('/shops.json');
}

/**
 * Fetch all products in the specified shop (paginated).
 */
export async function getPrintifyProducts(
  page: number = 1,
  limit: number = 50,
  shopId: string | number = getPrintifyShopId()
): Promise<{ current_page: number; data: PrintifyProduct[]; total: number; last_page: number }> {
  return printifyFetch<{ current_page: number; data: PrintifyProduct[]; total: number; last_page: number }>(
    `/shops/${shopId}/products.json?page=${page}&limit=${limit}`
  );
}

/**
 * Fetch a single product by ID from Printify.
 */
export async function getPrintifyProduct(
  productId: string,
  shopId: string | number = getPrintifyShopId()
): Promise<PrintifyProduct> {
  return printifyFetch<PrintifyProduct>(`/shops/${shopId}/products/${productId}.json`);
}

/**
 * Calculate dynamic live shipping rates from Printify.
 */
export async function calculatePrintifyShipping(
  address: {
    address1: string;
    address2?: string;
    city: string;
    country: string;
    region?: string;
    zip: string;
  },
  lineItems: PrintifyShippingCalculationItem[],
  shopId: string | number = getPrintifyShopId()
): Promise<PrintifyShippingCalculationResponse> {
  return printifyFetch<PrintifyShippingCalculationResponse>(
    `/shops/${shopId}/orders/shipping.json`,
    {
      method: 'POST',
      body: JSON.stringify({
        address_to: address,
        line_items: lineItems,
      }),
    }
  );
}

/**
 * Submit an order to Printify for fulfillment.
 */
export async function createPrintifyOrder(
  orderPayload: PrintifyOrderPayload,
  shopId: string | number = getPrintifyShopId()
): Promise<PrintifyOrderResponse> {
  return printifyFetch<PrintifyOrderResponse>(
    `/shops/${shopId}/orders.json`,
    {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    }
  );
}

/**
 * Explicitly send an on-hold order to production in Printify.
 */
export async function sendPrintifyOrderToProduction(
  orderId: string,
  shopId: string | number = getPrintifyShopId()
): Promise<{ status: string }> {
  return printifyFetch<{ status: string }>(
    `/shops/${shopId}/orders/${orderId}/send_to_production.json`,
    {
      method: 'POST',
    }
  );
}

/**
 * Get detailed status, tracking, and shipments of a specific Printify order.
 */
export async function getPrintifyOrder(
  orderId: string,
  shopId: string | number = getPrintifyShopId()
): Promise<PrintifyOrderResponse> {
  return printifyFetch<PrintifyOrderResponse>(`/shops/${shopId}/orders/${orderId}.json`);
}

/**
 * Cancel an order in Printify if not already printed.
 */
export async function cancelPrintifyOrder(
  orderId: string,
  shopId: string | number = getPrintifyShopId()
): Promise<any> {
  return printifyFetch(`/shops/${shopId}/orders/${orderId}/cancel.json`, {
    method: 'POST',
  });
}

/**
 * Register a webhook endpoint on Printify.
 */
export async function registerPrintifyWebhook(
  topic: string,
  url: string,
  shopId: string | number = getPrintifyShopId()
): Promise<{ id: string; topic: string; url: string }> {
  return printifyFetch<{ id: string; topic: string; url: string }>(
    `/shops/${shopId}/webhooks.json`,
    {
      method: 'POST',
      body: JSON.stringify({ topic, url }),
    }
  );
}

/**
 * List registered webhooks.
 */
export async function getPrintifyWebhooks(
  shopId: string | number = getPrintifyShopId()
): Promise<Array<{ id: string; topic: string; url: string; shop_id: string }>> {
  return printifyFetch<Array<{ id: string; topic: string; url: string; shop_id: string }>>(
    `/shops/${shopId}/webhooks.json`
  );
}
