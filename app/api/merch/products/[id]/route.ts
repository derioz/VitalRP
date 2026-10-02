export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import { recordAuditEvent } from '@/lib/audit/audit-logger';
import {
  getPrintifyProduct,
  setPrintifyProductPublishingFailed,
  setPrintifyProductPublishingSucceeded,
  deletePrintifyProduct,
} from '@/lib/printify/client';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * GET /api/merch/products/[id]
 * Inspect live Printify product state (locked/publishing status) and local database record.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = request.headers.get('origin') || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  };

  const { id: rawId } = await params;
  const productId = rawId ? decodeURIComponent(rawId).trim() : '';

  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required.' }, { status: 400, headers: corsHeaders });
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session || !hasPermission(session.effectivePermissions, 'merch.manage', session.discordId)) {
    return NextResponse.json(
      { error: 'Unauthorized. Requires merch.manage permission.' },
      { status: 403, headers: corsHeaders }
    );
  }

  const supabase = createAdminClient();

  try {
    let printifyProduct: any = null;
    let printifyError: string | null = null;

    try {
      printifyProduct = await getPrintifyProduct(productId);
    } catch (err: any) {
      printifyError = err.message || 'Product not found on Printify';
    }

    let localProduct: any = null;
    if (supabase) {
      const { data } = await supabase
        .from('merch_products')
        .select('*, variants:merch_variants(*)')
        .or(`printify_product_id.eq.${productId},id.eq.${productId},slug.eq.${productId}`)
        .maybeSingle();
      localProduct = data;
    }

    return NextResponse.json({
      success: true,
      productId,
      isLocked: Boolean(printifyProduct?.is_locked),
      isStuckPublishing: Boolean(printifyProduct?.is_locked),
      printifyProduct: printifyProduct ? {
        id: printifyProduct.id,
        title: printifyProduct.title,
        description: printifyProduct.description,
        visible: printifyProduct.visible,
        is_locked: printifyProduct.is_locked,
        variants_count: printifyProduct.variants?.length || 0,
        images: printifyProduct.images?.slice(0, 3) || [],
        created_at: printifyProduct.created_at,
        updated_at: printifyProduct.updated_at,
      } : null,
      localProduct: localProduct ? {
        id: localProduct.id,
        printify_product_id: localProduct.printify_product_id,
        title: localProduct.title,
        slug: localProduct.slug,
        status: localProduct.status,
        variants_count: localProduct.variants?.length || 0,
      } : null,
      printifyError,
    }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to inspect product.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/merch/products/[id]
 * Perform administrative operations on stuck Printify products:
 * - action: 'reset_publishing' -> calls Printify publishing_failed.json to unlock
 * - action: 'delete' -> calls Printify DELETE and cleans local product if successful
 * - action: 'force_delete' -> resets publishing lock first, then calls Printify DELETE and cleans local product
 * - action: 'publish_succeeded' -> marks product as successfully published in Printify
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = request.headers.get('origin') || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  };

  const { id: rawId } = await params;
  const productId = rawId ? decodeURIComponent(rawId).trim() : '';

  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required.' }, { status: 400, headers: corsHeaders });
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session || !hasPermission(session.effectivePermissions, 'merch.manage', session.discordId)) {
    return NextResponse.json(
      { error: 'Unauthorized. Requires merch.manage permission.' },
      { status: 403, headers: corsHeaders }
    );
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const action = body.action || 'reset_publishing';
  const reason = body.reason || 'Reset stuck publishing state';
  const supabase = createAdminClient();

  const timestamp = new Date().toISOString();

  // -------------------------------------------------------------------------
  // Helper: Look up local product so we know both local UUID and Printify ID
  // -------------------------------------------------------------------------
  let localProduct: any = null;
  if (supabase) {
    const { data: dbItem } = await supabase
      .from('merch_products')
      .select('id, printify_product_id, title, slug, status')
      .or(`printify_product_id.eq.${productId},id.eq.${productId},slug.eq.${productId}`)
      .maybeSingle();
    localProduct = dbItem;
  }

  const effectivePrintifyId = localProduct?.printify_product_id || productId;
  const effectiveLocalId = localProduct?.id;

  // -------------------------------------------------------------------------
  // 1. ACTION: RESET PUBLISHING (Unlocks product by reporting publishing failed)
  // -------------------------------------------------------------------------
  if (action === 'reset_publishing') {
    try {
      const printifyRes = await setPrintifyProductPublishingFailed(effectivePrintifyId, reason);

      console.log(`[Printify Admin Action] [${timestamp}] Action: reset_publishing | Product ID: ${effectivePrintifyId} | Admin: ${session.username || session.discordId} | Status: SUCCESS`);

      await recordAuditEvent({
        discordUserId: session.discordId || 'system',
        displayName: session.username || 'Admin',
        action: 'printify.product.reset_publishing',
        target: effectivePrintifyId,
        details: `Reset stuck publishing state for Printify product ${effectivePrintifyId}. Reason: ${reason}`,
        afterData: { success: true, timestamp, printifyRes },
      });

      try {
        revalidatePath('/merch');
        revalidatePath('/admin/merch');
        revalidatePath('/api/merch/products');
      } catch {}

      return NextResponse.json({
        success: true,
        action: 'reset_publishing',
        productId: effectivePrintifyId,
        message: `Stuck publishing state has been cleared in Printify for product ${effectivePrintifyId}. The product is now unlocked.`,
      }, { headers: corsHeaders });
    } catch (err: any) {
      console.error(`[Printify Admin Action] [${timestamp}] Action: reset_publishing | Product ID: ${effectivePrintifyId} | Status: FAILED | Error: ${err.message}`);

      return NextResponse.json({
        success: false,
        action: 'reset_publishing',
        productId: effectivePrintifyId,
        error: `Printify Error: ${err.message}`,
      }, { status: 400, headers: corsHeaders });
    }
  }

  // -------------------------------------------------------------------------
  // 2. ACTION: DELETE PRODUCT (Standard Delete)
  // -------------------------------------------------------------------------
  if (action === 'delete') {
    try {
      // 1. Call Printify DELETE API
      try {
        await deletePrintifyProduct(effectivePrintifyId);
      } catch (printifyErr: any) {
        // If product already doesn't exist on Printify (404), treat as confirmed deleted on Printify
        if (printifyErr.message?.includes('404') || printifyErr.message?.toLowerCase().includes('not found')) {
          console.log(`[Printify Admin Action] Product ${effectivePrintifyId} already deleted from Printify (404), proceeding with local removal.`);
        } else {
          throw printifyErr;
        }
      }

      // 2. Only clean up local database if Printify deletion succeeded
      let localDeleted = false;
      let localArchived = false;

      if (supabase && (effectiveLocalId || effectivePrintifyId)) {
        // Check if this product is referenced in historical customer orders
        const { data: orderItemRefs } = await supabase
          .from('merch_order_items')
          .select('id')
          .or(effectiveLocalId ? `product_id.eq.${effectiveLocalId}` : `printify_product_id.eq.${effectivePrintifyId}`)
          .limit(1);

        const hasHistoricalOrders = Boolean(orderItemRefs && orderItemRefs.length > 0);

        if (!hasHistoricalOrders) {
          // No customer has purchased this product: permanently delete from local database
          const filter = effectiveLocalId
            ? `id.eq.${effectiveLocalId}`
            : `printify_product_id.eq.${effectivePrintifyId}`;

          const { error: dbError } = await supabase
            .from('merch_products')
            .delete()
            .or(filter);

          if (!dbError) {
            localDeleted = true;
          } else {
            console.warn(`[Printify Admin Action] Hard delete failed, falling back to archiving:`, dbError);
            await supabase
              .from('merch_products')
              .update({ status: 'disabled', updated_at: new Date().toISOString() })
              .or(filter);
            localArchived = true;
          }
        } else {
          // Product exists in historical order items.
          // Archive it with status = 'disabled' so it completely disappears from the active store and admin lists,
          // while preserving existing customer orders, order items, and Stripe payment history intact.
          const filter = effectiveLocalId
            ? `id.eq.${effectiveLocalId}`
            : `printify_product_id.eq.${effectivePrintifyId}`;

          await supabase
            .from('merch_products')
            .update({ status: 'disabled', updated_at: new Date().toISOString() })
            .or(filter);

          if (effectiveLocalId) {
            await supabase
              .from('merch_variants')
              .update({ is_enabled: false, is_in_stock: false })
              .eq('product_id', effectiveLocalId);
          }
          localArchived = true;
        }
      }

      console.log(`[Printify Admin Action] [${timestamp}] Action: delete | Product ID: ${effectivePrintifyId} | Admin: ${session.username || session.discordId} | Status: SUCCESS | LocalDeleted: ${localDeleted} | LocalArchived: ${localArchived}`);

      await recordAuditEvent({
        discordUserId: session.discordId || 'system',
        displayName: session.username || 'Admin',
        action: 'printify.product.delete',
        target: effectivePrintifyId,
        details: `Permanently deleted product ${effectivePrintifyId} from Printify. (Local deleted: ${localDeleted}, archived: ${localArchived})`,
        afterData: { success: true, timestamp, localDeleted, localArchived },
      });

      // 3. Invalidate Next.js cache
      try {
        revalidatePath('/merch');
        revalidatePath('/admin/merch');
        revalidatePath('/api/merch/products');
      } catch {}

      return NextResponse.json({
        success: true,
        action: 'delete',
        productId: effectivePrintifyId,
        localDeleted,
        localArchived,
        message: `Product ${effectivePrintifyId} was permanently deleted from Printify and removed from the active catalog.`,
      }, { headers: corsHeaders });
    } catch (err: any) {
      console.error(`[Printify Admin Action] [${timestamp}] Action: delete | Product ID: ${effectivePrintifyId} | Status: FAILED | Error: ${err.message}`);

      // Do NOT delete the local record if Printify deletion failed!
      return NextResponse.json({
        success: false,
        action: 'delete',
        productId: effectivePrintifyId,
        error: `Printify deletion failed: ${err.message}. Local database record was NOT removed. If the product is stuck in "Publishing", click "Reset Publishing" first or use "Force Delete".`,
      }, { status: 400, headers: corsHeaders });
    }
  }

  // -------------------------------------------------------------------------
  // 3. ACTION: FORCE DELETE (Reset Publishing Lock -> DELETE Product)
  // -------------------------------------------------------------------------
  if (action === 'force_delete') {
    try {
      // Step 1: Clear the publishing lock on Printify
      try {
        await setPrintifyProductPublishingFailed(effectivePrintifyId, 'Reset stuck publishing state before force deletion');
      } catch (resetErr: any) {
        console.warn(`[Printify Admin Action] Notice: Could not reset publishing state prior to deletion on ${effectivePrintifyId} (proceeding with delete attempt):`, resetErr?.message || resetErr);
      }

      // Step 2: Brief pause to allow Printify state to settle
      await new Promise((resolve) => setTimeout(resolve, 350));

      // Step 3: Call Printify DELETE API
      try {
        await deletePrintifyProduct(effectivePrintifyId);
      } catch (printifyErr: any) {
        if (printifyErr.message?.includes('404') || printifyErr.message?.toLowerCase().includes('not found')) {
          console.log(`[Printify Admin Action] Product ${effectivePrintifyId} already deleted from Printify during force delete (404), proceeding with local removal.`);
        } else {
          throw printifyErr;
        }
      }

      // Step 4: Safely clean up local database record
      let localDeleted = false;
      let localArchived = false;

      if (supabase && (effectiveLocalId || effectivePrintifyId)) {
        const { data: orderItemRefs } = await supabase
          .from('merch_order_items')
          .select('id')
          .or(effectiveLocalId ? `product_id.eq.${effectiveLocalId}` : `printify_product_id.eq.${effectivePrintifyId}`)
          .limit(1);

        const hasHistoricalOrders = Boolean(orderItemRefs && orderItemRefs.length > 0);

        if (!hasHistoricalOrders) {
          const filter = effectiveLocalId
            ? `id.eq.${effectiveLocalId}`
            : `printify_product_id.eq.${effectivePrintifyId}`;

          const { error: dbError } = await supabase
            .from('merch_products')
            .delete()
            .or(filter);

          if (!dbError) {
            localDeleted = true;
          } else {
            console.warn(`[Printify Admin Action] Hard delete failed during force delete, archiving instead:`, dbError);
            await supabase
              .from('merch_products')
              .update({ status: 'disabled', updated_at: new Date().toISOString() })
              .or(filter);
            localArchived = true;
          }
        } else {
          const filter = effectiveLocalId
            ? `id.eq.${effectiveLocalId}`
            : `printify_product_id.eq.${effectivePrintifyId}`;

          await supabase
            .from('merch_products')
            .update({ status: 'disabled', updated_at: new Date().toISOString() })
            .or(filter);

          if (effectiveLocalId) {
            await supabase
              .from('merch_variants')
              .update({ is_enabled: false, is_in_stock: false })
              .eq('product_id', effectiveLocalId);
          }
          localArchived = true;
        }
      }

      console.log(`[Printify Admin Action] [${timestamp}] Action: force_delete | Product ID: ${effectivePrintifyId} | Admin: ${session.username || session.discordId} | Status: SUCCESS | LocalDeleted: ${localDeleted} | LocalArchived: ${localArchived}`);

      await recordAuditEvent({
        discordUserId: session.discordId || 'system',
        displayName: session.username || 'Admin',
        action: 'printify.product.force_delete',
        target: effectivePrintifyId,
        details: `Force deleted Printify product ${effectivePrintifyId} (reset publishing lock then deleted). Local deleted: ${localDeleted}, archived: ${localArchived}`,
        afterData: { success: true, timestamp, localDeleted, localArchived },
      });

      // Step 5: Invalidate Next.js cache
      try {
        revalidatePath('/merch');
        revalidatePath('/admin/merch');
        revalidatePath('/api/merch/products');
      } catch {}

      return NextResponse.json({
        success: true,
        action: 'force_delete',
        productId: effectivePrintifyId,
        localDeleted,
        localArchived,
        message: `Stuck publishing state was cleared and product ${effectivePrintifyId} was permanently deleted from Printify and removed from the active store.`,
      }, { headers: corsHeaders });
    } catch (err: any) {
      console.error(`[Printify Admin Action] [${timestamp}] Action: force_delete | Product ID: ${effectivePrintifyId} | Status: FAILED | Error: ${err.message}`);

      // Do NOT delete the local record if Printify deletion failed
      return NextResponse.json({
        success: false,
        action: 'force_delete',
        productId: effectivePrintifyId,
        error: `Force deletion failed: ${err.message}. Local database product was preserved.`,
      }, { status: 400, headers: corsHeaders });
    }
  }

  // -------------------------------------------------------------------------
  // 4. ACTION: PUBLISH SUCCEEDED (Acknowledge successful publishing)
  // -------------------------------------------------------------------------
  if (action === 'publish_succeeded') {
    try {
      let slug = body.slug;
      if (!slug && supabase) {
        const { data: dbProd } = await supabase
          .from('merch_products')
          .select('slug')
          .eq('printify_product_id', productId)
          .maybeSingle();
        if (dbProd?.slug) slug = dbProd.slug;
      }
      const handle = `https://vitalrp.net/merch/${slug || productId}`;

      await setPrintifyProductPublishingSucceeded(productId, {
        id: productId,
        handle,
      });

      console.log(`[Printify Admin Action] [${timestamp}] Action: publish_succeeded | Product ID: ${productId} | Admin: ${session.username || session.discordId} | Status: SUCCESS`);

      await recordAuditEvent({
        discordUserId: session.discordId || 'system',
        displayName: session.username || 'Admin',
        action: 'printify.product.publish_succeeded',
        target: productId,
        details: `Confirmed publishing succeeded for Printify product ${productId}`,
        afterData: { success: true, timestamp, handle },
      });

      return NextResponse.json({
        success: true,
        action: 'publish_succeeded',
        productId,
        handle,
        message: `Printify product ${productId} successfully acknowledged as published.`,
      }, { headers: corsHeaders });
    } catch (err: any) {
      console.error(`[Printify Admin Action] [${timestamp}] Action: publish_succeeded | Product ID: ${productId} | Status: FAILED | Error: ${err.message}`);

      return NextResponse.json({
        success: false,
        action: 'publish_succeeded',
        productId,
        error: `Failed to confirm publishing succeeded on Printify: ${err.message}`,
      }, { status: 400, headers: corsHeaders });
    }
  }

  return NextResponse.json(
    { error: `Unknown action: "${action}". Valid actions are 'reset_publishing', 'delete', 'force_delete', 'publish_succeeded'.` },
    { status: 400, headers: corsHeaders }
  );
}

/**
 * DELETE /api/merch/products/[id]
 * Direct HTTP DELETE method for product deletion.
 * Supports ?force=true query parameter to automatically reset stuck publishing lock before deletion.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(request.url);
  const isForce = searchParams.get('force') === 'true';

  const syntheticRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({
      action: isForce ? 'force_delete' : 'delete',
    }),
  });

  return POST(syntheticRequest, { params });
}
