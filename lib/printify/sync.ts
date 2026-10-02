import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getPrintifyProducts,
  getPrintifyProduct,
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
 */
export async function syncPrintifyCatalog(): Promise<{
  success: boolean;
  productsSynced: number;
  variantsSynced: number;
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

  try {
    const response = await getPrintifyProducts(1, 100);
    const printifyProducts = response.data || [];

    let totalProductsSynced = 0;
    let totalVariantsSynced = 0;

    for (const p of printifyProducts) {
      // 1. Determine Category
      let category = 'Apparel';
      const titleLower = p.title.toLowerCase();
      if (titleLower.includes('sticker')) category = 'Accessories';
      else if (titleLower.includes('mug')) category = 'Accessories';
      else if (titleLower.includes('mat') || titleLower.includes('mousepad')) category = 'Accessories';
      else if (titleLower.includes('hat') || titleLower.includes('snapback') || titleLower.includes('beanie')) category = 'Apparel';
      else if (p.tags?.some((t: string) => t.toLowerCase() === 'accessories')) category = 'Accessories';
      else if (p.tags?.some((t: string) => t.toLowerCase() === 'in-game')) category = 'In-Game';

      // 2. Base & Retail Price in cents
      const enabledVariants = p.variants.filter((v: PrintifyVariant) => v.is_enabled);
      const activeVariants = enabledVariants.length > 0 ? enabledVariants : p.variants;
      const minCostCents = activeVariants.reduce((min, v) => (v.cost < min ? v.cost : min), activeVariants[0]?.cost || 0);
      const minPriceCents = activeVariants.reduce((min, v) => (v.price < min ? v.price : min), activeVariants[0]?.price || 0);

      const baseSlug = slugify(p.title);
      // Clean up description HTML tags if any
      const cleanDescription = p.description ? p.description.replace(/<[^>]*>?/gm, '').trim() : '';

      // 3. Upsert Product
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

      totalProductsSynced++;
      const localProductId = upsertedProduct.id;

      // 4. Map options to variant titles
      const colorOption = p.options.find((o) => o.type === 'color' || o.name.toLowerCase() === 'color');
      const sizeOption = p.options.find((o) => o.type === 'size' || o.name.toLowerCase() === 'size');

      // 5. Upsert Variants
      for (const v of p.variants) {
        let detectedColor: string | null = null;
        let detectedSize: string | null = null;

        // Extract option titles from options array
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

    if (logId) {
      await supabase
        .from('merch_sync_logs')
        .update({
          status: 'completed',
          products_synced: totalProductsSynced,
          variants_synced: totalVariantsSynced,
        })
        .eq('id', logId);
    }

    return {
      success: true,
      productsSynced: totalProductsSynced,
      variantsSynced: totalVariantsSynced,
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
      productsSynced: 0,
      variantsSynced: 0,
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
