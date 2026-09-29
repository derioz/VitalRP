import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);
  const isAdmin = session && (hasPermission(session.effectivePermissions, 'merch.view', session.discordId) || session.isSuperAdmin);

  // Look up by order_number (VRP-1001), uuid, or stripe checkout session ID
  let query = supabase
    .from('merch_orders')
    .select(`
      id,
      order_number,
      customer_name,
      customer_email,
      subtotal_cents,
      shipping_cents,
      tax_cents,
      discount_cents,
      discount_code,
      total_cents,
      currency,
      payment_status,
      fulfillment_status,
      printify_status,
      tracking_number,
      carrier,
      tracking_url,
      created_at,
      user_id,
      discord_id,
      items:merch_order_items(
        id,
        product_title,
        variant_title,
        size,
        color,
        image_url,
        unit_price_cents,
        quantity,
        total_cents
      )
    `);

  if (orderId.startsWith('cs_')) {
    query = query.eq('stripe_checkout_session_id', orderId);
  } else if (orderId.startsWith('VRP-')) {
    query = query.eq('order_number', orderId);
  } else {
    query = query.eq('id', orderId);
  }

  const { data: order, error } = await query.maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Security check: If order has an associated user_id, ensure caller is that user or an admin
  if (order.user_id && session && !isAdmin && order.user_id !== session.id) {
    return NextResponse.json({ error: 'Unauthorized to view this order' }, { status: 403 });
  }

  return NextResponse.json(order);
}
