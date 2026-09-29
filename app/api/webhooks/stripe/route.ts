export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPrintifyOrder, PrintifyAddress } from '@/lib/printify/client';
import { sendOrderConfirmationEmail } from '@/lib/email/resend';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    if (webhookSecret && !webhookSecret.includes('your_webhook_signing_secret')) {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      // In development if webhook secret is not set, parse the payload directly with a warning
      console.warn('[Stripe Webhook] Warning: STRIPE_WEBHOOK_SECRET not configured. Verifying event from body.');
      event = JSON.parse(rawBody) as Stripe.Event;
    }
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase admin unavailable' }, { status: 500 });
  }

  // 1. Idempotency Check
  const { data: existingEvent } = await supabase
    .from('merch_webhook_events')
    .select('id, processed')
    .eq('event_id', event.id)
    .maybeSingle();

  if (existingEvent && existingEvent.processed) {
    return NextResponse.json({ received: true, message: 'Event already processed' });
  }

  // Log incoming webhook event
  await supabase.from('merch_webhook_events').upsert({
    source: 'stripe',
    event_id: event.id,
    event_type: event.type,
    payload: event as any,
    processed: false,
  });

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Extract shipping details from Stripe session
      const shippingDetails = (session as any).shipping_details || session.customer_details;
      const customerName = shippingDetails?.name || session.customer_details?.name || 'Customer';
      const customerEmail = session.customer_details?.email || 'customer@vitalrp.net';
      const shippingAddress = shippingDetails?.address;

      const [firstName, ...lastNameParts] = customerName.trim().split(' ');
      const lastName = lastNameParts.join(' ') || 'Customer';

      const formattedAddress: PrintifyAddress = {
        first_name: firstName,
        last_name: lastName,
        email: customerEmail,
        phone: session.customer_details?.phone || undefined,
        country: shippingAddress?.country || 'US',
        region: shippingAddress?.state || undefined,
        address1: shippingAddress?.line1 || 'Address Line 1',
        address2: shippingAddress?.line2 || undefined,
        city: shippingAddress?.city || 'City',
        zip: shippingAddress?.postal_code || '00000',
      };

      // Retrieve or update pending order
      const { data: order, error: orderFetchError } = await supabase
        .from('merch_orders')
        .select(`
          *,
          items:merch_order_items(*)
        `)
        .eq('stripe_checkout_session_id', session.id)
        .maybeSingle();

      if (orderFetchError || !order) {
        console.error(`Order not found for Stripe session ${session.id}`);
        throw new Error(`Order not found for Stripe session ${session.id}`);
      }

      // If already paid and fulfilled to Printify, avoid duplicate submission
      if (order.payment_status === 'paid' && order.printify_order_id) {
        return NextResponse.json({ received: true, notice: 'Order already fulfilled.' });
      }

      const totalTax = session.total_details?.amount_tax || 0;
      const totalShipping = session.total_details?.amount_shipping || 0;
      const totalDiscount = session.total_details?.amount_discount || 0;
      const finalTotal = session.amount_total || order.total_cents;

      // 2. Mark order as Paid in Supabase
      await supabase
        .from('merch_orders')
        .update({
          customer_email: customerEmail,
          customer_name: customerName,
          shipping_address: formattedAddress as any,
          tax_cents: totalTax,
          shipping_cents: totalShipping,
          discount_cents: totalDiscount,
          total_cents: finalTotal,
          payment_status: 'paid',
          stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      // 3. Submit Order to Printify for Automated Fulfillment
      const printifyLineItems = (order.items || []).map((item: any) => ({
        product_id: String(item.printify_product_id),
        variant_id: Number(item.printify_variant_id),
        quantity: Number(item.quantity) || 1,
      }));

      try {
        const printifyResponse = await createPrintifyOrder({
          external_id: order.order_number,
          label: `Vital RP Store - ${order.order_number}`,
          line_items: printifyLineItems,
          shipping_method: 1, // Standard shipping
          send_shipping_notification: false, // We send our own branded email
          address_to: formattedAddress,
        });

        // 4. Update order with Printify fulfillment details
        await supabase
          .from('merch_orders')
          .update({
            printify_order_id: printifyResponse.id,
            printify_status: printifyResponse.status || 'pending',
            fulfillment_status: 'submitted',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        console.log(`[Order Fulfilled] Order #${order.order_number} submitted to Printify (ID: ${printifyResponse.id})`);
      } catch (printifyError: any) {
        console.error(`[Printify Fulfillment Failed] Order #${order.order_number}:`, printifyError);
        // Do not crash the webhook; record actionable error for admins
        await supabase
          .from('merch_orders')
          .update({
            fulfillment_status: 'fulfillment_error',
            fulfillment_error_message: printifyError.message || 'Printify order creation failed.',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);
      }

      // 5. Send Branded Order Confirmation Email via Resend
      try {
        const emailItems = (order.items || []).map((item: any) => ({
          title: item.product_title,
          variant: [item.variant_title, item.size ? `Size: ${item.size}` : '', item.color ? `Color: ${item.color}` : '']
            .filter(Boolean)
            .join(' · '),
          quantity: item.quantity,
          price: `$${((item.unit_price_cents * item.quantity) / 100).toFixed(2)}`,
        }));

        await sendOrderConfirmationEmail({
          orderNumber: order.order_number,
          customerName,
          customerEmail,
          items: emailItems,
          subtotal: `$${(order.subtotal_cents / 100).toFixed(2)}`,
          shipping: `$${(totalShipping / 100).toFixed(2)}`,
          tax: `$${(totalTax / 100).toFixed(2)}`,
          discount: totalDiscount > 0 ? `$${(totalDiscount / 100).toFixed(2)}` : undefined,
          total: `$${(finalTotal / 100).toFixed(2)}`,
          shippingAddress: {
            line1: formattedAddress.address1,
            line2: formattedAddress.address2,
            city: formattedAddress.city,
            state: formattedAddress.region,
            postal_code: formattedAddress.zip,
            country: formattedAddress.country,
          },
          trackingUrl: `https://vitalrp.net/merch/order/${order.order_number}`,
        });
      } catch (emailErr) {
        console.warn('Failed to send confirmation email:', emailErr);
      }
    }

    // Mark event as successfully processed
    await supabase
      .from('merch_webhook_events')
      .update({ processed: true })
      .eq('event_id', event.id);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling Stripe webhook event:', error);
    await supabase
      .from('merch_webhook_events')
      .update({ error: error.message })
      .eq('event_id', event.id);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
