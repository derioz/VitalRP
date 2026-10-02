export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendShipmentNotificationEmail } from '@/lib/email/resend';
import { syncSinglePrintifyProduct } from '@/lib/printify/sync';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase admin client unavailable' }, { status: 500 });
    }

    const { type, topic, resource } = payload;
    const eventType = type || topic || 'unknown';

    // 1. Handle Product Webhook Events (e.g. product:publish:started, product:deleted)
    if (eventType.startsWith('product:') || (!eventType.startsWith('order') && (resource?.blueprint_id || resource?.variants))) {
      const productId = resource?.id ? String(resource.id) : (payload?.product_id ? String(payload.product_id) : null);

      if (!productId) {
        return NextResponse.json({ received: true, note: 'No product ID in product webhook payload' });
      }

      // Log webhook event
      await supabase.from('merch_webhook_events').insert({
        source: 'printify',
        event_id: `printify_${eventType}_${productId}_${Date.now()}`,
        event_type: eventType,
        payload,
        processed: true,
      });

      if (eventType === 'product:publish:started' || eventType === 'product:publish' || eventType === 'product:updated') {
        const syncResult = await syncSinglePrintifyProduct(productId);
        return NextResponse.json({
          received: true,
          event: eventType,
          productId,
          synced: syncResult.success,
          error: syncResult.error,
        });
      }

      if (eventType === 'product:deleted') {
        // Safely clean up local catalog record if product was deleted in Printify
        await supabase
          .from('merch_products')
          .delete()
          .eq('printify_product_id', productId);

        return NextResponse.json({
          received: true,
          event: eventType,
          productId,
          deletedLocally: true,
        });
      }

      return NextResponse.json({ received: true, event: eventType, productId });
    }

    // 2. Handle Order Webhook Events
    const printifyOrderId = resource?.id ? String(resource.id) : null;

    if (!printifyOrderId) {
      return NextResponse.json({ received: true, note: 'No printify order ID in payload' });
    }

    // Log the event
    await supabase.from('merch_webhook_events').insert({
      source: 'printify',
      event_id: `printify_${eventType}_${printifyOrderId}_${Date.now()}`,
      event_type: eventType || 'order:updated',
      payload,
      processed: false,
    });

    // Lookup order in Supabase
    const { data: order } = await supabase
      .from('merch_orders')
      .select('*')
      .eq('printify_order_id', printifyOrderId)
      .maybeSingle();

    if (!order) {
      console.warn(`[Printify Webhook] No matching order found for Printify Order ID: ${printifyOrderId}`);
      return NextResponse.json({ received: true, note: 'Order not matched' });
    }

    // Handle shipment created
    if (type === 'order:shipment:created' || resource.shipments?.length > 0) {
      const shipment = resource.shipments?.[0];
      const trackingNumber = shipment?.number || null;
      const carrier = shipment?.carrier || 'Standard Carrier';
      const trackingUrl = shipment?.url || null;

      await supabase
        .from('merch_orders')
        .update({
          fulfillment_status: 'shipped',
          printify_status: 'fulfilled',
          tracking_number: trackingNumber,
          carrier,
          tracking_url: trackingUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (trackingNumber && order.customer_email) {
        await sendShipmentNotificationEmail({
          orderNumber: order.order_number,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          carrier,
          trackingNumber,
          trackingUrl,
        });
      }
    } else if (type === 'order:sent-to-production' || resource.status === 'sent-to-production') {
      await supabase
        .from('merch_orders')
        .update({
          fulfillment_status: 'in_production',
          printify_status: 'sent-to-production',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);
    } else if (type === 'order:shipment:delivered' || resource.status === 'delivered') {
      await supabase
        .from('merch_orders')
        .update({
          fulfillment_status: 'delivered',
          printify_status: 'delivered',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);
    } else if (resource.status === 'canceled') {
      await supabase
        .from('merch_orders')
        .update({
          fulfillment_status: 'canceled',
          printify_status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling Printify webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
