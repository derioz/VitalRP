export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentSession } from '@/lib/auth/session';
import { getPrintifyProduct } from '@/lib/printify/client';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(request: NextRequest) {
  const originHeader = request.headers.get('origin') || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': originHeader === 'null' ? '*' : originHeader,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };
  try {
    const body = await request.json();
    const { items, discountCode, successUrl, cancelUrl } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400, headers: corsHeaders });
    }

    // Optional user session (for linking order to user)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const session = await getCurrentSession(token);

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable.' }, { status: 500, headers: corsHeaders });
    }

    // 1. Authoritative Server-Side Price Verification
    const validatedItems: Array<{
      printify_product_id: string;
      printify_variant_id: number;
      product_id?: string;
      variant_id?: string;
      title: string;
      variant_title: string;
      size?: string;
      color?: string;
      unit_price_cents: number;
      quantity: number;
      image_url?: string;
    }> = [];

    let calculatedSubtotalCents = 0;

    for (const item of items) {
      const printifyProductId = String(item.printify_product_id || item.product_id);
      const printifyVariantId = Number(item.printify_variant_id || item.variant_id);
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);

      // Check Supabase first
      const { data: dbVariant } = await supabase
        .from('merch_variants')
        .select(`
          id,
          title,
          size,
          color,
          retail_price_cents,
          is_in_stock,
          is_enabled,
          product:merch_products(id, title, mockup_images)
        `)
        .eq('printify_variant_id', printifyVariantId)
        .maybeSingle();

      if (dbVariant && dbVariant.product) {
        const prod = dbVariant.product as any;
        const price = dbVariant.retail_price_cents;
        const images = Array.isArray(prod.mockup_images) ? prod.mockup_images : [];
        const defaultImg = images.find((i: any) => i.is_default)?.src || images[0]?.src || '';

        validatedItems.push({
          printify_product_id: printifyProductId,
          printify_variant_id: printifyVariantId,
          product_id: prod.id,
          variant_id: dbVariant.id,
          title: prod.title,
          variant_title: dbVariant.title,
          size: dbVariant.size,
          color: dbVariant.color,
          unit_price_cents: price,
          quantity,
          image_url: defaultImg,
        });

        calculatedSubtotalCents += price * quantity;
      } else {
        // Fallback: Query Printify directly to get exact retail price
        const printifyProd = await getPrintifyProduct(printifyProductId);
        const variant = printifyProd.variants.find((v) => v.id === printifyVariantId);
        if (!variant) {
          throw new Error(`Variant ${printifyVariantId} not found in catalog.`);
        }

        const defaultImg = printifyProd.images.find((i) => i.is_default)?.src || printifyProd.images[0]?.src || '';

        validatedItems.push({
          printify_product_id: printifyProductId,
          printify_variant_id: printifyVariantId,
          title: printifyProd.title,
          variant_title: variant.title,
          unit_price_cents: variant.price,
          quantity,
          image_url: defaultImg,
        });

        calculatedSubtotalCents += variant.price * quantity;
      }
    }

    // 2. Authoritative Discount Validation
    let discountCents = 0;
    let appliedDiscountCode: string | null = null;
    let stripeCouponId: string | undefined = undefined;

    if (discountCode && typeof discountCode === 'string') {
      const cleanCode = discountCode.trim().toUpperCase();
      const { data: dbDiscount } = await supabase
        .from('merch_discounts')
        .select('*')
        .eq('code', cleanCode)
        .eq('is_active', true)
        .maybeSingle();

      if (dbDiscount) {
        appliedDiscountCode = dbDiscount.code;
        if (dbDiscount.discount_type === 'percentage') {
          discountCents = Math.round((calculatedSubtotalCents * Number(dbDiscount.discount_value)) / 100);
          // Create temporary or retrieved Stripe coupon
          const coupon = await stripe.coupons.create({
            percent_off: Number(dbDiscount.discount_value),
            duration: 'once',
            name: `${dbDiscount.code} (${dbDiscount.discount_value}% Off)`,
          });
          stripeCouponId = coupon.id;
        } else {
          discountCents = Math.min(Math.round(Number(dbDiscount.discount_value)), calculatedSubtotalCents);
          const coupon = await stripe.coupons.create({
            amount_off: discountCents,
            currency: 'usd',
            duration: 'once',
            name: `${dbDiscount.code} ($${(discountCents / 100).toFixed(2)} Off)`,
          });
          stripeCouponId = coupon.id;
        }
      }
    }

    // 3. Build Stripe Line Items
    const stripeLineItems = validatedItems.map((item) => ({
      price_data: {
        currency: 'usd',
        unit_amount: item.unit_price_cents,
        tax_behavior: 'exclusive' as const,
        product_data: {
          name: item.title,
          description: [item.variant_title, item.size ? `Size: ${item.size}` : '', item.color ? `Color: ${item.color}` : '']
            .filter(Boolean)
            .join(' | ') || undefined,
          images: item.image_url ? [item.image_url] : undefined,
          metadata: {
            printify_product_id: item.printify_product_id,
            printify_variant_id: String(item.printify_variant_id),
          },
        },
      },
      quantity: item.quantity,
    }));

    const origin = originHeader && originHeader !== '*' && originHeader !== 'null' ? originHeader : (request.nextUrl.origin || 'https://vitalrp.net');
    const finalSuccessUrl = successUrl || `${origin}/merch/order/{CHECKOUT_SESSION_ID}?success=true`;
    const finalCancelUrl = cancelUrl || `${origin}/merch?canceled=true`;

    // 4. Create Stripe Checkout Session
    const sessionParams: any = {
      line_items: stripeLineItems,
      mode: 'payment',
      discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : undefined,
      managed_payments: { enabled: false },
      automatic_tax: { enabled: false },
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: [
          'US', 'CA', 'GB', 'AU', 'NZ', 'DE', 'FR', 'NL', 'SE', 'NO', 'DK', 'IE', 'ES', 'IT'
        ],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 650, currency: 'usd' },
            display_name: 'Standard Printify Fulfillment',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 7 },
            },
          },
        },
      ],
      customer_email: session?.email || undefined,
      metadata: {
        userId: session?.id || '',
        discordId: session?.discordId || '',
        discountCode: appliedDiscountCode || '',
        itemCount: String(validatedItems.length),
      },
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
    };

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    // 5. Pre-create Pending Order in Supabase
    const { data: newOrder, error: orderError } = await supabase
      .from('merch_orders')
      .insert({
        user_id: session?.id || null,
        discord_id: session?.discordId || null,
        customer_email: session?.email || 'pending@vitalrp.net',
        customer_name: session?.displayName || 'Customer',
        shipping_address: {},
        subtotal_cents: calculatedSubtotalCents,
        discount_cents: discountCents,
        discount_code: appliedDiscountCode,
        total_cents: Math.max(0, calculatedSubtotalCents - discountCents + 650),
        currency: 'usd',
        payment_status: 'pending',
        fulfillment_status: 'unfulfilled',
        stripe_checkout_session_id: checkoutSession.id,
        metadata: {
          items: validatedItems,
        },
      })
      .select('id, order_number')
      .single();

    if (orderError) {
      console.warn('Could not pre-insert pending order into Supabase:', orderError);
    } else if (newOrder) {
      // Insert items
      const orderItemsToInsert = validatedItems.map((item) => ({
        order_id: newOrder.id,
        product_id: item.product_id || null,
        variant_id: item.variant_id || null,
        printify_product_id: item.printify_product_id,
        printify_variant_id: item.printify_variant_id,
        product_title: item.title,
        variant_title: item.variant_title,
        size: item.size || null,
        color: item.color || null,
        image_url: item.image_url || null,
        unit_price_cents: item.unit_price_cents,
        quantity: item.quantity,
        total_cents: item.unit_price_cents * item.quantity,
      }));

      await supabase.from('merch_order_items').insert(orderItemsToInsert);
    }

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate checkout.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
