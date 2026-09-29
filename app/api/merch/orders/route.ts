import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const isAll = searchParams.get('all') === 'true';

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  const isAdmin = hasPermission(session.effectivePermissions, 'merch.view', session.discordId) || session.isSuperAdmin;

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
      items:merch_order_items(
        id,
        product_title,
        variant_title,
        size,
        color,
        image_url,
        quantity,
        total_cents
      )
    `)
    .order('created_at', { ascending: false });

  if (isAll && isAdmin) {
    // Admin retrieving all store orders
    const { data: orders, error } = await query.limit(100);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ orders });
  }

  // Customer viewing their personal order history
  query = query.or(`user_id.eq.${session.id},discord_id.eq.${session.discordId}`);
  const { data: userOrders, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: userOrders || [] });
}
