export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
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
  // 1. ACTION: RESET PUBLISHING (Unlocks product by reporting publishing failed)
  // -------------------------------------------------------------------------
  if (action === 'reset_publishing') {
    try {
      const printifyRes = await setPrintifyProductPublishingFailed(productId, reason);

      console.log(`[Printify Admin Action] [${timestamp}] Action: reset_publishing | Product ID: ${productId} | Admin: ${session.username || session.discordId} | Status: SUCCESS`);

      await recordAuditEvent({
        discordUserId: session.discordId || 'system',
        displayName: session.username || 'Admin',
        action: 'printify.product.reset_publishing',
        target: productId,
        details: `Reset stuck publishing state for Printify product ${productId}. Reason: ${reason}`,
        afterData: { success: true, timestamp, printifyRes },
      });

      return NextResponse.json({
        success: true,
        action: 'reset_publishing',
        productId,
        message: `Stuck publishing state has been cleared in Printify for product ${productId}. The product is now unlocked.`,
      }, { headers: corsHeaders });
    } catch (err: any) {
      console.error(`[Printify Admin Action] [${timestamp}] Action: reset_publishing | Product ID: ${productId} | Status: FAILED | Error: ${err.message}`);

      return NextResponse.json({
        success: false,
        action: 'reset_publishing',
        productId,
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
      await deletePrintifyProduct(productId);

      // 2. Only clean up local database if Printify deletion succeeded
      let localDeleted = false;
      if (supabase) {
        const { error: dbError } = await supabase
          .from('merch_products')
          .delete()
          .eq('printify_product_id', productId);

        if (!dbError) {
          localDeleted = true;
        } else {
          console.warn(`[Printify Admin Action] Could not clean up local product record:`, dbError);
        }
      }

      console.log(`[Printify Admin Action] [${timestamp}] Action: delete | Product ID: ${productId} | Admin: ${session.username || session.discordId} | Status: SUCCESS | LocalDeleted: ${localDeleted}`);

      await recordAuditEvent({
        discordUserId: session.discordId || 'system',
        displayName: session.username || 'Admin',
        action: 'printify.product.delete',
        target: productId,
        details: `Permanently deleted product ${productId} from Printify. (Local record deleted: ${localDeleted})`,
        afterData: { success: true, timestamp, localDeleted },
      });

      return NextResponse.json({
        success: true,
        action: 'delete',
        productId,
        localDeleted,
        message: `Product ${productId} was permanently deleted from Printify and the local catalog.`,
      }, { headers: corsHeaders });
    } catch (err: any) {
      console.error(`[Printify Admin Action] [${timestamp}] Action: delete | Product ID: ${productId} | Status: FAILED | Error: ${err.message}`);

      // Do NOT delete the local record if Printify deletion failed!
      return NextResponse.json({
        success: false,
        action: 'delete',
        productId,
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
        await setPrintifyProductPublishingFailed(productId, 'Reset stuck publishing state before force deletion');
      } catch (resetErr: any) {
        console.warn(`[Printify Admin Action] Notice: Could not reset publishing state prior to deletion on ${productId} (proceeding with delete attempt):`, resetErr?.message || resetErr);
      }

      // Step 2: Brief pause to allow Printify state to settle
      await new Promise((resolve) => setTimeout(resolve, 350));

      // Step 3: Call Printify DELETE API
      await deletePrintifyProduct(productId);

      // Step 4: Safely clean up local database record
      let localDeleted = false;
      if (supabase) {
        const { error: dbError } = await supabase
          .from('merch_products')
          .delete()
          .eq('printify_product_id', productId);

        if (!dbError) {
          localDeleted = true;
        } else {
          console.warn(`[Printify Admin Action] Could not clean up local product record during force delete:`, dbError);
        }
      }

      console.log(`[Printify Admin Action] [${timestamp}] Action: force_delete | Product ID: ${productId} | Admin: ${session.username || session.discordId} | Status: SUCCESS | LocalDeleted: ${localDeleted}`);

      await recordAuditEvent({
        discordUserId: session.discordId || 'system',
        displayName: session.username || 'Admin',
        action: 'printify.product.force_delete',
        target: productId,
        details: `Force deleted Printify product ${productId} (reset publishing lock then deleted). Local record deleted: ${localDeleted}`,
        afterData: { success: true, timestamp, localDeleted },
      });

      return NextResponse.json({
        success: true,
        action: 'force_delete',
        productId,
        localDeleted,
        message: `Stuck publishing state was cleared and product ${productId} was permanently deleted from Printify and the local store.`,
      }, { headers: corsHeaders });
    } catch (err: any) {
      console.error(`[Printify Admin Action] [${timestamp}] Action: force_delete | Product ID: ${productId} | Status: FAILED | Error: ${err.message}`);

      // Do NOT delete the local record if Printify deletion failed
      return NextResponse.json({
        success: false,
        action: 'force_delete',
        productId,
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
