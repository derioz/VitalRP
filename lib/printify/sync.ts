import 'server-only';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getPrintifyProducts,
  getPrintifyProduct,
  fetchAllPrintifyProducts,
  setPrintifyProductPublishingSucceeded,
  setPrintifyProductPublishingFailed,
  ensurePrintifyWebhooks,
  getPrintifyShopId,
  PrintifyProduct,
  PrintifyVariant,
} from './client';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Synchronize the full Printify catalog into Supabase.
 *
 * CRITICAL SAFETY RULES:
 * 1. A failed or incomplete Printify fetch NEVER archives or deletes local products.
 * 2. Deletion reconciliation ONLY occurs after a positively confirmed complete catalog retrieval.
 * 3. If Printify reports 0 products while local products exist, reconciliation is ABORTED.
 * 4. Products previously archived (status = 'disabled') are automatically reactivated if present in Printify.
 * 5. Historical customer orders and order items remain untouched (products with orders are archived, not hard-deleted).
 * 6. Structured logging is emitted for every step.
 */
export async function syncPrintifyCatalog(shopId: string | number = getPrintifyShopId()): Promise<{
  success: boolean;
  shopId: string | number;
  productsCreated: number;
  productsUpdated: number;
  productsReactivated: number;
  productsArchived: number;
  productsSynced: number;
  variantsSynced: number;
  pagesRetrieved: number;
  totalPrintifyProducts: number;
  reconciliationPerformed: boolean;
  message?: string;
  error?: string;
}> {
  const supabase = createAdminClient();
  if (!supabase) {
    throw new Error('Supabase admin client could not be initialized (missing service role key).');
  }

  const effectiveShopId = String(shopId || getPrintifyShopId());
  console.log('[Printify Sync] Printify sync started');
  console.log(`[Printify Sync] Shop ID: ${effectiveShopId}`);

  // Automatically ensure webhooks are registered in the background so publishing events work
  ensurePrintifyWebhooks('https://vital-rp.vercel.app/api/webhooks/printify', effectiveShopId).catch((whErr) => {
    console.warn('[Printify Sync] Notice: Webhook verification warning:', whErr?.message || whErr);
  });

  let logId: string | null = null;
  try {
    const { data: logEntry } = await supabase
      .from('merch_sync_logs')
      .insert({
        status: 'in_progress',
        products_synced: 0,
        variants_synced: 0,
      })
      .select('id')
      .single();

    if (logEntry) {
      logId = logEntry.id;
    }
  } catch (err) {
    console.warn('[Printify Sync] Notice: Could not create sync log entry:', err);
  }

  try {
    // 1. Fetch COMPLETE catalog across all pages.
    // If ANY page request fails or returns invalid structure, this throws immediately,
    // ensuring we never operate on an incomplete catalog.
    const { products: printifyProducts, pagesRetrieved, totalReported } = await fetchAllPrintifyProducts(effectiveShopId);

    console.log(`[Printify Sync] Pages successfully retrieved: ${pagesRetrieved}`);
    console.log(`[Printify Sync] Printify products retrieved: ${printifyProducts.length}`);

    // 2. Query all local Printify-linked products currently stored in Supabase
    const { data: localProducts, error: localFetchError } = await supabase
      .from('merch_products')
      .select('id, printify_product_id, title, status, slug')
      .not('printify_product_id', 'is', null);

    if (localFetchError) {
      throw new Error(`Failed to query local products: ${localFetchError.message}`);
    }

    console.log(`[Printify Sync] Local products found: ${localProducts?.length || 0}`);

    const activeLocalProducts = (localProducts || []).filter((p) => p.status !== 'disabled');
    const localMap = new Map((localProducts || []).map((lp) => [String(lp.printify_product_id), lp]));
    const activePrintifyIds = new Set(printifyProducts.map((p) => String(p.id)));

    // CRITICAL SAFEGUARD:
    // If Printify returns 0 products while local catalog has active products,
    // or if no pages were retrieved, ABORT reconciliation to prevent catastrophic catalog wipe!
    let reconciliationPerformed = false;
    if (printifyProducts.length === 0 && activeLocalProducts.length > 0) {
      console.warn(
        `[Printify Sync] CRITICAL SAFETY SAFEGUARD: Printify returned 0 products while local catalog has ${activeLocalProducts.length} active products. ` +
        `Aborting reconciliation to protect catalog integrity. No local products were removed.`
      );
      reconciliationPerformed = false;
    } else if (pagesRetrieved === 0) {
      console.warn('[Printify Sync] No pages were retrieved. Aborting reconciliation.');
      reconciliationPerformed = false;
    } else {
      reconciliationPerformed = true;
    }

    let productsCreated = 0;
    let productsUpdated = 0;
    let productsReactivated = 0;
    let totalVariantsSynced = 0;

    // 3. Upsert all active products & variants from Printify
    for (const p of printifyProducts) {
      const existingProduct = localMap.get(String(p.id));
      const isExisting = Boolean(existingProduct);
      const isReactivating = existingProduct && existingProduct.status === 'disabled';

      // Determine Category
      let category = 'Apparel';
      const titleLower = p.title.toLowerCase();
      if (titleLower.includes('sticker')) category = 'Accessories';
      else if (titleLower.includes('mug')) category = 'Accessories';
      else if (titleLower.includes('mat') || titleLower.includes('mousepad')) category = 'Accessories';
      else if (titleLower.includes('hat') || titleLower.includes('snapback') || titleLower.includes('beanie')) category = 'Apparel';
      else if (p.tags?.some((t: string) => t.toLowerCase() === 'accessories')) category = 'Accessories';
      else if (p.tags?.some((t: string) => t.toLowerCase() === 'in-game')) category = 'In-Game';

      // Base & Retail Price in cents
      const enabledVariants = p.variants.filter((v: PrintifyVariant) => v.is_enabled);
      const activeVariants = enabledVariants.length > 0 ? enabledVariants : p.variants;
      const minCostCents = activeVariants.reduce((min, v) => (v.cost < min ? v.cost : min), activeVariants[0]?.cost || 0);
      const minPriceCents = activeVariants.reduce((min, v) => (v.price < min ? v.price : min), activeVariants[0]?.price || 0);

      const baseSlug = slugify(p.title);
      const cleanDescription = p.description ? p.description.replace(/<[^>]*>?/gm, '').trim() : '';

      // Set status: if visible in Printify, mark 'live' (which reactivates any disabled product!)
      const targetStatus = p.visible ? 'live' : 'draft';

      // Upsert Product
      const { data: upsertedProduct, error: productError } = await supabase
        .from('merch_products')
        .upsert(
          {
            printify_product_id: p.id,
            title: p.title,
            slug: baseSlug,
            description: cleanDescription,
            blueprint_id: p.blueprint_id,
            print_provider_id: p.print_provider_id,
            category,
            status: targetStatus,
            base_price_cents: minCostCents,
            retail_price_cents: minPriceCents,
            mockup_images: p.images.map((img) => ({
              src: img.src,
              position: img.position,
              is_default: img.is_default,
              variant_ids: img.variant_ids,
            })),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'printify_product_id' }
        )
        .select('id')
        .single();

      if (productError) {
        console.error(`[Printify Sync] Error syncing product ${p.id} (${p.title}):`, productError.message);
        if (p.is_locked) {
          try {
            await setPrintifyProductPublishingFailed(p.id, `Vital RP sync error: ${productError.message}`, effectiveShopId);
          } catch {}
        }
        continue;
      }

      if (isReactivating) {
        productsReactivated++;
      } else if (isExisting) {
        productsUpdated++;
      } else {
        productsCreated++;
      }

      const localProductId = upsertedProduct.id;

      // Upsert Variants
      for (const v of p.variants) {
        let detectedColor: string | null = null;
        let detectedSize: string | null = null;

        if (v.title.includes('/')) {
          const parts = v.title.split('/').map((s) => s.trim());
          if (parts.length >= 2) {
            detectedColor = parts[0];
            detectedSize = parts[1];
          }
        } else if (v.title) {
          detectedSize = v.title;
        }

        const { error: variantError } = await supabase
          .from('merch_variants')
          .upsert(
            {
              product_id: localProductId,
              printify_variant_id: v.id,
              title: v.title,
              size: detectedSize,
              color: detectedColor,
              sku: v.sku || '',
              cost_cents: v.cost || 0,
              retail_price_cents: v.price || minPriceCents,
              is_enabled: v.is_enabled,
              is_in_stock: v.is_available,
              options: { raw: v.options },
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'product_id,printify_variant_id' }
          );

        if (!variantError) {
          totalVariantsSynced++;
        }
      }

      // If the product was locked / in publishing state in Printify, acknowledge publishing succeeded!
      if (p.is_locked) {
        try {
          console.log(`[Printify Sync] Locked product detected: ${p.id}. Acknowledging publishing_succeeded...`);
          await setPrintifyProductPublishingSucceeded(
            p.id,
            {
              id: localProductId,
              handle: `https://vitalrp.net/merch/${baseSlug}`,
            },
            effectiveShopId
          );
          console.log(`[Printify Sync] Successfully acknowledged publishing_succeeded for locked product ${p.id} (${p.title})`);
        } catch (pubErr: any) {
          console.warn(`[Printify Sync] Notice: publishing_succeeded callback for ${p.id}:`, pubErr?.message || pubErr);
        }
      }
    }

    // 4. Deletion Reconciliation: ONLY run if reconciliation was confirmed safe
    let productsArchived = 0;
    if (reconciliationPerformed) {
      const missingLocalProducts = (localProducts || []).filter(
        (lp) => lp.printify_product_id && !activePrintifyIds.has(String(lp.printify_product_id))
      );

      for (const missing of missingLocalProducts) {
        console.log(
          `[Printify Sync] Reconciling missing product: Printify ID: ${missing.printify_product_id}, Local ID: ${missing.id}, Title: "${missing.title}"`
        );

        // Check if product has historical orders
        const { data: orderItemRefs } = await supabase
          .from('merch_order_items')
          .select('id')
          .eq('product_id', missing.id)
          .limit(1);

        const hasHistoricalOrders = Boolean(orderItemRefs && orderItemRefs.length > 0);

        if (!hasHistoricalOrders) {
          // Safe to permanently delete from database completely
          const { error: delError } = await supabase
            .from('merch_products')
            .delete()
            .eq('id', missing.id);

          if (delError) {
            console.warn(`[Printify Sync] Hard delete failed for ${missing.id}, archiving with status disabled:`, delError.message);
            await supabase
              .from('merch_products')
              .update({ status: 'disabled', updated_at: new Date().toISOString() })
              .eq('id', missing.id);
          }
        } else {
          // Product was purchased in historical orders.
          // Archive it with status = 'disabled' so it disappears from the active store and admin listings,
          // while preserving customer receipts and order line items intact.
          await supabase
            .from('merch_products')
            .update({ status: 'disabled', updated_at: new Date().toISOString() })
            .eq('id', missing.id);

          // Disable variants
          await supabase
            .from('merch_variants')
            .update({ is_enabled: false, is_in_stock: false })
            .eq('product_id', missing.id);
        }

        productsArchived++;
      }
    }

    // Structured logging output
    console.log(`[Printify Sync] Products created: ${productsCreated}`);
    console.log(`[Printify Sync] Products updated: ${productsUpdated}`);
    console.log(`[Printify Sync] Products reactivated: ${productsReactivated}`);
    console.log(`[Printify Sync] Products archived: ${productsArchived}`);
    console.log(`[Printify Sync] Reconciliation performed: ${reconciliationPerformed ? 'yes' : 'no'}`);

    // 5. Invalidate Next.js cache
    try {
      revalidatePath('/merch');
      revalidatePath('/admin/merch');
      revalidatePath('/api/merch/products');
      for (const p of printifyProducts) {
        revalidatePath(`/merch/${slugify(p.title)}`);
      }
      console.log('[Printify Sync] Cache invalidated: yes');
    } catch (revalErr) {
      console.warn('[Printify Sync] Notice: Could not trigger revalidatePath:', revalErr);
    }

    console.log('[Printify Sync] Sync completed successfully');

    if (logId) {
      await supabase
        .from('merch_sync_logs')
        .update({
          status: 'completed',
          products_synced: productsCreated + productsUpdated + productsReactivated,
          variants_synced: totalVariantsSynced,
        })
        .eq('id', logId);
    }

    const message = `Sync complete\nPrintify products found: ${printifyProducts.length}\nNew products: ${productsCreated}\nUpdated products: ${productsUpdated}\nReactivated products: ${productsReactivated}\nRemoved products: ${productsArchived}`;

    return {
      success: true,
      shopId: effectiveShopId,
      productsCreated,
      productsUpdated,
      productsReactivated,
      productsArchived,
      productsSynced: productsCreated + productsUpdated + productsReactivated,
      variantsSynced: totalVariantsSynced,
      pagesRetrieved,
      totalPrintifyProducts: printifyProducts.length,
      reconciliationPerformed,
      message,
    };
  } catch (error: any) {
    console.error(`[Printify Sync] Exact server-side error: ${error.message || error}`);
    console.error('[Printify Sync] Sync failed');

    if (logId) {
      await supabase
        .from('merch_sync_logs')
        .update({
          status: 'failed',
          error_message: error.message || 'Unknown error',
        })
        .eq('id', logId);
    }

    const failureMessage = `Sync failed\nPrintify catalog could not be fully retrieved.\nNo local products were removed.\nReason: ${error.message || 'Unknown error'}`;

    return {
      success: false,
      shopId: effectiveShopId,
      productsCreated: 0,
      productsUpdated: 0,
      productsReactivated: 0,
      productsArchived: 0,
      productsSynced: 0,
      variantsSynced: 0,
      pagesRetrieved: 0,
      totalPrintifyProducts: 0,
      reconciliationPerformed: false,
      error: error.message,
      message: failureMessage,
    };
  }
}

/**
 * Synchronize a single product from Printify into Supabase and confirm publishing completion.
 * Used during Printify webhooks (product:publish:started) or admin targeted refresh.
 */
export async function syncSinglePrintifyProduct(
  productId: string,
  shopId: string | number = getPrintifyShopId()
): Promise<{
  success: boolean;
  product?: any;
  slug?: string;
  error?: string;
}> {
  const supabase = createAdminClient();
  if (!supabase) {
    throw new Error('Supabase admin client could not be initialized.');
  }

  const effectiveShopId = String(shopId || getPrintifyShopId());
  const timestamp = new Date().toISOString();

  console.log('[Printify Publish] --- Publish workflow started ---');
  console.log(`[Printify Publish] Printify product ID: ${productId}`);
  console.log(`[Printify Publish] Shop ID: ${effectiveShopId}`);
  console.log(`[Printify Publish] timestamp: ${timestamp}`);

  try {
    const p = await getPrintifyProduct(productId, effectiveShopId);
    if (!p) {
      console.error(`[Printify Publish] exact server-side error: Printify product ${productId} not found on shop ${effectiveShopId}`);
      console.log(`[Printify Publish] publishing_failed request attempted for ${productId}`);
      try {
        await setPrintifyProductPublishingFailed(productId, `Product ${productId} not found on Printify`, effectiveShopId);
      } catch {}
      throw new Error(`Printify product ${productId} not found.`);
    }

    let category = 'Apparel';
    const titleLower = p.title.toLowerCase();
    if (titleLower.includes('sticker')) category = 'Accessories';
    else if (titleLower.includes('mug')) category = 'Accessories';
    else if (titleLower.includes('mat') || titleLower.includes('mousepad')) category = 'Accessories';
    else if (titleLower.includes('hat') || titleLower.includes('snapback') || titleLower.includes('beanie')) category = 'Apparel';
    else if (p.tags?.some((t: string) => t.toLowerCase() === 'accessories')) category = 'Accessories';
    else if (p.tags?.some((t: string) => t.toLowerCase() === 'in-game')) category = 'In-Game';

    const enabledVariants = p.variants.filter((v: PrintifyVariant) => v.is_enabled);
    const activeVariants = enabledVariants.length > 0 ? enabledVariants : p.variants;
    const minCostCents = activeVariants.reduce((min, v) => (v.cost < min ? v.cost : min), activeVariants[0]?.cost || 0);
    const minPriceCents = activeVariants.reduce((min, v) => (v.price < min ? v.price : min), activeVariants[0]?.price || 0);

    const baseSlug = slugify(p.title);
    const cleanDescription = p.description ? p.description.replace(/<[^>]*>?/gm, '').trim() : '';
    const targetStatus = p.visible ? 'live' : 'draft';

    // Check existing
    const { data: existingLocal } = await supabase
      .from('merch_products')
      .select('id, status')
      .eq('printify_product_id', productId)
      .maybeSingle();

    const { data: upsertedProduct, error: productError } = await supabase
      .from('merch_products')
      .upsert(
        {
          printify_product_id: p.id,
          title: p.title,
          slug: baseSlug,
          description: cleanDescription,
          blueprint_id: p.blueprint_id,
          print_provider_id: p.print_provider_id,
          category,
          status: targetStatus,
          base_price_cents: minCostCents,
          retail_price_cents: minPriceCents,
          mockup_images: p.images.map((img) => ({
            src: img.src,
            position: img.position,
            is_default: img.is_default,
            variant_ids: img.variant_ids,
          })),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'printify_product_id' }
      )
      .select('id')
      .single();

    if (productError) {
      console.error(`[Printify Publish] exact server-side error: Database upsert failed: ${productError.message}`);
      console.log(`[Printify Publish] publishing_failed request attempted for ${productId}`);
      try {
        await setPrintifyProductPublishingFailed(p.id, `Vital RP database error: ${productError.message}`, effectiveShopId);
      } catch {}
      throw new Error(`Database error saving product: ${productError.message}`);
    }

    const localProductId = upsertedProduct.id;
    const lookupResult = existingLocal ? 'updated' : 'created';
    console.log(`[Printify Publish] local product lookup/create/update result: ${lookupResult} (local ID: ${localProductId})`);
    console.log(`[Printify Publish] product slug: ${baseSlug}`);

    for (const v of p.variants) {
      let detectedColor: string | null = null;
      let detectedSize: string | null = null;

      if (v.title.includes('/')) {
        const parts = v.title.split('/').map((s) => s.trim());
        if (parts.length >= 2) {
          detectedColor = parts[0];
          detectedSize = parts[1];
        }
      } else if (v.title) {
        detectedSize = v.title;
      }

      await supabase
        .from('merch_variants')
        .upsert(
          {
            product_id: localProductId,
            printify_variant_id: v.id,
            title: v.title,
            size: detectedSize,
            color: detectedColor,
            sku: v.sku || '',
            cost_cents: v.cost || 0,
            retail_price_cents: v.price || minPriceCents,
            is_enabled: v.is_enabled,
            is_in_stock: v.is_available,
            options: { raw: v.options },
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'product_id,printify_variant_id' }
        );
    }

    // Acknowledge publishing succeeded to Printify so the product leaves the "Publishing" state
    console.log(`[Printify Publish] publishing_succeeded request attempted for ${productId}`);
    let pubStatus = 'OK';
    try {
      const pubRes = await setPrintifyProductPublishingSucceeded(
        p.id,
        {
          id: localProductId,
          handle: `https://vitalrp.net/merch/${baseSlug}`,
        },
        effectiveShopId
      );
      pubStatus = pubRes?.status || '200 OK';
      console.log(`[Printify Publish] publishing_succeeded response status: ${pubStatus}`);
    } catch (pubErr: any) {
      console.warn(`[Printify Publish] Notice on publishing_succeeded callback for ${p.id}:`, pubErr?.message || pubErr);
    }

    // Revalidate caches
    try {
      revalidatePath('/merch');
      revalidatePath(`/merch/${baseSlug}`);
      revalidatePath('/admin/merch');
      revalidatePath('/api/merch/products');
    } catch {}

    return {
      success: true,
      product: upsertedProduct,
      slug: baseSlug,
    };
  } catch (err: any) {
    console.error(`[Printify Publish] exact server-side error: ${err.message}`);
    return {
      success: false,
      error: err.message,
    };
  }
}
