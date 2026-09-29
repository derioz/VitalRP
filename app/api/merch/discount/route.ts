export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal_cents } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Promo code is required.' }, { status: 400 });
    }

    const subtotal = Number(subtotal_cents) || 0;
    const cleanCode = code.trim().toUpperCase();

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable.' }, { status: 500 });
    }

    const { data: discount, error } = await supabase
      .from('merch_discounts')
      .select('*')
      .eq('code', cleanCode)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !discount) {
      return NextResponse.json({ error: 'Invalid or expired discount code.' }, { status: 404 });
    }

    const now = new Date();
    if (discount.starts_at && new Date(discount.starts_at) > now) {
      return NextResponse.json({ error: 'Discount code is not active yet.' }, { status: 400 });
    }
    if (discount.expires_at && new Date(discount.expires_at) < now) {
      return NextResponse.json({ error: 'Discount code has expired.' }, { status: 400 });
    }
    if (discount.max_uses && discount.uses_count >= discount.max_uses) {
      return NextResponse.json({ error: 'Discount code has reached its maximum uses.' }, { status: 400 });
    }
    if (discount.min_subtotal_cents && subtotal < discount.min_subtotal_cents) {
      const minRequired = (discount.min_subtotal_cents / 100).toFixed(2);
      return NextResponse.json(
        { error: `Minimum order subtotal of $${minRequired} required for this code.` },
        { status: 400 }
      );
    }

    let discountAmountCents = 0;
    if (discount.discount_type === 'percentage') {
      discountAmountCents = Math.round((subtotal * Number(discount.discount_value)) / 100);
    } else {
      discountAmountCents = Math.min(Math.round(Number(discount.discount_value)), subtotal);
    }

    return NextResponse.json({
      valid: true,
      code: discount.code,
      discount_type: discount.discount_type,
      discount_value: discount.discount_value,
      discount_amount_cents: discountAmountCents,
      description: discount.description,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to validate discount.' }, { status: 500 });
  }
}
