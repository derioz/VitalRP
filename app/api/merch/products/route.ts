export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPrintifyProducts, getPrintifyProduct } from '@/lib/printify/client';
import { sortMockupImages, resolvePrintifyCategory } from '@/lib/printify/sync';
import { normalizeSlug, findProductBySlug, FALLBACK_PRODUCTS, parseProductDescription } from '@/lib/merch/catalog';
import { getCurrentSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';

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
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const category = searchParams.get('category');
  const isAdminMode = searchParams.get('admin') === 'true';

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
        // If product is disabled/archived and requester is not admin, treat as 404
        if (dbProduct.status === 'disabled' && !isAdminMode) {
          return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
        }

        const parsed = parseProductDescription(dbProduct.description);
        return NextResponse.json({
          ...dbProduct,
          title: dbProduct.title.replace(/\s*\|.*$/, '').trim(),
          slug: normalized,
          description: parsed.cleanDescription,
          details: (dbProduct.details && dbProduct.details.length > 0) ? dbProduct.details : parsed.details,
        }, { headers: corsHeaders });
      }

      // Check local catalog fallback (only for active known items)
      const fallbackProd = findProductBySlug(slug, FALLBACK_PRODUCTS);
      if (fallbackProd) {
        return NextResponse.json(fallbackProd, { headers: corsHeaders });
      }

      // If still not found in Supabase, attempt Printify direct fetch
      try {
        const printifyProd = await getPrintifyProduct(slug);
        if (printifyProd && (printifyProd.visible || isAdminMode)) {
          return NextResponse.json(printifyProd, { headers: corsHeaders });
        }
      } catch {}

      return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
    }

    // 2. Fetch all products
    let printifyProductsMap: Map<string, any> | null = null;
    let rawPrintifyProducts: any[] = [];

    if (isAdminMode) {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
      const session = await getCurrentSession(token);
      if (
        session &&
        (hasPermission(session.effectivePermissions, 'merch.manage', session.discordId) ||
          hasPermission(session.effectivePermissions, 'merch.view', session.discordId) ||
          session.isSuperAdmin)
      ) {
        try {
          const printifyRes = await getPrintifyProducts(1, 100);
          if (printifyRes?.data) {
            rawPrintifyProducts = printifyRes.data;
            printifyProductsMap = new Map();
            for (const item of printifyRes.data) {
              printifyProductsMap.set(String(item.id), item);
            }
          }
        } catch (printifyFetchErr) {
          console.warn('[Products API] Could not fetch live Printify status for admin list:', printifyFetchErr);
        }
      }
    }

    let query = supabase
      .from('merch_products')
      .select(`
        *,
        variants:merch_variants(*)
      `)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Exclude disabled/archived products from active storefront and active admin listing
    if (!isAdminMode) {
      query = query.in('status', ['live', 'sample_ordered', 'approved']);
    } else {
      query = query.neq('status', 'disabled');
    }

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    const { data: dbProducts, error } = await query;

    if (error) {
      console.error('[Products API] Database query error:', error.message);
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500, headers: corsHeaders });
    }

    if (dbProducts && dbProducts.length > 0) {
      const normalizedProducts: any[] = dbProducts.map((p) => {
        const parsed = parseProductDescription(p.description);
        const cleanTitle = p.title.replace(/\s*\|.*$/, '').trim();
        const pLive = printifyProductsMap ? printifyProductsMap.get(String(p.printify_product_id)) : null;

        const isLocked = Boolean(pLive ? pLive.is_locked : false);
        const isPublished = Boolean(pLive?.external?.handle && pLive.external.handle.trim() !== '' && pLive.visible);

        let printifyStatus: 'LIVE' | 'UNPUBLISHED' | 'PUBLISHING' | 'PUBLISHING ERROR' | 'ARCHIVED' = 'UNPUBLISHED';
        if (p.status === 'disabled') {
          printifyStatus = 'ARCHIVED';
        } else if (isLocked) {
          printifyStatus = 'PUBLISHING';
        } else if (p.status === 'publishing_error') {
          printifyStatus = 'PUBLISHING ERROR';
        } else if (isPublished) {
          printifyStatus = 'LIVE';
        } else {
          printifyStatus = 'UNPUBLISHED';
        }

        return {
          ...p,
          title: cleanTitle,
          slug: normalizeSlug(p.slug),
          description: parsed.cleanDescription,
          details: (p.details && p.details.length > 0) ? p.details : parsed.details,
          is_locked: isLocked,
          is_stuck_publishing: isLocked,
          printify_visible: pLive ? Boolean(pLive.visible) : undefined,
          printify_published: isPublished,
          printify_status: printifyStatus,
        };
      });

      // If in admin mode, also append any Printify products not currently in Supabase (e.g. stuck publishing before sync)
      if (isAdminMode && printifyProductsMap) {
        const existingPrintifyIds = new Set(dbProducts.map((p) => String(p.printify_product_id)));
        for (const p of rawPrintifyProducts) {
          if (!existingPrintifyIds.has(String(p.id))) {
            const minCost = p.variants?.reduce((min: number, v: any) => (v.cost < min ? v.cost : min), p.variants[0]?.cost || 0) || 0;
            const minPrice = p.variants?.reduce((min: number, v: any) => (v.price < min ? v.price : min), p.variants[0]?.price || 0) || 0;
            const isProdLocked = Boolean(p.is_locked);
            const isProdPublished = Boolean(p.external?.handle && p.external.handle.trim() !== '' && p.visible);
            let prodStatus: 'LIVE' | 'UNPUBLISHED' | 'PUBLISHING' = 'UNPUBLISHED';
            if (isProdLocked) prodStatus = 'PUBLISHING';
            else if (isProdPublished) prodStatus = 'LIVE';

            const detectedCat = resolvePrintifyCategory({
              productTitle: p.title,
              tags: p.tags,
            });

            normalizedProducts.push({
              id: p.id,
              printify_product_id: p.id,
              title: p.title,
              slug: p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
              description: p.description ? p.description.replace(/<[^>]*>?/gm, '').trim() : '',
              category: detectedCat,
              status: isProdLocked ? 'publishing' : (isProdPublished ? 'live' : 'draft'),
              base_price_cents: minCost,
              retail_price_cents: minPrice,
              is_locked: isProdLocked,
              is_stuck_publishing: isProdLocked,
              printify_visible: Boolean(p.visible),
              printify_published: isProdPublished,
              printify_status: prodStatus,
              mockup_images: sortMockupImages(p.images || []),
              variants: p.variants?.map((v: any) => ({
                id: String(v.id),
                printify_variant_id: v.id,
                title: v.title,
                cost_cents: v.cost,
                retail_price_cents: v.price,
                is_enabled: v.is_enabled,
                is_in_stock: v.is_available,
              })) || [],
              source: 'printify_only',
            });
          }
        }
      }

      return NextResponse.json({ products: normalizedProducts }, { headers: corsHeaders });
    }

    // 3. Fallback: if Supabase table is empty, fetch live from Printify API
    const printifyRes = await getPrintifyProducts(1, 50);
    const liveProducts = (printifyRes.data || [])
      .filter((p) => isAdminMode || p.visible)
      .map((p) => {
      const detectedCat = resolvePrintifyCategory({
        productTitle: p.title,
        tags: p.tags,
      });

      const minCost = p.variants.reduce((min, v) => (v.cost < min ? v.cost : min), p.variants[0]?.cost || 0);
      const minPrice = p.variants.reduce((min, v) => (v.price < min ? v.price : min), p.variants[0]?.price || 0);
      const isLocked = Boolean(p.is_locked);
      const isPublished = Boolean(p.external?.handle && p.external.handle.trim() !== '' && p.visible);

      return {
        id: p.id,
        printify_product_id: p.id,
        title: p.title,
        slug: p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: p.description ? p.description.replace(/<[^>]*>?/gm, '').trim() : '',
        category: detectedCat,
        status: isLocked ? 'publishing' : (isPublished ? 'live' : 'draft'),
        is_locked: isLocked,
        is_stuck_publishing: isLocked,
        printify_visible: Boolean(p.visible),
        printify_published: isPublished,
        printify_status: isLocked ? 'PUBLISHING' : (isPublished ? 'LIVE' : 'UNPUBLISHED'),
        base_price_cents: minCost,
        retail_price_cents: minPrice,
        mockup_images: sortMockupImages(p.images || []),
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
