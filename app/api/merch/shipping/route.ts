import { NextRequest, NextResponse } from 'next/server';
import { calculatePrintifyShipping, PrintifyShippingCalculationItem } from '@/lib/printify/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, items } = body;

    if (!address || !address.address1 || !address.city || !address.country || !address.zip) {
      return NextResponse.json(
        { error: 'Valid shipping address (address1, city, country, zip) is required.' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required to calculate shipping.' },
        { status: 400 }
      );
    }

    const lineItems: PrintifyShippingCalculationItem[] = items.map((item: any) => ({
      product_id: String(item.printify_product_id || item.product_id),
      variant_id: Number(item.printify_variant_id || item.variant_id),
      quantity: Number(item.quantity) || 1,
    }));

    const rates = await calculatePrintifyShipping(address, lineItems);

    return NextResponse.json({
      standard_cents: rates.standard || 600,
      express_cents: rates.express || null,
      standard_formatted: `$${((rates.standard || 600) / 100).toFixed(2)}`,
    });
  } catch (error: any) {
    console.error('Error calculating shipping via Printify:', error);
    // Provide a resilient fallback rate if Printify shipping API fails or address is international
    return NextResponse.json({
      standard_cents: 650,
      standard_formatted: '$6.50',
      is_fallback: true,
      notice: 'Estimated standard shipping rate applied.',
    });
  }
}
