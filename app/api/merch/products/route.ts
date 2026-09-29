export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPrintifyProducts, getPrintifyProduct } from '@/lib/printify/client';
import { normalizeSlug, findProductBySlug, FALLBACK_PRODUCTS } from '@/lib/merch/catalog';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const category = searchParams.get('category');

  const supabase = createAdminClient() || createClient();

  try {
    // 1. If fetching single product by slug
    if (slug) {
      const normalized = normalizeSlug(slug);

      // Check DB by exact slug, normalized slug, or ID
      const { data: dbProduct } = await supabase
        .from('merch_products')
        .select(`
          *,
          variants:merch_variants(*)
        `)
        .or(`slug.eq.${slug},slug.eq.${normalized},id.eq.${slug},printify_product_id.eq.${slug}`)
        .maybeSingle();

      if (dbProduct) {
        return NextResponse.json({
          ...dbProduct,
          title: dbProduct.title.replace(/\s*\|.*$/, '').trim(),
          slug: normalized,
        }, { headers: corsHeaders });
      }

      // Check local catalog fallback
      const fallbackProd = findProductBySlug(slug, FALLBACK_PRODUCTS);
      if (fallbackProd) {
        return NextResponse.json(fallbackProd, { headers: corsHeaders });
      }

      // If still not found in Supabase, attempt Printify direct fetch
      try {
        const printifyProd = await getPrintifyProduct(slug);
        if (printifyProd) {
          return NextResponse.json(printifyProd, { headers: corsHeaders });
        }
      } catch {}

      return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
    }

    // 2. Fetch all products
    let query = supabase
      .from('merch_products')
      .select(`
        *,
        variants:merch_variants(*)
      `)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    const { data: dbProducts, error } = await query;

    if (dbProducts && dbProducts.length > 0) {
      return NextResponse.json({ products: dbProducts }, { headers: corsHeaders });
    }

    // 3. Fallback: if Supabase table is empty, fetch live from Printify API
    const printifyRes = await getPrintifyProducts(1, 50);
    const liveProducts = (printifyRes.data || []).map((p) => {
      let detectedCat = 'Apparel';
      const titleLower = p.title.toLowerCase();
      if (titleLower.includes('sticker') || titleLower.includes('mug') || titleLower.includes('mat')) {
        detectedCat = 'Accessories';
      }

      const minCost = p.variants.reduce((min, v) => (v.cost < min ? v.cost : min), p.variants[0]?.cost || 0);
      const minPrice = p.variants.reduce((min, v) => (v.price < min ? v.price : min), p.variants[0]?.price || 0);

      return {
        id: p.id,
        printify_product_id: p.id,
        title: p.title,
        slug: p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: p.description ? p.description.replace(/<[^>]*>?/gm, '').trim() : '',
        category: detectedCat,
        status: p.visible ? 'live' : 'draft',
        base_price_cents: minCost,
        retail_price_cents: minPrice,
        mockup_images: p.images.map((img) => ({
          src: img.src,
          position: img.position,
          is_default: img.is_default,
        })),
        variants: p.variants.map((v) => ({
          id: String(v.id),
          printify_variant_id: v.id,
          title: v.title,
          cost_cents: v.cost,
          retail_price_cents: v.price,
          is_enabled: v.is_enabled,
          is_in_stock: v.is_available,
        })),
      };
    });

    return NextResponse.json({ products: liveProducts }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error in /api/merch/products:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch products' }, { status: 500, headers: corsHeaders });
  }
}
