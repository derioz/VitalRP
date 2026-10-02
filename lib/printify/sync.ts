import 'server-only';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getPrintifyProducts,
  getPrintifyProduct,
  fetchAllPrintifyProducts,
  setPrintifyProductPublishingSucceeded,
  setPrintifyProductPublishingFailed,
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
 * Sync all Printify products and variants into Supabase.
 * - Fetches every page of Printify products before performing deletion checks.
 * - Upserts active products and variants.
 * - Detects local Printify-linked products missing from the active Printify catalog.
 * - Safely archives or deletes missing products while preserving order history.
 * - Revalidates catalog cache.
 */
export async function syncPrintifyCatalog(): Promise<{
  success: boolean;
  productsCreated: number;
  productsUpdated: number;
  productsArchived: number;
  productsSynced: number;
  variantsSynced: number;
  pagesRetrieved: number;
  totalPrintifyProducts: number;
  message?: string;
  error?: string;
}> {
  const supabase = createAdminClient();
  if (!supabase) {
    throw new Error('Supabase admin client could not be initialized (missing service role key).');
  }

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
    console.warn('Could not create sync log entry:', err);
  }

  console.log('[Printify Sync] Printify sync started');

  try {
    // 1. Fetch the COMPLETE catalog across all pages.
    // If any page request fails, this will throw, preventing any premature deletion checks.
    const { products: printifyProducts, pagesRetrieved, totalReported } = await fetchAllPrintifyProducts();

    console.log(`[Printify Sync] Printify pages retrieved: ${pagesRetrieved}`);
    console.log(`[Printify Sync] Printify products retrieved: ${printifyProducts.length}`);

    // 2. Query all local Printify-linked products currently stored in Supabase
    const { data: localProducts, error: localFetchError } = await supabase
      .from('merch_products')
      .select('id, printify_product_id, title, status, slug')
      .not('printify_product_id', 'is', null);

    if (localFetchError) {
      throw new Error(`Failed to query local products: ${localFetchError.message}`);
    }

    console.log(`[Printify Sync] Local Printify products: ${localProducts?.length || 0}`);

    const activePrintifyIds = new Set(printifyProducts.map((p) => String(p.id)));
    const localMap = new Map((localProducts || []).map((lp) => [String(lp.printify_product_id), lp]));

    let productsCreated = 0;
    let productsUpdated = 0;
    let totalVariantsSynced = 0;

    // 3. Upsert all active products & variants from Printify
    for (const p of printifyProducts) {
      const isExisting = localMap.has(String(p.id));

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
      // Clean up description HTML tags if any
      const cleanDescription = p.description ? p.description.replace(/<[^>]*>?/gm, '').trim() : '';

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
            status: p.visible ? 'live' : 'draft',
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
        console.error(`Error syncing product ${p.id} (${p.title}):`, productError);
        if (p.is_locked) {
          try {
            await setPrintifyProductPublishingFailed(p.id, `Vital RP sync failed: ${productError.message}`);
          } catch (failErr) {
            console.warn(`[Printify Sync] Notice: Could not set publishing_failed for ${p.id}:`, failErr);
          }
        }
        continue;
      }

      if (isExisting) {
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

      // If the product was locked / in publishing state in Printify, confirm publishing succeeded!
      if (p.is_locked) {
        try {
          await setPrintifyProductPublishingSucceeded(p.id, {
            id: localProductId,
            handle: `https://vitalrp.net/merch/${baseSlug}`,
          });
          console.log(`[Printify Sync] Successfully confirmed publishing_succeeded for locked product ${p.id} (${p.title})`);
        } catch (pubErr: any) {
          console.warn(`[Printify Sync] Notice: Could not confirm publishing_succeeded for ${p.id}:`, pubErr?.message || pubErr);
        }
      }
    }

    // 4. Deletion Reconciliation: Detect local Printify-linked products that no longer exist in Printify
    let productsArchived = 0;
    const missingLocalProducts = (localProducts || []).filter(
      (lp) => lp.printify_product_id && !activePrintifyIds.has(String(lp.printify_product_id))
    );

    for (const missing of missingLocalProducts) {
      console.log(
        `[Printify Sync] Archiving/removing missing product: Printify ID: ${missing.printify_product_id}, Local ID: ${missing.id}, Title: "${missing.title}"`
      );

      // Check if this product has historical orders in merch_order_items
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
        // while preserving historical customer orders and order items intact.
        await supabase
          .from('merch_products')
          .update({ status: 'disabled', updated_at: new Date().toISOString() })
          .eq('id', missing.id);

        // Disable all variants as well
        await supabase
          .from('merch_variants')
          .update({ is_enabled: false, is_in_stock: false })
          .eq('product_id', missing.id);
      }

      productsArchived++;
    }

    console.log(`[Printify Sync] Products created: ${productsCreated}`);
    console.log(`[Printify Sync] Products updated: ${productsUpdated}`);
    console.log(`[Printify Sync] Products archived because missing from Printify: ${productsArchived}`);
    console.log('[Printify Sync] Sync completed successfully');

    // 5. Invalidate Next.js cache
    try {
      revalidatePath('/merch');
      revalidatePath('/admin/merch');
      revalidatePath('/api/merch/products');
    } catch (revalErr) {
      console.warn('[Printify Sync] Notice: Could not trigger revalidatePath:', revalErr);
    }

    if (logId) {
      await supabase
        .from('merch_sync_logs')
        .update({
          status: 'completed',
          products_synced: productsCreated + productsUpdated,
          variants_synced: totalVariantsSynced,
        })
        .eq('id', logId);
    }

    const message = productsArchived > 0
      ? `Sync complete\n${productsUpdated} products updated\n${productsCreated} products added\n${productsArchived} deleted products removed`
      : `Sync complete\n${productsUpdated} products updated\n${productsCreated} products added\n0 products removed`;

    return {
      success: true,
      productsCreated,
      productsUpdated,
      productsArchived,
      productsSynced: productsCreated + productsUpdated,
      variantsSynced: totalVariantsSynced,
      pagesRetrieved,
      totalPrintifyProducts: printifyProducts.length,
      message,
    };
  } catch (error: any) {
    console.error('Fatal error during Printify catalog sync:', error);
    if (logId) {
      await supabase
        .from('merch_sync_logs')
        .update({
          status: 'failed',
          error_message: error.message || 'Unknown error',
        })
        .eq('id', logId);
    }
    return {
      success: false,
      productsCreated: 0,
      productsUpdated: 0,
      productsArchived: 0,
      productsSynced: 0,
      variantsSynced: 0,
      pagesRetrieved: 0,
      totalPrintifyProducts: 0,
      error: error.message,
    };
  }
}

/**
 * Synchronize a single product from Printify into Supabase and confirm publishing completion.
 */
export async function syncSinglePrintifyProduct(productId: string): Promise<{
  success: boolean;
  product?: any;
  error?: string;
}> {
  const supabase = createAdminClient();
  if (!supabase) {
    throw new Error('Supabase admin client could not be initialized.');
  }

  try {
    const p = await getPrintifyProduct(productId);
    if (!p) {
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
          status: p.visible ? 'live' : 'draft',
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
      if (p.is_locked) {
        try {
          await setPrintifyProductPublishingFailed(p.id, `Vital RP sync error: ${productError.message}`);
        } catch {}
      }
      throw new Error(`Database error saving product: ${productError.message}`);
    }

    const localProductId = upsertedProduct.id;

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

    // Acknowledge publishing succeeded to Printify so the product is not stuck in Publishing
    try {
      await setPrintifyProductPublishingSucceeded(p.id, {
        id: localProductId,
        handle: `https://vitalrp.net/merch/${baseSlug}`,
      });
      console.log(`[Printify Sync] Successfully notified Printify publishing_succeeded for single product ${p.id}`);
    } catch (pubErr: any) {
      console.warn(`[Printify Sync] Notice on single sync publishing_succeeded for ${p.id}:`, pubErr?.message || pubErr);
    }

    return {
      success: true,
      product: upsertedProduct,
    };
  } catch (err: any) {
    console.error(`[Printify Sync] Failed to sync single product ${productId}:`, err);
    try {
      await setPrintifyProductPublishingFailed(productId, err.message || 'Sync failed');
    } catch {}
    return {
      success: false,
      error: err.message,
    };
  }
}
